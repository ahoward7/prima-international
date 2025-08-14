use tauri::Manager;

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
      // Ensure Mongo data dir exists
  if let Ok(app_data) = app.path().app_data_dir().or_else(|_| app.path().app_config_dir()) {
        let mongo_dir = app_data.join("mongo-data");
        std::fs::create_dir_all(&mongo_dir).ok();
      }
      // Try to start bundled mongod if available (packaged under bundle.resources/bin/*)
      {
        use std::path::PathBuf;
        #[cfg(target_os = "windows")]
        let exe_name = "mongod.exe";
        #[cfg(not(target_os = "windows"))]
        let exe_name = "mongod";

        // Candidate paths: packaged resources/bin and dev src-tauri/bin
        let mut candidates: Vec<PathBuf> = Vec::new();
        if let Ok(res_dir) = app.path().resource_dir() {
          candidates.push(res_dir.join("bin").join(exe_name));
        }
        // dev fallback
        candidates.push(std::path::Path::new("bin").join(exe_name));

        if let Some(mongod_bin) = candidates.into_iter().find(|p| p.exists()) {
          // Ensure execute bit on unix
          #[cfg(unix)]
          {
            use std::os::unix::fs::PermissionsExt;
            if let Ok(meta) = std::fs::metadata(&mongod_bin) {
              let perm = meta.permissions();
              let mode = perm.mode();
              if mode & 0o111 == 0 { // no execute bits
                let _ = std::fs::set_permissions(&mongod_bin, std::fs::Permissions::from_mode(mode | 0o755));
              }
            }
          }

          let db_path = app
            .path()
            .app_data_dir()
            .or_else(|_| app.path().app_config_dir())
            .map(|p| p.join("mongo-data"))
            .ok();
          let db_path_str = db_path
            .as_ref()
            .map(|p| p.display().to_string())
            .unwrap_or_else(|| "mongo-data".into());

          let mut cmd = std::process::Command::new(&mongod_bin);
          cmd.arg("--dbpath").arg(db_path_str)
            .arg("--bind_ip").arg("127.0.0.1")
            .arg("--port").arg("27272")
            .arg("--quiet");
          let _ = cmd.spawn();
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
  use std::{fs, path::PathBuf};
  use axum::{routing::{get, post}, Router, Json, extract::{Path, Query}, response::IntoResponse};
  use axum::extract::State;
  use axum::response::Response;
  use once_cell::sync::Lazy;
  use parking_lot::Mutex;
  use serde::{Deserialize, Serialize};
  use tauri::{AppHandle, Manager};
  use mongodb::{Client, options::ClientOptions, bson::doc};
  use futures_util::TryStreamExt;
  use regex;
  use reqwest::Client as HttpClient;

  static STATE: Lazy<Mutex<LocalState>> = Lazy::new(|| Mutex::new(LocalState::default()));

  // Retain State for fallback only; primary persistence is Mongo
  #[derive(Default, Serialize, Deserialize, Clone)]
  struct LocalState {
    machines: Vec<Machine>,
    archives: Vec<ArchivedMachine>,
    sold: Vec<SoldMachine>,
    contacts: Vec<Contact>,
  }

  #[derive(Serialize, Deserialize, Clone, Default)]
  struct Contact { c_id: String, company: Option<String>, name: Option<String>, createDate: Option<String>, lastModDate: Option<String> }

  #[derive(Serialize, Deserialize, Clone, Default)]
  struct DBMachine {
    m_id: String,
    contactId: Option<String>,
    serialNumber: Option<String>, model: Option<String>, r#type: Option<String>, year: Option<i64>, hours: Option<i64>, description: Option<String>, salesman: Option<String>, createDate: String, lastModDate: String, price: Option<f64>, location: Option<String>, notes: Option<String>
  }

  #[derive(Serialize, Deserialize, Clone, Default)]
  struct Machine { #[serde(flatten)] db: DBMachine, contact: Option<Contact> }

  #[derive(Serialize, Deserialize, Clone, Default)]
  struct ArchivedMachine { a_id: String, archiveDate: String, machine: DBMachine }

  #[derive(Serialize, Deserialize, Clone, Default)]
  struct SoldMachine { s_id: String, machine: DBMachine, dateSold: Option<String>, truckingCompany: Option<String>, buyer: Option<String>, buyerLocation: Option<String>, purchaseFob: Option<String>, machineCost: Option<f64>, freightCost: Option<f64>, paintCost: Option<f64>, otherCost: Option<f64>, profit: Option<f64>, totalCost: Option<f64>, notes: Option<String> }

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
  struct AppCtx { mongo: Option<Client> }

  pub fn start_blocking(app: AppHandle) -> anyhow::Result<()> {
    // Load legacy state from disk (fallback only)
    let data_dir = app.path().app_data_dir().or_else(|_| app.path().app_config_dir())?;
    fs::create_dir_all(&data_dir).ok();
    let path = data_dir.join("offline_state.json");
    if let Ok(bytes) = fs::read(&path) {
      if let Ok(state) = serde_json::from_slice::<LocalState>(&bytes) { *STATE.lock() = state; }
    }

    // Attempt to connect to local Mongo (sidecar on 27272). We'll keep JSON state fallback for now.
    let mongo_client = connect_mongo();
    // Fire-and-forget initial sync when we have Mongo and can reach the primary Nuxt API.
  if let Some(ref client) = mongo_client {
      let client_clone = client.clone();
      std::thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new().ok();
        if let Some(rt) = rt {
      let _ = rt.block_on(initial_sync(client_clone, None));
        }
      });
    }
    let mongo_for_health = mongo_client.clone();

    let ctx = AppCtx { mongo: mongo_client.clone() };
    let app = Router::new()
      .route("/health", get(move || async move {
        if let Some(ref client) = mongo_for_health {
          if client.database("admin").run_command(doc! { "ping": 1 }, None).await.is_ok() {
            return Json(serde_json::json!({"ok": true, "mongo": true}));
          }
        }
        Json(serde_json::json!({"ok": true, "mongo": false}))
      }))
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
        .with_graceful_shutdown(shutdown_signal(path))
        .await
        .unwrap();
    });
    Ok(())
  }

  async fn shutdown_signal(path: PathBuf) {
    // No real signal; on drop we serialize to disk. For long-running, implement proper signal.
    let _ = tokio::signal::ctrl_c().await;
    if let Ok(state) = serde_json::to_vec_pretty(&*STATE.lock()) { let _ = fs::write(path, state); }
  }

  fn connect_mongo() -> Option<Client> {
    // Connect to the local sidecar MongoDB if running
    let uri = "mongodb://127.0.0.1:27272";
    let rt = tokio::runtime::Runtime::new().ok()?;
    let client = rt.block_on(async {
      let opts = ClientOptions::parse(uri).await.ok()?;
      Client::with_options(opts).ok()
    });
    client
  }

  async fn initial_sync(mongo: Client, base_override: Option<String>) -> anyhow::Result<()> {
    // Determine if we can reach the online Nuxt server
    let http = HttpClient::new();
    let base = base_override.as_deref().unwrap_or("http://localhost:3000"); // Nuxt devUrl; in production set to hosted URL.
    // health check on Nuxt side: just attempt one list endpoint quickly.
    let timeout = std::time::Duration::from_secs(5);
    let online_ok = http
      .get(format!("{}/api/machines?location=located&pageSize=1&page=1", base))
      .timeout(timeout)
      .send()
      .await
      .map(|r| r.status().is_success())
      .unwrap_or(false);
    if !online_ok { return Ok(()); }

    // Pull all datasets
  let machines = fetch_all(&http, base, "located").await?;
  let archived = fetch_all(&http, base, "archived").await?;
  let sold = fetch_all(&http, base, "sold").await?;
  let contacts = fetch_contacts(&http, base).await?;

    // Write into local Mongo (replace collections)
    let db = mongo.database("offline");
    // machines
    let coll_m = db.collection::<mongodb::bson::Document>("machines");
    coll_m.drop(None).await.ok();
    if !machines.is_empty() { coll_m.insert_many(machines, None).await.ok(); }
    // archived
    let coll_a = db.collection::<mongodb::bson::Document>("archives");
    coll_a.drop(None).await.ok();
    if !archived.is_empty() { coll_a.insert_many(archived, None).await.ok(); }
    // sold
    let coll_s = db.collection::<mongodb::bson::Document>("sold");
    coll_s.drop(None).await.ok();
    if !sold.is_empty() { coll_s.insert_many(sold, None).await.ok(); }
    // contacts
    let coll_c = db.collection::<mongodb::bson::Document>("contacts");
    coll_c.drop(None).await.ok();
    if !contacts.is_empty() { coll_c.insert_many(contacts, None).await.ok(); }

    Ok(())
  }

  async fn sync_api(State(ctx): State<AppCtx>, Query(q): Query<std::collections::HashMap<String, String>>) -> Response {
    if let Some(m) = &ctx.mongo {
      let base = q.get("base").cloned();
      match initial_sync(m.clone(), base).await {
        Ok(_) => {
          let database = db(m);
          let cm = database.collection::<mongodb::bson::Document>("machines").count_documents(doc!{}, None).await.unwrap_or(0);
          let ca = database.collection::<mongodb::bson::Document>("archives").count_documents(doc!{}, None).await.unwrap_or(0);
          let cs = database.collection::<mongodb::bson::Document>("sold").count_documents(doc!{}, None).await.unwrap_or(0);
          let cc = database.collection::<mongodb::bson::Document>("contacts").count_documents(doc!{}, None).await.unwrap_or(0);
          Json(serde_json::json!({"ok": true, "counts": {"machines": cm, "archives": ca, "sold": cs, "contacts": cc}})).into_response()
        }
        Err(e) => {
          (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"ok": false, "error": e.to_string()}))).into_response()
        }
      }
    } else {
      (axum::http::StatusCode::SERVICE_UNAVAILABLE, Json(serde_json::json!({"ok": false, "error": "mongo unavailable"}))).into_response()
    }
  }

  async fn fetch_all(http: &HttpClient, base: &str, location: &str) -> anyhow::Result<Vec<mongodb::bson::Document>> {
    // page until empty
    let mut page = 1usize;
    let mut out: Vec<mongodb::bson::Document> = Vec::new();
    loop {
      let url = format!("{}/api/machines?location={}&pageSize=100&page={}", base, location, page);
      let res = http.get(&url).send().await?;
      if !res.status().is_success() { break; }
      let json: serde_json::Value = res.json().await?;
      let items = json.get("data").and_then(|d| d.get("data")).and_then(|v| v.as_array()).cloned().unwrap_or_default();
      if items.is_empty() { break; }
      for it in items {
        // Ensure it can be turned into a bson document
        if let Ok(doc) = mongodb::bson::to_document(&it) { out.push(doc); }
      }
      page += 1;
    }
    Ok(out)
  }

  async fn fetch_contacts(http: &HttpClient, base: &str) -> anyhow::Result<Vec<mongodb::bson::Document>> {
    let mut page = 1usize;
    let mut out: Vec<mongodb::bson::Document> = Vec::new();
    loop {
      let url = format!("{}/api/contact?pageSize=100&page={}", base, page);
      let res = http.get(&url).send().await?;
      if !res.status().is_success() { break; }
      let json: serde_json::Value = res.json().await?;
      let items = json.get("data").and_then(|d| d.get("data")).and_then(|v| v.as_array()).cloned().unwrap_or_default();
      if items.is_empty() { break; }
      for it in items {
        if let Ok(doc) = mongodb::bson::to_document(&it) { out.push(doc); }
      }
      page += 1;
    }
    Ok(out)
  }

  fn filter_matches_machine(q: &ListQuery, m: &DBMachine) -> bool {
    if let Some(s) = &q.search { let s = s.to_lowercase();
      let hay = format!("{} {} {} {} {} {}", m.serialNumber.as_deref().unwrap_or(""), m.model.as_deref().unwrap_or(""), m.r#type.as_deref().unwrap_or(""), m.location.as_deref().unwrap_or(""), m.year.unwrap_or_default(), m.hours.unwrap_or_default());
      if !hay.to_lowercase().contains(&s) { return false; }
    }
    if let Some(model) = &q.model { if m.model.as_deref() != Some(model.as_str()) { return false; } }
    if let Some(t) = &q.r#type { if m.r#type.as_deref() != Some(t.as_str()) { return false; } }
    if let Some(cid) = &q.contactId { if m.contactId.as_deref() != Some(cid.as_str()) { return false; } }
    true
  }

  // Mongo-backed handlers with shared state
  fn db(mongo: &Client) -> mongodb::Database { mongo.database("offline") }

  async fn list_machines_api(State(ctx): State<AppCtx>, Query(q): Query<ListQuery>) -> Response {
    if let Some(m) = &ctx.mongo {
      let loc = q.location.clone().unwrap_or_else(|| "located".into());
      let coll_name = match loc.as_str() { "archived" => "archives", "sold" => "sold", _ => "machines" };
      let coll = db(m).collection::<mongodb::bson::Document>(coll_name);
      // Build filter
      let mut filter = mongodb::bson::Document::new();
      if let Some(s) = &q.search {
        let r = mongodb::bson::Regex { pattern: regex::escape(s), options: "i".into() };
        filter.insert("$or", vec![ doc!{"serialNumber": {"$regex": r.clone()}}, doc!{"model": {"$regex": r.clone()}}, doc!{"type": {"$regex": r.clone()}}, doc!{"location": {"$regex": r.clone()}} ]);
      }
      if let Some(model) = &q.model { filter.insert("model", model); }
      if let Some(t) = &q.r#type { filter.insert("type", t); }
      if let Some(cid) = &q.contactId { filter.insert("contactId", cid); }
      let page = q.page.unwrap_or(1).max(1);
      let size = q.pageSize.unwrap_or(20).max(1) as i64;
      let skip = ((page - 1) as i64) * size;
      let total = coll.count_documents(filter.clone(), None).await.unwrap_or(0) as usize;
      let find_opts = mongodb::options::FindOptions::builder().skip(skip as u64).limit(size).build();
      let mut cursor = match coll.find(filter, find_opts).await { Ok(c) => c, Err(_) => return Json(serde_json::json!({"data": {"data": [], "total": 0}})).into_response() };
      let mut items: Vec<serde_json::Value> = Vec::new();
      while let Some(doc) = cursor.try_next().await.unwrap_or(None) {
        let v = mongodb::bson::from_document::<serde_json::Value>(doc).unwrap_or(serde_json::json!({}));
        items.push(v);
      }
      return Json(serde_json::json!({"data": {"data": items, "total": total}})).into_response();
    }
    list_machines(Query(q)).await.into_response()
  }

  async fn list_machines(Query(q): Query<ListQuery>) -> impl IntoResponse {
    let loc = q.location.clone().unwrap_or_else(|| "located".into());
    let st = STATE.lock();
    let mut items: Vec<_> = match loc.as_str() {
      "archived" => st.archives.iter().filter(|a| filter_matches_machine(&q, &a.machine)).cloned().map(|a| serde_json::json!(a)).collect(),
      "sold" => st.sold.iter().filter(|s| filter_matches_machine(&q, &s.machine)).cloned().map(|s| serde_json::json!(s)).collect(),
      _ => st.machines.iter().filter(|m| filter_matches_machine(&q, &m.db)).cloned().map(|m| serde_json::json!(flatten_machine(m.clone(), &st.contacts))).collect(),
    };
    let total = items.len();
    // pagination
    let page = q.page.unwrap_or(1).max(1);
    let size = q.pageSize.unwrap_or(20).max(1);
    let start = (page - 1) * size;
    let end = (start + size).min(items.len());
    items = if start < end { items[start..end].to_vec() } else { vec![] };
    Json(serde_json::json!({ "data": { "data": items, "total": total } }))
  }

  async fn get_machine_api(State(ctx): State<AppCtx>, Path(id): Path<String>, Query(params): Query<std::collections::HashMap<String, String>>) -> Response {
    if let Some(m) = &ctx.mongo {
      let loc = params.get("location").cloned().unwrap_or_else(|| "sold".into());
      let coll = match loc.as_str() { "archived" => "archives", "located" => "machines", _ => "sold" };
      let doc = db(m).collection::<mongodb::bson::Document>(coll).find_one(doc!{"$or": [ doc!{"m_id": &id}, doc!{"a_id": &id}, doc!{"s_id": &id} ]}, None).await.ok().flatten();
      let payload = doc.and_then(|d| mongodb::bson::from_document::<serde_json::Value>(d).ok());
      return Json(serde_json::json!({"data": payload})).into_response();
    }
    get_machine(Path(id), Query(params)).await.into_response()
  }

  async fn get_machine(Path(id): Path<String>, Query(params): Query<std::collections::HashMap<String, String>>) -> impl IntoResponse {
    let loc = params.get("location").cloned().unwrap_or_else(|| "sold".into());
    let st = STATE.lock();
    let payload = match loc.as_str() {
      "archived" => st.archives.iter().find(|a| a.a_id == id).cloned().map(|a| serde_json::json!(a)),
      "located" => st.machines.iter().find(|m| m.db.m_id == id).cloned().map(|m| serde_json::json!(flatten_machine(m.clone(), &st.contacts))),
      _ => st.sold.iter().find(|s| s.s_id == id).cloned().map(|s| serde_json::json!(s)),
    };
    Json(serde_json::json!({ "data": payload }))
  }

  async fn create_machine_api(State(ctx): State<AppCtx>, Json(mut body): Json<serde_json::Value>) -> Response {
    if let Some(m) = &ctx.mongo {
      let now = chrono::Utc::now().to_rfc3339();
      let mut contact_id = None::<String>;
      if let Some(contact) = body.get_mut("contact").and_then(|c| c.as_object_mut()) {
        let cid = if contact.get("c_id").and_then(|v| v.as_str()) == Some("new") {
          let gen = generate_id();
          let mut docc = mongodb::bson::to_document(&contact.clone()).unwrap_or_default();
          docc.insert("c_id", gen.clone());
          docc.insert("createDate", now.clone());
          docc.insert("lastModDate", now.clone());
          let _ = db(m).collection("contacts").insert_one(docc, None).await;
          gen
        } else { contact.get("c_id").and_then(|v| v.as_str()).unwrap_or("").to_string() };
        contact_id = Some(cid);
      }
      let m_id = generate_id();
      let mut dbm = mongodb::bson::to_document(&body).unwrap_or_default();
      dbm.insert("m_id", m_id.clone());
      dbm.insert("contactId", contact_id);
      dbm.insert("createDate", now.clone());
      dbm.insert("lastModDate", now.clone());
      let _ = db(m).collection("machines").insert_one(dbm.clone(), None).await;
      let payload = mongodb::bson::from_document::<serde_json::Value>(dbm).unwrap_or(serde_json::json!({}));
      return Json(serde_json::json!({"data": {"success": true, "contactUpdated": true, "machineCreated": true, "machine": payload}})).into_response();
    }
    create_machine(Json(body)).await.into_response()
  }

  async fn create_machine(Json(mut body): Json<serde_json::Value>) -> impl IntoResponse {
    let mut st = STATE.lock();
    let now = chrono::Utc::now().to_rfc3339();
    let mut contact_id = None::<String>;
    if let Some(contact) = body.get_mut("contact").and_then(|c| c.as_object_mut()) {
      let cid = if contact.get("c_id").and_then(|v| v.as_str()) == Some("new") {
        let gen = generate_id();
        let c = Contact { c_id: gen.clone(), company: contact.get("company").and_then(|v| v.as_str()).map(|s| s.to_string()), name: contact.get("name").and_then(|v| v.as_str()).map(|s| s.to_string()), createDate: Some(now.clone()), lastModDate: Some(now.clone()) };
        st.contacts.push(c);
        gen
      } else { contact.get("c_id").and_then(|v| v.as_str()).unwrap_or("").to_string() };
      contact_id = Some(cid);
    }
    let m_id = generate_id();
    let db = DBMachine { m_id: m_id.clone(), contactId: contact_id, serialNumber: s(body.get("serialNumber")), model: s(body.get("model")), r#type: s(body.get("type")), year: i(body.get("year")), hours: i(body.get("hours")), description: s(body.get("description")), salesman: s(body.get("salesman")), createDate: now.clone(), lastModDate: now.clone(), price: f(body.get("price")), location: s(body.get("location")), notes: s(body.get("notes")) };
    st.machines.push(Machine { db: db.clone(), contact: None });
    Json(serde_json::json!({ "data": { "success": true, "contactUpdated": true, "machineCreated": true, "machine": db } }))
  }

  async fn update_machine_api(State(ctx): State<AppCtx>, Path(id): Path<String>, Query(params): Query<std::collections::HashMap<String, String>>, Json(body): Json<serde_json::Value>) -> Response {
    if let Some(m) = &ctx.mongo {
      let now = chrono::Utc::now().to_rfc3339();
      let loc = params.get("location").cloned().unwrap_or_else(|| "sold".into());
      let (coll, key) = match loc.as_str() { "archived" => ("archives", "a_id"), "located" => ("machines", "m_id"), _ => ("sold", "s_id") };
      let mut update = mongodb::bson::Document::new();
      if let Some(v) = body.get("machine") { if let Ok(mut d) = mongodb::bson::to_document(v) { d.insert("lastModDate", now.clone()); update.insert("$set", d); } }
      if update.is_empty() { update.insert("$set", doc!{"lastModDate": now.clone()}); }
      let _ = db(m).collection::<mongodb::bson::Document>(coll).update_one(doc!{ key: &id }, update, None).await;
      return Json(serde_json::json!({"data": {"success": true, "contactUpdated": true, "machineUpdated": true}})).into_response();
    }
    update_machine(Path(id), Query(params), Json(body)).await.into_response()
  }

  async fn update_machine(Path(id): Path<String>, Query(params): Query<std::collections::HashMap<String, String>>, Json(body): Json<serde_json::Value>) -> impl IntoResponse {
    let loc = params.get("location").cloned().unwrap_or_else(|| "sold".into());
    let mut st = STATE.lock();
    let now = chrono::Utc::now().to_rfc3339();
    match loc.as_str() {
      "archived" => {
        if let Some(a) = st.archives.iter_mut().find(|a| a.a_id == id) {
          if let Some(mobj) = body.get("machine").and_then(|v| v.as_object()) {
            a.machine.lastModDate = now.clone();
            if let Some(cid) = mobj.get("contact").and_then(|c| c.get("c_id")).and_then(|v| v.as_str()) { a.machine.contactId = Some(cid.to_string()); }
          }
        }
        Json(serde_json::json!({ "data": { "success": true, "contactUpdated": true, "machineUpdated": true } }))
      }
      "located" => {
        if let Some(m) = st.machines.iter_mut().find(|m| m.db.m_id == id) {
          m.db.lastModDate = now.clone();
        }
        Json(serde_json::json!({ "data": { "success": true, "contactUpdated": true, "machineUpdated": true } }))
      }
      _ => {
        if let Some(sold) = st.sold.iter_mut().find(|s| s.s_id == id) {
          sold.machine.lastModDate = now.clone();
        }
        Json(serde_json::json!({ "data": { "success": true, "contactUpdated": true, "machineUpdated": true } }))
      }
    }
  }

  async fn delete_machine_api(State(ctx): State<AppCtx>, Path(id): Path<String>, Query(params): Query<std::collections::HashMap<String, String>>) -> Response {
    if let Some(m) = &ctx.mongo {
      let loc = params.get("location").cloned().unwrap_or_else(|| "located".into());
      let (coll, key) = match loc.as_str() { "archived" => ("archives", "a_id"), "sold" => ("sold", "s_id"), _ => ("machines", "m_id") };
      let _ = db(m).collection::<mongodb::bson::Document>(coll).delete_one(doc!{ key: &id }, None).await;
      return (axum::http::StatusCode::NO_CONTENT, ()).into_response();
    }
  delete_machine(Path(id), Query(params)).await.into_response()
  }

  async fn delete_machine(Path(id): Path<String>, Query(params): Query<std::collections::HashMap<String, String>>) -> impl IntoResponse {
    let loc = params.get("location").cloned().unwrap_or_else(|| "located".into());
    let mut st = STATE.lock();
    match loc.as_str() {
      "archived" => st.archives.retain(|a| a.a_id != id),
      "sold" => st.sold.retain(|s| s.s_id != id),
      _ => st.machines.retain(|m| m.db.m_id != id),
    }
    (axum::http::StatusCode::NO_CONTENT, ()).into_response()
  }

  async fn get_filters_api(State(ctx): State<AppCtx>) -> Response {
    if let Some(m) = &ctx.mongo {
      let database = db(m);
      let coll_m = database.collection::<mongodb::bson::Document>("machines");
      let coll_a = database.collection::<mongodb::bson::Document>("archives");
      let coll_s = database.collection::<mongodb::bson::Document>("sold");

      async fn distinct_str(coll: &mongodb::Collection<mongodb::bson::Document>, key: &str) -> Vec<String> {
        coll.distinct(key, doc!{}, None).await.ok()
          .unwrap_or_default()
          .into_iter()
          .filter_map(|b| b.as_str().map(|s| s.to_string()))
          .collect::<Vec<_>>()
      }
      let mut models: std::collections::BTreeSet<String> = std::collections::BTreeSet::new();
      for v in distinct_str(&coll_m, "model").await { models.insert(v); }
      for v in distinct_str(&coll_a, "machine.model").await { models.insert(v); }
      for v in distinct_str(&coll_s, "machine.model").await { models.insert(v); }
      let models_json: Vec<_> = models.into_iter().map(|value| serde_json::json!({"label": value.clone(), "data": value})).collect();

      let mut types: std::collections::BTreeSet<String> = std::collections::BTreeSet::new();
      for v in distinct_str(&coll_m, "type").await { types.insert(v); }
      for v in distinct_str(&coll_a, "machine.type").await { types.insert(v); }
      for v in distinct_str(&coll_s, "machine.type").await { types.insert(v); }
      let types_json: Vec<_> = types.into_iter().map(|value| serde_json::json!({"label": value.clone(), "data": value})).collect();

      let mut salesmen: std::collections::BTreeSet<String> = std::collections::BTreeSet::new();
      for v in distinct_str(&coll_m, "salesman").await { salesmen.insert(v); }
      for v in distinct_str(&coll_a, "machine.salesman").await { salesmen.insert(v); }
      for v in distinct_str(&coll_s, "machine.salesman").await { salesmen.insert(v); }
      let salesmen_json: Vec<_> = salesmen.into_iter().map(|value| serde_json::json!({"label": value.clone(), "data": value})).collect();

      return Json(serde_json::json!({ "data": {
        "model": models_json,
        "type": types_json,
        "salesman": salesmen_json,
        "location": [ {"label": "Located", "data": "located"}, {"label": "Sold", "data": "sold"}, {"label": "Archived", "data": "archived"} ],
        "displayFormat": [ {"label": "One Line", "data": "oneLine"}, {"label": "Two Line", "data": "twoLine"}, {"label": "Two Line Truncated", "data": "twoLineTruncated"} ],
        "pageSize": [ {"label": "10", "data": 10}, {"label": "20", "data": 20}, {"label": "30", "data": 30}, {"label": "40", "data": 40}, {"label": "50", "data": 50}, {"label": "100", "data": 100} ]
      } })).into_response();
    }
    get_filters().await.into_response()
  }

  async fn get_filters() -> impl IntoResponse {
    let st = STATE.lock();
    let distinct = |mut v: Vec<Option<String>>| {
      v.retain(|x| x.is_some());
      let mut set = std::collections::BTreeSet::new();
      for s in v.into_iter().flatten() { set.insert(s); }
      set.into_iter().map(|value| serde_json::json!({ "label": value, "data": value })).collect::<Vec<_>>()
    };
    let models = distinct(st.machines.iter().map(|m| m.db.model.clone()).chain(st.archives.iter().map(|a| a.machine.model.clone())).chain(st.sold.iter().map(|s| s.machine.model.clone())).collect());
    let types = distinct(st.machines.iter().map(|m| m.db.r#type.clone()).chain(st.archives.iter().map(|a| a.machine.r#type.clone())).chain(st.sold.iter().map(|s| s.machine.r#type.clone())).collect());
    let salesmen = distinct(st.machines.iter().map(|m| m.db.salesman.clone()).chain(st.archives.iter().map(|a| a.machine.salesman.clone())).chain(st.sold.iter().map(|s| s.machine.salesman.clone())).collect());
    Json(serde_json::json!({
      "data": {
        "model": models,
        "type": types,
        "salesman": salesmen,
        "location": [ {"label": "Located", "data": "located"}, {"label": "Sold", "data": "sold"}, {"label": "Archived", "data": "archived"} ],
        "displayFormat": [ {"label": "One Line", "data": "oneLine"}, {"label": "Two Line", "data": "twoLine"}, {"label": "Two Line Truncated", "data": "twoLineTruncated"} ],
        "pageSize": [ {"label": "10", "data": 10}, {"label": "20", "data": 20}, {"label": "30", "data": 30}, {"label": "40", "data": 40}, {"label": "50", "data": 50}, {"label": "100", "data": 100} ]
      }
    }))
  }

  async fn get_locations_api(State(_ctx): State<AppCtx>, Query(q): Query<std::collections::HashMap<String, String>>) -> Response {
    // For simplicity, fallback for now.
    get_locations(Query(q)).await.into_response()
  }

  async fn get_locations(Query(q): Query<std::collections::HashMap<String, String>>) -> impl IntoResponse {
    let serial = q.get("serialNumber").cloned().unwrap_or_default();
    if serial.is_empty() {
      return Json(serde_json::json!({ "data": { "located": [], "archived": [], "sold": [] } }));
    }
    let st = STATE.lock();
    let located: Vec<String> = st.machines.iter().filter_map(|m| if m.db.serialNumber.as_deref() == Some(serial.as_str()) { m.db.serialNumber.clone() } else { None }).collect();
    let archived: Vec<String> = st.archives.iter().filter_map(|a| if a.machine.serialNumber.as_deref() == Some(serial.as_str()) { a.machine.serialNumber.clone() } else { None }).collect();
    let sold: Vec<String> = st.sold.iter().filter_map(|s| if s.machine.serialNumber.as_deref() == Some(serial.as_str()) { s.machine.serialNumber.clone() } else { None }).collect();
    Json(serde_json::json!({ "data": { "located": located, "archived": archived, "sold": sold } }))
  }

  async fn archive_machine_api(State(ctx): State<AppCtx>, Json(body): Json<serde_json::Value>) -> Response {
    if let Some(m) = &ctx.mongo {
      let now = chrono::Utc::now().to_rfc3339();
      let (machine, archive_date) = if body.get("machine").is_some() {
        (body.get("machine").cloned().unwrap(), body.get("archiveDate").and_then(|v| v.as_str()).map(|s| s.to_string()).unwrap_or(now.clone()))
      } else { (body.clone(), now.clone()) };
      let mut docm = mongodb::bson::to_document(&machine).unwrap_or_default();
      docm.insert("m_id", generate_id());
      let mut docd = mongodb::bson::Document::new();
      docd.insert("a_id", generate_id());
      docd.insert("archiveDate", archive_date);
      docd.insert("machine", docm);
      let _ = db(m).collection("archives").insert_one(docd.clone(), None).await;
      let payload = mongodb::bson::from_document::<serde_json::Value>(docd).unwrap_or(serde_json::json!({}));
      return Json(serde_json::json!({"data": {"success": true, "contactUpdated": true, "machineCreated": true, "machine": payload}})).into_response();
    }
    archive_machine(Json(body)).await.into_response()
  }

  async fn archive_machine(Json(body): Json<serde_json::Value>) -> impl IntoResponse {
    let mut st = STATE.lock();
    let now = chrono::Utc::now().to_rfc3339();
    // body may be machine or { machine, archiveDate }
    let (machine, archive_date) = if body.get("machine").is_some() {
      (body.get("machine").cloned().unwrap(), body.get("archiveDate").and_then(|v| v.as_str()).map(|s| s.to_string()).unwrap_or(now.clone()))
    } else { (body.clone(), now.clone()) };
    let db = json_to_dbmachine(machine, now.clone());
    let a = ArchivedMachine { a_id: generate_id(), archiveDate: archive_date, machine: db };
    st.archives.push(a.clone());
    Json(serde_json::json!({ "data": { "success": true, "contactUpdated": true, "machineCreated": true, "machine": a } }))
  }

  async fn sell_machine_api(State(ctx): State<AppCtx>, Json(body): Json<serde_json::Value>) -> Response {
    if let Some(m) = &ctx.mongo {
      let now = chrono::Utc::now().to_rfc3339();
      let machine = body.get("machine").cloned().unwrap_or_else(|| body.clone());
      let mut docm = mongodb::bson::to_document(&machine).unwrap_or_default();
      docm.insert("m_id", generate_id());
      let mut docd = mongodb::bson::Document::new();
      docd.insert("s_id", generate_id());
      docd.insert("machine", docm);
      docd.insert("dateSold", body.get("sold").and_then(|v| v.get("dateSold")).and_then(|v| v.as_str()).map(|s| s.to_string()).unwrap_or(now));
      let _ = db(m).collection("sold").insert_one(docd.clone(), None).await;
      let payload = mongodb::bson::from_document::<serde_json::Value>(docd).unwrap_or(serde_json::json!({}));
      return Json(serde_json::json!({"data": {"success": true, "contactUpdated": true, "machineCreated": true, "machine": payload}})).into_response();
    }
    sell_machine(Json(body)).await.into_response()
  }

  async fn sell_machine(Json(body): Json<serde_json::Value>) -> impl IntoResponse {
    let mut st = STATE.lock();
    let now = chrono::Utc::now().to_rfc3339();
    let machine = body.get("machine").cloned().unwrap_or_else(|| body.clone());
    let db = json_to_dbmachine(machine, now.clone());
    let s = SoldMachine { s_id: generate_id(), machine: db, dateSold: body.get("sold").and_then(|v| v.get("dateSold")).and_then(|v| v.as_str()).map(|s| s.to_string()).or(Some(now)), truckingCompany: None, buyer: None, buyerLocation: None, purchaseFob: None, machineCost: None, freightCost: None, paintCost: None, otherCost: None, profit: None, totalCost: None, notes: None };
    st.sold.push(s.clone());
    Json(serde_json::json!({ "data": { "success": true, "contactUpdated": true, "machineCreated": true, "machine": s } }))
  }

  async fn list_contacts_api(State(ctx): State<AppCtx>, Query(q): Query<std::collections::HashMap<String, String>>) -> Response {
    if let Some(m) = &ctx.mongo {
      let search = q.get("search").cloned().unwrap_or_default();
      let page = q.get("page").and_then(|v| v.parse::<i64>().ok()).unwrap_or(1).max(1);
      let size = q.get("pageSize").and_then(|v| v.parse::<i64>().ok()).unwrap_or(10).max(1);
      let skip = (page - 1) * size;
      let mut filter = mongodb::bson::Document::new();
      if !search.is_empty() {
        let r = mongodb::bson::Regex { pattern: regex::escape(&search), options: "i".into() };
        filter.insert("$or", vec![ doc!{"company": {"$regex": r.clone()}}, doc!{"name": {"$regex": r.clone()}} ]);
      }
      let coll = db(m).collection::<mongodb::bson::Document>("contacts");
      let total = coll.count_documents(filter.clone(), None).await.unwrap_or(0) as usize;
      let find_opts = mongodb::options::FindOptions::builder().skip(skip as u64).limit(size).build();
      let mut cursor = match coll.find(filter, find_opts).await { Ok(c) => c, Err(_) => return Json(serde_json::json!({"data": {"data": [], "total": 0}})).into_response() };
      let mut v: Vec<serde_json::Value> = Vec::new();
      while let Some(d) = cursor.try_next().await.unwrap_or(None) { v.push(mongodb::bson::from_document::<serde_json::Value>(d).unwrap_or(serde_json::json!({}))); }
      return Json(serde_json::json!({"data": {"data": v, "total": total}})).into_response();
    }
    list_contacts(Query(q)).await.into_response()
  }

  async fn list_contacts(Query(q): Query<std::collections::HashMap<String, String>>) -> impl IntoResponse {
    let search = q.get("search").cloned().unwrap_or_default().to_lowercase();
    let page = q.get("page").and_then(|v| v.parse::<usize>().ok()).unwrap_or(1).max(1);
    let size = q.get("pageSize").and_then(|v| v.parse::<usize>().ok()).unwrap_or(10).max(1);
    let st = STATE.lock();
    let mut v: Vec<_> = st.contacts.iter().cloned().filter(|c| {
      if search.is_empty() { return true; }
      format!("{} {} {}", c.c_id, c.company.clone().unwrap_or_default(), c.name.clone().unwrap_or_default()).to_lowercase().contains(&search)
    }).collect();
    let total = v.len();
    let start = (page - 1) * size;
    let end = (start + size).min(v.len());
    v = if start < end { v[start..end].to_vec() } else { vec![] };
    Json(serde_json::json!({ "data": { "data": v, "total": total } }))
  }

  fn flatten_machine(m: Machine, contacts: &Vec<Contact>) -> serde_json::Value {
    let contact = m.db.contactId.as_ref().and_then(|id| contacts.iter().find(|c| &c.c_id == id)).cloned();
    serde_json::json!({
      "m_id": m.db.m_id,
      "contactId": m.db.contactId,
      "serialNumber": m.db.serialNumber,
      "model": m.db.model,
      "type": m.db.r#type,
      "year": m.db.year,
      "hours": m.db.hours,
      "description": m.db.description,
      "salesman": m.db.salesman,
      "createDate": m.db.createDate,
      "lastModDate": m.db.lastModDate,
      "price": m.db.price,
      "location": m.db.location,
      "notes": m.db.notes,
      "contact": contact
    })
  }

  fn json_to_dbmachine(v: serde_json::Value, now: String) -> DBMachine {
    DBMachine {
      m_id: generate_id(),
      contactId: v.get("contact").and_then(|c| c.get("c_id")).and_then(|s| s.as_str()).map(|s| s.to_string()),
      serialNumber: s(v.get("serialNumber")),
      model: s(v.get("model")),
      r#type: s(v.get("type")),
      year: i(v.get("year")),
      hours: i(v.get("hours")),
      description: s(v.get("description")),
      salesman: s(v.get("salesman")),
      createDate: now.clone(),
      lastModDate: now,
      price: f(v.get("price")),
      location: s(v.get("location")),
      notes: s(v.get("notes")),
    }
  }

  fn s(v: Option<&serde_json::Value>) -> Option<String> { v.and_then(|v| v.as_str()).map(|s| s.to_string()) }
  fn i(v: Option<&serde_json::Value>) -> Option<i64> { v.and_then(|v| v.as_i64()) }
  fn f(v: Option<&serde_json::Value>) -> Option<f64> { v.and_then(|v| v.as_f64()) }
  fn generate_id() -> String { let n: u64 = rand::random(); format!("{:010}", n % 1_000_000_0000) }
}
