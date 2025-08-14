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
  use once_cell::sync::Lazy;
  use parking_lot::Mutex;
  use serde::{Deserialize, Serialize};
  use tauri::{AppHandle, Manager};

  static STATE: Lazy<Mutex<State>> = Lazy::new(|| Mutex::new(State::default()));

  #[derive(Default, Serialize, Deserialize, Clone)]
  struct State {
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

  pub fn start_blocking(app: AppHandle) -> anyhow::Result<()> {
    // Load state from disk
    let data_dir = app
      .path()
      .app_data_dir()
      .or_else(|_| app.path().app_config_dir())?
      ;
    fs::create_dir_all(&data_dir).ok();
    let path = data_dir.join("offline_state.json");
    if let Ok(bytes) = fs::read(&path) {
      if let Ok(state) = serde_json::from_slice::<State>(&bytes) { *STATE.lock() = state; }
    }

    let app = Router::new()
      .route("/health", get(|| async { "ok" }))
      .route("/api/machines", get(list_machines).post(create_machine))
      .route("/api/machines/:id", get(get_machine).put(update_machine).delete(delete_machine))
      .route("/api/machines/filters", get(get_filters))
      .route("/api/machines/locations", get(get_locations))
      .route("/api/machines/archive", post(archive_machine))
      .route("/api/machines/sold", post(sell_machine))
      .route("/api/contact", get(list_contacts));

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

  async fn sell_machine(Json(body): Json<serde_json::Value>) -> impl IntoResponse {
    let mut st = STATE.lock();
    let now = chrono::Utc::now().to_rfc3339();
    let machine = body.get("machine").cloned().unwrap_or_else(|| body.clone());
    let db = json_to_dbmachine(machine, now.clone());
    let s = SoldMachine { s_id: generate_id(), machine: db, dateSold: body.get("sold").and_then(|v| v.get("dateSold")).and_then(|v| v.as_str()).map(|s| s.to_string()).or(Some(now)), truckingCompany: None, buyer: None, buyerLocation: None, purchaseFob: None, machineCost: None, freightCost: None, paintCost: None, otherCost: None, profit: None, totalCost: None, notes: None };
    st.sold.push(s.clone());
    Json(serde_json::json!({ "data": { "success": true, "contactUpdated": true, "machineCreated": true, "machine": s } }))
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
