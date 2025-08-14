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
    .invoke_handler(tauri::generate_handler![queue_request, get_cached, set_cached, flush_outbox])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
