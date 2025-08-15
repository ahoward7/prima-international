use tauri::Manager;

mod local_db;
use local_db::LocalDatabase;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Initialize local SQLite database
      let app_data = app.path().app_data_dir().or_else(|_| app.path().app_config_dir())?;
      std::fs::create_dir_all(&app_data).ok();
      let db_path = app_data.join("offline_database.db");
      
      // Initialize the database
      let local_db = LocalDatabase::new(db_path)?;
      
      // Store database in app state for access from HTTP handlers
      app.manage(local_db);

      // Start offline HTTP server in background
      let app_handle = app.handle().clone();
      std::thread::spawn(move || {
        if let Err(e) = crate::offline_server::start_blocking(app_handle) {
          log::error!("offline server error: {e}");
        }
      });
      
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

mod offline_server {
  #![allow(non_snake_case)]
  use std::fs;
  use axum::{routing::{get, post}, Router, Json, extract::{Path, Query, State}, response::IntoResponse};
  use axum::response::Response;
  use serde::{Deserialize, Serialize};
  use tauri::{AppHandle, Manager};
  use reqwest::Client as HttpClient;
  use crate::local_db::{LocalDatabase, Contact, DBMachine, ArchivedMachine, SoldMachine};

  #[derive(Deserialize)]
  struct ListQuery {
    location: Option<String>,
    search: Option<String>,
    pageSize: Option<usize>,
    page: Option<usize>,
    #[allow(dead_code)]
    sortBy: Option<String>,
    model: Option<String>,
    r#type: Option<String>,
    contactId: Option<String>,
  }

  #[derive(Clone)]
  struct AppCtx {
    local_db: LocalDatabase,
  }

  pub fn start_blocking(app: AppHandle) -> anyhow::Result<()> {
    // Get the local database from app state
    let local_db = app.state::<LocalDatabase>().inner().clone();

    // Fire-and-forget initial sync when we can reach the primary Nuxt API
    let local_db_clone = local_db.clone();
    std::thread::spawn(move || {
      let rt = tokio::runtime::Runtime::new().ok();
      if let Some(rt) = rt {
        let _ = rt.block_on(initial_sync(local_db_clone, None));
      }
    });

    let ctx = AppCtx { local_db };
    
  // Offline HTTP API surface mirrors the Nuxt server for inventory UI to consume
  let app = Router::new()
      .route("/health", get(health))
      .route("/api/machines", get(list_machines_api).post(create_machine_api))
      .route("/api/machines/:id", get(get_machine_api).put(update_machine_api).delete(delete_machine_api))
      .route("/api/machines/filters", get(get_filters_api))
      .route("/api/machines/locations", get(get_locations_api))
      .route("/api/machines/archive", post(archive_machine_api))
      .route("/api/machines/sold", post(sell_machine_api))
      .route("/api/sync", post(sync_api))
      .route("/api/contact", get(list_contacts_api))
      .with_state(ctx);

    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], 27271));
    log::info!("Starting offline server on http://{addr}");
    
    let rt = tokio::runtime::Runtime::new()?;
    rt.block_on(async move {
      axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap();
    });
    
    Ok(())
  }

  async fn shutdown_signal() {
    let _ = tokio::signal::ctrl_c().await;
    log::info!("Shutting down offline server");
  }

  async fn health(State(_ctx): State<AppCtx>) -> impl IntoResponse {
    Json(serde_json::json!({"ok": true, "database": "sqlite"}))
  }

  async fn initial_sync(local_db: LocalDatabase, base_override: Option<String>) -> anyhow::Result<()> {
    // Determine if we can reach the online Nuxt server
    let http = HttpClient::new();

    // Build candidate base URLs (prefer override, then env, then local dev)
    let mut candidates: Vec<String> = Vec::new();
    if let Some(b) = base_override {
      candidates.push(b);
    } else if let Ok(env_base) = std::env::var("PRIMA_ONLINE_BASE") {
      if !env_base.trim().is_empty() { candidates.push(env_base); }
    }
    // Local dev fallbacks
    candidates.push("http://127.0.0.1:3000".to_string());
    candidates.push("http://localhost:3000".to_string());

    // Probe candidates for reachability
    let timeout = std::time::Duration::from_secs(5);
    let mut base: Option<String> = None;
    for cand in &candidates {
      let probe_url = format!("{}/api/machines?location=located&pageSize=1&page=1", cand);
      let ok = http
        .get(&probe_url)
        .timeout(timeout)
        .send()
        .await
        .map(|r| r.status().is_success())
        .unwrap_or(false);
      if ok {
        base = Some(cand.clone());
        break;
      } else {
        log::warn!("Sync probe failed for {}", cand);
      }
    }

    let Some(base) = base else {
      log::warn!("Cannot reach any online server for sync; skipping initial sync");
      return Ok(());
    };

    log::info!("Starting initial sync with online server");

    // Clear existing data and pull fresh data
    local_db.clear_all_data()?;

    // Pull all datasets
    let machines = fetch_all_machines(&http, &base, "located").await?;
    let archived = fetch_all_archived(&http, &base).await?;
    let sold = fetch_all_sold(&http, &base).await?;
    let contacts = fetch_contacts(&http, &base).await?;

    // Bulk insert into local database
    if !contacts.is_empty() {
      local_db.bulk_insert_contacts(&contacts)?;
    }
    if !machines.is_empty() {
      local_db.bulk_insert_machines(&machines)?;
    }
    // TODO: Add bulk insert methods for archived and sold machines

    log::info!("Initial sync completed: {} machines, {} contacts", machines.len(), contacts.len());
    Ok(())
  }

  async fn sync_api(State(ctx): State<AppCtx>, Query(q): Query<std::collections::HashMap<String, String>>) -> Response {
    let base = q.get("base").cloned();
    match initial_sync(ctx.local_db.clone(), base).await {
      Ok(_) => {
        // Get counts from database
        let machines_count = ctx.local_db.get_machines(None, None, None, None, 0, 0)
          .map(|(_, total)| total).unwrap_or(0);
        let contacts_count = ctx.local_db.get_contacts(None, 0, 0)
          .map(|(_, total)| total).unwrap_or(0);
        
        Json(serde_json::json!({
          "ok": true, 
          "counts": {
            "machines": machines_count,
            "contacts": contacts_count,
            "archives": 0, // TODO: implement
            "sold": 0     // TODO: implement
          }
        })).into_response()
      }
      Err(e) => {
        (axum::http::StatusCode::INTERNAL_SERVER_ERROR, 
         Json(serde_json::json!({"ok": false, "error": e.to_string()}))).into_response()
      }
    }
  }

  async fn fetch_all_machines(http: &HttpClient, base: &str, location: &str) -> anyhow::Result<Vec<DBMachine>> {
    let mut page = 1usize;
    let mut machines = Vec::new();
    
    loop {
      let url = format!("{}/api/machines?location={}&pageSize=100&page={}", base, location, page);
      let res = http.get(&url).send().await?;
      
      if !res.status().is_success() {
        break;
      }
      
      let json: serde_json::Value = res.json().await?;
      let items = json.get("data")
        .and_then(|d| d.get("data"))
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();
        
      if items.is_empty() {
        break;
      }
      
      for item in items {
        if let Ok(machine) = serde_json::from_value::<DBMachine>(item) {
          machines.push(machine);
        }
      }
      
      page += 1;
    }
    
    Ok(machines)
  }

  async fn fetch_all_archived(_http: &HttpClient, _base: &str) -> anyhow::Result<Vec<ArchivedMachine>> {
    // TODO: Implement archived machines fetching
    Ok(Vec::new())
  }

  async fn fetch_all_sold(_http: &HttpClient, _base: &str) -> anyhow::Result<Vec<SoldMachine>> {
    // TODO: Implement sold machines fetching
    Ok(Vec::new())
  }

  async fn fetch_contacts(http: &HttpClient, base: &str) -> anyhow::Result<Vec<Contact>> {
    let mut page = 1usize;
    let mut contacts = Vec::new();
    
    loop {
      let url = format!("{}/api/contact?pageSize=100&page={}", base, page);
      let res = http.get(&url).send().await?;
      
      if !res.status().is_success() {
        break;
      }
      
      let json: serde_json::Value = res.json().await?;
      let items = json.get("data")
        .and_then(|d| d.get("data"))
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();
        
      if items.is_empty() {
        break;
      }
      
      for item in items {
        if let Ok(contact) = serde_json::from_value::<Contact>(item) {
          contacts.push(contact);
        }
      }
      
      page += 1;
    }
    
    Ok(contacts)
  }

  // API Handlers
  async fn list_machines_api(State(ctx): State<AppCtx>, Query(q): Query<ListQuery>) -> Response {
    let page = q.page.unwrap_or(1).max(1);
    let size = q.pageSize.unwrap_or(20).max(1);
    let offset = (page - 1) * size;

    // Treat `location=located` as the active inventory (machines table). Don't filter by the
    // location column in this case, or you'll get zero results.
    let loc_param: Option<&str> = match q.location.as_deref() {
      Some(s) if s.eq_ignore_ascii_case("located") || s.trim().is_empty() => None,
      other => other,
    };

    match ctx.local_db.get_machines(
      q.search.as_deref(),
      q.model.as_deref(),
      q.r#type.as_deref(),
      q.contactId.as_deref(),
      loc_param,
      q.sortBy.as_deref(),
      size,
      offset
    ) {
      Ok((machines, total)) => {
        Json(serde_json::json!({
          "data": {
            "data": machines,
            "total": total
          }
        })).into_response()
      }
      Err(e) => {
        log::error!("Failed to get machines: {}", e);
        (axum::http::StatusCode::INTERNAL_SERVER_ERROR,
         Json(serde_json::json!({"error": "Failed to get machines"}))).into_response()
      }
    }
  }

  async fn get_machine_api(State(ctx): State<AppCtx>, Path(id): Path<String>) -> Response {
    log::info!("🔍 GET /api/machines/{} - Fetching machine details from lib_sqlite.rs", id);
    
    // For simplicity, search through machines first
  match ctx.local_db.get_machines(None, None, None, None, None, None, 1000, 0) {
      Ok((machines, _)) => {
        let machine = machines.into_iter().find(|m| m.m_id == id);
        if machine.is_some() {
          log::info!("✅ Found machine with ID: {} in lib_sqlite.rs", id);
        } else {
          log::warn!("❌ Machine not found with ID: {} in lib_sqlite.rs", id);
        }
        Json(serde_json::json!({"data": machine})).into_response()
      }
      Err(e) => {
        log::error!("💥 Failed to get machine from lib_sqlite.rs: {}", e);
        (axum::http::StatusCode::INTERNAL_SERVER_ERROR,
         Json(serde_json::json!({"error": "Failed to get machine"}))).into_response()
      }
    }
  }

  async fn create_machine_api(State(ctx): State<AppCtx>, Json(body): Json<serde_json::Value>) -> Response {
    let now = chrono::Utc::now().to_rfc3339();
    let machine_id = ctx.local_db.generate_id();

    // Create machine from JSON body
    let machine = DBMachine {
      m_id: machine_id.clone(),
      contact_id: body.get("contactId")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string()),
  contact: None,
      serial_number: body.get("serialNumber")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string()),
      model: body.get("model")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string()),
      r#type: body.get("type")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string()),
      year: body.get("year").and_then(|v| v.as_i64()),
      hours: body.get("hours").and_then(|v| v.as_i64()),
      description: body.get("description")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string()),
      salesman: body.get("salesman")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string()),
      create_date: now.clone(),
      last_mod_date: now,
      price: body.get("price").and_then(|v| v.as_f64()),
      location: body.get("location")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string()),
      notes: body.get("notes")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string()),
  extra_fields: std::collections::HashMap::new(),
    };

    match ctx.local_db.create_machine(&machine) {
      Ok(_) => {
        Json(serde_json::json!({
          "data": {
            "success": true,
            "machine": machine
          }
        })).into_response()
      }
      Err(e) => {
        log::error!("Failed to create machine: {}", e);
        (axum::http::StatusCode::INTERNAL_SERVER_ERROR,
         Json(serde_json::json!({"error": "Failed to create machine"}))).into_response()
      }
    }
  }

  async fn update_machine_api(State(ctx): State<AppCtx>, Path(id): Path<String>, Json(body): Json<serde_json::Value>) -> Response {
    // Get existing machine first
  match ctx.local_db.get_machines(None, None, None, None, None, None, 1000, 0) {
      Ok((machines, _)) => {
        if let Some(mut machine) = machines.into_iter().find(|m| m.m_id == id) {
          // Update fields from body
          if let Some(contact_id) = body.get("contactId").and_then(|v| v.as_str()) {
            machine.contact_id = Some(contact_id.to_string());
          }
          if let Some(serial) = body.get("serialNumber").and_then(|v| v.as_str()) {
            machine.serial_number = Some(serial.to_string());
          }
          // Add other field updates as needed...

          match ctx.local_db.update_machine(&machine) {
            Ok(_) => {
              Json(serde_json::json!({
                "data": {
                  "success": true,
                  "machine": machine
                }
              })).into_response()
            }
            Err(e) => {
              log::error!("Failed to update machine: {}", e);
              (axum::http::StatusCode::INTERNAL_SERVER_ERROR,
               Json(serde_json::json!({"error": "Failed to update machine"}))).into_response()
            }
          }
        } else {
          (axum::http::StatusCode::NOT_FOUND,
           Json(serde_json::json!({"error": "Machine not found"}))).into_response()
        }
      }
      Err(e) => {
        log::error!("Failed to get machine for update: {}", e);
        (axum::http::StatusCode::INTERNAL_SERVER_ERROR,
         Json(serde_json::json!({"error": "Failed to get machine"}))).into_response()
      }
    }
  }

  async fn delete_machine_api(State(ctx): State<AppCtx>, Path(id): Path<String>) -> Response {
    match ctx.local_db.delete_machine(&id) {
      Ok(_) => (axum::http::StatusCode::NO_CONTENT, ()).into_response(),
      Err(e) => {
        log::error!("Failed to delete machine: {}", e);
        (axum::http::StatusCode::INTERNAL_SERVER_ERROR,
         Json(serde_json::json!({"error": "Failed to delete machine"}))).into_response()
      }
    }
  }

  async fn archive_machine_api(State(ctx): State<AppCtx>, Json(body): Json<serde_json::Value>) -> Response {
    // TODO: Implement archive functionality
    Json(serde_json::json!({"error": "Archive not yet implemented"})).into_response()
  }

  async fn sell_machine_api(State(ctx): State<AppCtx>, Json(body): Json<serde_json::Value>) -> Response {
    // TODO: Implement sell functionality
    Json(serde_json::json!({"error": "Sell not yet implemented"})).into_response()
  }

  async fn get_filters_api(State(ctx): State<AppCtx>) -> Response {
    // Pull distinct values and drop blanks/whitespace-only entries
    let clean = |mut v: Vec<String>| -> Vec<String> {
      v.retain(|s| !s.trim().is_empty());
      v.into_iter().map(|s| s.trim().to_string()).collect()
    };

    let models = clean(ctx.local_db.get_distinct_values("model", "machines").unwrap_or_default());
    let types = clean(ctx.local_db.get_distinct_values("type", "machines").unwrap_or_default());
    let salesmen = clean(ctx.local_db.get_distinct_values("salesman", "machines").unwrap_or_default());

    let to_opts = |vals: Vec<String>| -> Vec<serde_json::Value> {
      vals.into_iter()
        .map(|value| serde_json::json!({"label": value.clone(), "data": value}))
        .collect()
    };

    let models_json = to_opts(models);
    let types_json = to_opts(types);
    let salesmen_json = to_opts(salesmen);

    log::info!(
      "Filters: models={}, types={}, salesmen={}",
      models_json.len(), types_json.len(), salesmen_json.len()
    );

    Json(serde_json::json!({
      "data": {
        "model": models_json,
        "type": types_json,
        "salesman": salesmen_json,
        "location": [
          {"label": "Located", "data": "located"},
          {"label": "Sold", "data": "sold"},
          {"label": "Archived", "data": "archived"}
        ],
        "displayFormat": [
          {"label": "One Line", "data": "oneLine"},
          {"label": "Two Line", "data": "twoLine"},
          {"label": "Two Line Truncated", "data": "twoLineTruncated"}
        ],
        "pageSize": [
          {"label": "10", "data": 10},
          {"label": "20", "data": 20},
          {"label": "30", "data": 30},
          {"label": "40", "data": 40},
          {"label": "50", "data": 50},
          {"label": "100", "data": 100}
        ]
      }
    })).into_response()
  }

  async fn get_locations_api(State(_ctx): State<AppCtx>, Query(_q): Query<std::collections::HashMap<String, String>>) -> Response {
    // TODO: Implement locations lookup
    Json(serde_json::json!({
      "data": {
        "located": [],
        "archived": [],
        "sold": []
      }
    })).into_response()
  }

  async fn list_contacts_api(State(ctx): State<AppCtx>, Query(q): Query<std::collections::HashMap<String, String>>) -> Response {
    let search = q.get("search").cloned();
    let page = q.get("page").and_then(|v| v.parse::<usize>().ok()).unwrap_or(1).max(1);
    let size = q.get("pageSize").and_then(|v| v.parse::<usize>().ok()).unwrap_or(10).max(1);
    let offset = (page - 1) * size;

    match ctx.local_db.get_contacts(search.as_deref(), size, offset) {
      Ok((contacts, total)) => {
        Json(serde_json::json!({
          "data": {
            "data": contacts,
            "total": total
          }
        })).into_response()
      }
      Err(e) => {
        log::error!("Failed to get contacts: {}", e);
        (axum::http::StatusCode::INTERNAL_SERVER_ERROR,
         Json(serde_json::json!({"error": "Failed to get contacts"}))).into_response()
      }
    }
  }
}
