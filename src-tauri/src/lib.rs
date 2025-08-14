use tauri::Manager;
use mongodb::{Client as MongoClient, options::ClientOptions, Collection};
use bson::{doc, Document};

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
      
      log::info!("Initializing SQLite database at: {}", db_path.display());
      
      // Initialize the database
      match LocalDatabase::new(db_path) {
        Ok(local_db) => {
          log::info!("SQLite database initialized successfully");
          // Store database in app state for access from HTTP handlers
          app.manage(local_db);
        }
        Err(e) => {
          log::error!("Failed to initialize SQLite database: {}", e);
          return Err(e.into());
        }
      }
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
  use std::collections::HashMap;
  use axum::{routing::{get, post}, Router, Json, extract::{Path, Query, State}, response::IntoResponse};
  use axum::response::Response;
  use serde::Deserialize;
  use tauri::{AppHandle, Manager};
  use crate::local_db::{LocalDatabase, Contact, DBMachine, ArchivedMachine, SoldMachine};
  use mongodb::{Client as MongoClient, options::ClientOptions, Collection, Database};
  use bson::{doc, Document};
  use futures_util::stream::StreamExt;
  use serde_json::to_value;

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

  async fn initial_sync(local_db: LocalDatabase, mongo_uri_override: Option<String>) -> anyhow::Result<()> {
    // Default MongoDB connection string - you can override this
    let mongo_uri = mongo_uri_override.as_deref()
      .unwrap_or("mongodb+srv://averydhoward:devpassword@prima.6kie7z4.mongodb.net/prima"); // Change this to your MongoDB connection string
    
    log::info!("Attempting to sync with MongoDB at: {}", mongo_uri);
    
    // Connect to MongoDB
    let client_options = ClientOptions::parse(mongo_uri).await?;
    let mongo_client = MongoClient::with_options(client_options)?;
    
    // Test connection
    match mongo_client.database("admin").run_command(doc! {"ping": 1}, None).await {
      Ok(_) => log::info!("Successfully connected to MongoDB"),
      Err(e) => {
        log::warn!("Cannot reach MongoDB for sync - operating in offline mode: {}", e);
        return Ok(());
      }
    }

    log::info!("Starting initial sync with MongoDB");

    // Clear existing data and pull fresh data
    local_db.clear_all_data()?;

    // Assuming your database is named "prima" - change this to your actual database name
    let db = mongo_client.database("prima");
    
    // Fetch all collections
    let machines = fetch_machines_from_mongo(&db).await?;
    let archived = fetch_archived_from_mongo(&db).await?;
    let sold = fetch_sold_from_mongo(&db).await?;
    let contacts = fetch_contacts_from_mongo(&db).await?;

    // Bulk insert into local database
    if !contacts.is_empty() {
      local_db.bulk_insert_contacts(&contacts)?;
      log::info!("Synced {} contacts", contacts.len());
    }
    if !machines.is_empty() {
      local_db.bulk_insert_machines(&machines)?;
      log::info!("Synced {} machines", machines.len());
    }
    if !archived.is_empty() {
      local_db.bulk_insert_archived(&archived)?;
      log::info!("Synced {} archived machines", archived.len());
    }
    if !sold.is_empty() {
      local_db.bulk_insert_sold(&sold)?;
      log::info!("Synced {} sold machines", sold.len());
    }

    log::info!("Initial sync completed successfully");
    Ok(())
  }

  async fn sync_api(State(ctx): State<AppCtx>, Query(q): Query<HashMap<String, String>>) -> Response {
    let mongo_uri = q.get("mongo_uri").cloned();
    match initial_sync(ctx.local_db.clone(), mongo_uri).await {
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
            "archives": 0, // TODO: implement count
            "sold": 0     // TODO: implement count
          }
        })).into_response()
      }
      Err(e) => {
        (axum::http::StatusCode::INTERNAL_SERVER_ERROR, 
         Json(serde_json::json!({"ok": false, "error": e.to_string()}))).into_response()
      }
    }
  }

  // MongoDB fetching functions that handle schemaless data directly from MongoDB
  async fn fetch_machines_from_mongo(db: &mongodb::Database) -> anyhow::Result<Vec<DBMachine>> {
    let collection: Collection<Document> = db.collection("machines");
    let mut cursor = collection.find(None, None).await?;
    let mut machines = Vec::new();
    
    use futures_util::stream::StreamExt;
    while let Some(result) = cursor.next().await {
      let doc = result?;
      let json_value = to_value(&doc)?;
      let machine = LocalDatabase::json_to_machine(&json_value);
      if !machine.m_id.is_empty() {
        machines.push(machine);
      }
    }
    
    Ok(machines)
  }

  async fn fetch_contacts_from_mongo(db: &mongodb::Database) -> anyhow::Result<Vec<Contact>> {
    let collection: Collection<Document> = db.collection("contacts");
    let mut cursor = collection.find(None, None).await?;
    let mut contacts = Vec::new();
    
    use futures_util::stream::StreamExt;
    while let Some(result) = cursor.next().await {
      let doc = result?;
      let json_value = to_value(&doc)?;
      let contact = LocalDatabase::json_to_contact(&json_value);
      if !contact.c_id.is_empty() {
        contacts.push(contact);
      }
    }
    
    Ok(contacts)
  }

  async fn fetch_archived_from_mongo(db: &mongodb::Database) -> anyhow::Result<Vec<ArchivedMachine>> {
    let collection: Collection<Document> = db.collection("archived");
    let mut cursor = collection.find(None, None).await?;
    let mut archived = Vec::new();
    
    use futures_util::stream::StreamExt;
    while let Some(result) = cursor.next().await {
      let doc = result?;
      // Convert to ArchivedMachine
      if let Ok(json_value) = to_value(&doc) {
        let machine = LocalDatabase::json_to_machine(&json_value);
        let archived_machine = ArchivedMachine {
          a_id: json_value.get("_id")
            .and_then(|v| v.as_str())
            .unwrap_or(&machine.m_id)
            .to_string(),
          archive_date: json_value.get("archive_date")
            .and_then(|v| v.as_str())
            .unwrap_or(&chrono::Utc::now().to_rfc3339())
            .to_string(),
          machine,
        };
        archived.push(archived_machine);
      }
    }
    
    Ok(archived)
  }

  async fn fetch_sold_from_mongo(db: &mongodb::Database) -> anyhow::Result<Vec<SoldMachine>> {
    let collection: Collection<Document> = db.collection("sold");
    let mut cursor = collection.find(None, None).await?;
    let mut sold = Vec::new();
    
    use futures_util::stream::StreamExt;
    while let Some(result) = cursor.next().await {
      let doc = result?;
      // Convert to SoldMachine
      if let Ok(json_value) = to_value(&doc) {
        let machine = LocalDatabase::json_to_machine(&json_value);
        let sold_machine = SoldMachine {
          s_id: json_value.get("_id")
            .and_then(|v| v.as_str())
            .unwrap_or(&machine.m_id)
            .to_string(),
          machine,
          date_sold: json_value.get("date_sold")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
          trucking_company: json_value.get("trucking_company")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
          buyer: json_value.get("buyer")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
          buyer_location: json_value.get("buyer_location")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
          purchase_fob: json_value.get("purchase_fob")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
          machine_cost: json_value.get("machine_cost")
            .and_then(|v| v.as_f64()),
          freight_cost: json_value.get("freight_cost")
            .and_then(|v| v.as_f64()),
          paint_cost: json_value.get("paint_cost")
            .and_then(|v| v.as_f64()),
          other_cost: json_value.get("other_cost")
            .and_then(|v| v.as_f64()),
          profit: json_value.get("profit")
            .and_then(|v| v.as_f64()),
          total_cost: json_value.get("total_cost")
            .and_then(|v| v.as_f64()),
          notes: json_value.get("notes")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        };
        sold.push(sold_machine);
      }
    }
    
    Ok(sold)
  }

  // API Handlers
  async fn list_machines_api(State(ctx): State<AppCtx>, Query(q): Query<ListQuery>) -> Response {
    let page = q.page.unwrap_or(1).max(1);
    let size = q.pageSize.unwrap_or(20).max(1);
    let offset = (page - 1) * size;

    match ctx.local_db.get_machines(
      q.search.as_deref(),
      q.model.as_deref(),
      q.r#type.as_deref(),
      q.contactId.as_deref(),
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
    // For simplicity, search through machines first
    match ctx.local_db.get_machines(None, None, None, None, 1000, 0) {
      Ok((machines, _)) => {
        let machine = machines.into_iter().find(|m| m.m_id == id);
        Json(serde_json::json!({"data": machine})).into_response()
      }
      Err(e) => {
        log::error!("Failed to get machine: {}", e);
        (axum::http::StatusCode::INTERNAL_SERVER_ERROR,
         Json(serde_json::json!({"error": "Failed to get machine"}))).into_response()
      }
    }
  }

  async fn create_machine_api(State(ctx): State<AppCtx>, Json(body): Json<serde_json::Value>) -> Response {
    let now = chrono::Utc::now().to_rfc3339();
    let machine_id = ctx.local_db.generate_id();

    // Handle contact creation if needed
    let mut contact_id = None;
    if let Some(contact) = body.get("contact") {
      if contact.get("c_id").and_then(|v| v.as_str()) == Some("new") {
        let new_contact_id = ctx.local_db.generate_id();
        let contact_data = Contact {
          c_id: new_contact_id.clone(),
          company: contact.get("company").and_then(|v| v.as_str()).map(|s| s.to_string()),
          name: contact.get("name").and_then(|v| v.as_str()).map(|s| s.to_string()),
          create_date: Some(now.clone()),
          last_mod_date: Some(now.clone()),
        };
        
        if let Err(e) = ctx.local_db.create_contact(&contact_data) {
          log::error!("Failed to create contact: {}", e);
        } else {
          contact_id = Some(new_contact_id);
        }
      } else if let Some(cid) = contact.get("c_id").and_then(|v| v.as_str()) {
        contact_id = Some(cid.to_string());
      }
    }

    // Create machine from JSON body using flexible parsing
    let mut machine = LocalDatabase::json_to_machine(&body);
    machine.m_id = machine_id.clone();
    machine.contact_id = contact_id;
    machine.create_date = now.clone();
    machine.last_mod_date = now;

    match ctx.local_db.create_machine(&machine) {
      Ok(_) => {
        Json(serde_json::json!({
          "data": {
            "success": true,
            "contactUpdated": true,
            "machineCreated": true,
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
    match ctx.local_db.get_machines(None, None, None, None, 1000, 0) {
      Ok((machines, _)) => {
        if let Some(mut machine) = machines.into_iter().find(|m| m.m_id == id) {
          // Update fields from body - handle both direct fields and "machine" wrapper
          let update_data = if let Some(machine_data) = body.get("machine") {
            machine_data
          } else {
            &body
          };

          // Update fields flexibly
          if let Some(contact_id) = update_data.get("contactId").and_then(|v| v.as_str()) {
            machine.contact_id = Some(contact_id.to_string());
          }
          if let Some(serial) = update_data.get("serialNumber").and_then(|v| v.as_str()) {
            machine.serial_number = Some(serial.to_string());
          }
          if let Some(model) = update_data.get("model").and_then(|v| v.as_str()) {
            machine.model = Some(model.to_string());
          }
          if let Some(machine_type) = update_data.get("type").and_then(|v| v.as_str()) {
            machine.r#type = Some(machine_type.to_string());
          }
          if let Some(year) = update_data.get("year").and_then(|v| v.as_i64()) {
            machine.year = Some(year);
          }
          if let Some(hours) = update_data.get("hours").and_then(|v| v.as_i64()) {
            machine.hours = Some(hours);
          }
          if let Some(description) = update_data.get("description").and_then(|v| v.as_str()) {
            machine.description = Some(description.to_string());
          }
          if let Some(salesman) = update_data.get("salesman").and_then(|v| v.as_str()) {
            machine.salesman = Some(salesman.to_string());
          }
          if let Some(price) = update_data.get("price").and_then(|v| v.as_f64()) {
            machine.price = Some(price);
          }
          if let Some(location) = update_data.get("location").and_then(|v| v.as_str()) {
            machine.location = Some(location.to_string());
          }
          if let Some(notes) = update_data.get("notes").and_then(|v| v.as_str()) {
            machine.notes = Some(notes.to_string());
          }

          match ctx.local_db.update_machine(&machine) {
            Ok(_) => {
              Json(serde_json::json!({
                "data": {
                  "success": true,
                  "contactUpdated": true,
                  "machineUpdated": true,
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
    let now = chrono::Utc::now().to_rfc3339();
    
    // Extract machine data and archive date
    let (machine_data, archive_date) = if let Some(machine) = body.get("machine") {
      (machine, body.get("archiveDate").and_then(|v| v.as_str()).unwrap_or(&now).to_string())
    } else {
      (&body, now.clone())
    };

    // Convert to DBMachine
    let machine = LocalDatabase::json_to_machine(machine_data);
    
    match ctx.local_db.archive_machine(&machine, &archive_date) {
      Ok(archive_id) => {
        let archived = ArchivedMachine {
          a_id: archive_id,
          archive_date,
          machine,
        };
        
        Json(serde_json::json!({
          "data": {
            "success": true,
            "contactUpdated": true,
            "machineCreated": true,
            "machine": archived
          }
        })).into_response()
      }
      Err(e) => {
        log::error!("Failed to archive machine: {}", e);
        (axum::http::StatusCode::INTERNAL_SERVER_ERROR,
         Json(serde_json::json!({"error": "Failed to archive machine"}))).into_response()
      }
    }
  }

  async fn sell_machine_api(State(_ctx): State<AppCtx>, Json(_body): Json<serde_json::Value>) -> Response {
    // TODO: Implement sell functionality
    Json(serde_json::json!({"error": "Sell functionality not yet implemented"})).into_response()
  }

  async fn get_filters_api(State(ctx): State<AppCtx>) -> Response {
    let models = ctx.local_db.get_distinct_values("model", "machines").unwrap_or_default();
    let types = ctx.local_db.get_distinct_values("type", "machines").unwrap_or_default();
    let salesmen = ctx.local_db.get_distinct_values("salesman", "machines").unwrap_or_default();

    let models_json: Vec<_> = models.into_iter()
      .map(|value| serde_json::json!({"label": value.clone(), "data": value}))
      .collect();
    let types_json: Vec<_> = types.into_iter()
      .map(|value| serde_json::json!({"label": value.clone(), "data": value}))
      .collect();
    let salesmen_json: Vec<_> = salesmen.into_iter()
      .map(|value| serde_json::json!({"label": value.clone(), "data": value}))
      .collect();

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

  async fn get_locations_api(State(_ctx): State<AppCtx>, Query(_q): Query<HashMap<String, String>>) -> Response {
    // TODO: Implement locations lookup
    Json(serde_json::json!({
      "data": {
        "located": [],
        "archived": [],
        "sold": []
      }
    })).into_response()
  }

  async fn list_contacts_api(State(ctx): State<AppCtx>, Query(q): Query<HashMap<String, String>>) -> Response {
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
