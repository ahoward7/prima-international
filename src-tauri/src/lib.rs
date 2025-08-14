use tauri::{State, Manager};
use std::sync::Mutex;

mod offline;

pub struct AppState {
  db: Mutex<offline::Db>,
}

#[tauri::command]
async fn queue_request(state: State<'_, AppState>, method: String, path: String, payload: Option<serde_json::Value>) -> Result<(), String> {
  let db = state.db.lock().map_err(|_| "db lock".to_string())?;
  db.queue(method, path, payload).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_cached(state: State<'_, AppState>, key: String) -> Result<Option<serde_json::Value>, String> {
  let db = state.db.lock().map_err(|_| "db lock".to_string())?;
  db.get_cache(&key).map_err(|e| e.to_string())
}

#[tauri::command]
async fn set_cached(state: State<'_, AppState>, key: String, value: serde_json::Value) -> Result<(), String> {
  let db = state.db.lock().map_err(|_| "db lock".to_string())?;
  db.set_cache(&key, &value).map_err(|e| e.to_string())
}

#[tauri::command]
async fn flush_outbox(state: State<'_, AppState>, base_url: String, bearer: Option<String>) -> Result<u32, String> {
  let mut db = state.db.lock().map_err(|_| "db lock".to_string())?;
  db.flush(&base_url, bearer.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
async fn clear_snapshot(state: State<'_, AppState>, category: String) -> Result<(), String> {
  let db = state.db.lock().map_err(|_| "db lock".to_string())?;
  db.clear_snapshot(&category).map_err(|e| e.to_string())
}

#[tauri::command]
async fn upsert_snapshot(state: State<'_, AppState>, category: String, items: serde_json::Value) -> Result<u32, String> {
  let mut db = state.db.lock().map_err(|_| "db lock".to_string())?;
  let arr = items.as_array().cloned().unwrap_or_default();
  db.upsert_snapshot(&category, arr.as_slice()).map_err(|e| e.to_string())
}

#[tauri::command]
async fn query_machines(state: State<'_, AppState>, location: String, search: Option<String>, model: Option<String>, mtype: Option<String>, contact_id: Option<String>, sort_by: Option<String>, page: u32, page_size: u32) -> Result<(serde_json::Value, u32), String> {
  let db = state.db.lock().map_err(|_| "db lock".to_string())?;
  let (list, total) = db.query_machines(&location, search, model, mtype, contact_id, sort_by, page, page_size).map_err(|e| e.to_string())?;
  Ok((serde_json::Value::Array(list), total))
}

#[tauri::command]
async fn get_machine_detail(state: State<'_, AppState>, location: String, id: String) -> Result<Option<serde_json::Value>, String> {
  let db = state.db.lock().map_err(|_| "db lock".to_string())?;
  db.get_machine_detail(&location, &id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn query_contacts(state: State<'_, AppState>, search: Option<String>, page_size: u32) -> Result<serde_json::Value, String> {
  let db = state.db.lock().map_err(|_| "db lock".to_string())?;
  let list = db.query_contacts(search, page_size).map_err(|e| e.to_string())?;
  Ok(serde_json::Value::Array(list))
}

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

      if let Ok(db) = offline::Db::new() {
        app.manage(AppState { db: Mutex::new(db) });
      } else {
        eprintln!("Failed to init offline DB; offline mode disabled");
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      queue_request,
      get_cached,
      set_cached,
      flush_outbox,
      clear_snapshot,
      upsert_snapshot,
      query_machines,
      get_machine_detail,
      query_contacts
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
