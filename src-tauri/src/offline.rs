use directories::ProjectDirs;
use rusqlite::{params, Connection, OptionalExtension};
use serde_json::Value;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum OfflineError {
  #[error("io: {0}")]
  Io(String),
  #[error("db: {0}")]
  Db(String),
  #[error("http: {0}")]
  Http(String),
}

pub struct Db {
  pub(crate) conn: Connection,
}

impl Db {
  pub fn new() -> Result<Self, OfflineError> {
    let proj = ProjectDirs::from("com", "prima", "app").ok_or_else(|| OfflineError::Io("project dirs".into()))?;
    let data_dir = proj.data_dir();
    std::fs::create_dir_all(data_dir).map_err(|e| OfflineError::Io(e.to_string()))?;
    let db_path = data_dir.join("offline.db");
    let conn = Connection::open(db_path).map_err(|e| OfflineError::Db(e.to_string()))?;
    conn.execute_batch(
      r#"
      PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS outbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        payload TEXT,
        created_at INTEGER NOT NULL
      );
      "#,
    ).map_err(|e| OfflineError::Db(e.to_string()))?;
    Ok(Self { conn })
  }

  pub fn set_cache(&self, key: &str, value: &Value) -> Result<(), OfflineError> {
    let now = now_ms();
    let val = serde_json::to_string(value).map_err(|e| OfflineError::Db(e.to_string()))?;
    self.conn.execute(
      "INSERT INTO cache(key, value, updated_at) VALUES(?1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at",
      params![key, val, now],
    ).map_err(|e| OfflineError::Db(e.to_string()))?;
    Ok(())
  }

  pub fn get_cache(&self, key: &str) -> Result<Option<Value>, OfflineError> {
    let row: Option<String> = self.conn.query_row(
      "SELECT value FROM cache WHERE key = ?1",
      params![key],
      |r| r.get(0),
    ).optional().map_err(|e| OfflineError::Db(e.to_string()))?;
    if let Some(s) = row { Ok(Some(serde_json::from_str(&s).map_err(|e| OfflineError::Db(e.to_string()))?)) } else { Ok(None) }
  }

  pub fn queue(&self, method: String, path: String, payload: Option<Value>) -> Result<(), OfflineError> {
    let now = now_ms();
    let p = match payload { Some(v) => Some(serde_json::to_string(&v).map_err(|e| OfflineError::Db(e.to_string()))?), None => None };
    self.conn.execute(
      "INSERT INTO outbox(method, path, payload, created_at) VALUES(?1, ?2, ?3, ?4)",
      params![method, path, p, now],
    ).map_err(|e| OfflineError::Db(e.to_string()))?;
    Ok(())
  }

  // Flush queued requests to server. Returns number of flushed items.
  pub fn flush(&mut self, base_url: &str, bearer: Option<&str>) -> Result<u32, OfflineError> {
    let mut flushed: u32 = 0;
    loop {
      let tx = self.conn.transaction().map_err(|e| OfflineError::Db(e.to_string()))?;
      let row = tx.query_row(
        "SELECT id, method, path, payload FROM outbox ORDER BY id ASC LIMIT 1",
        [],
        |r| {
          Ok((r.get::<_, i64>(0)?, r.get::<_, String>(1)?, r.get::<_, String>(2)?, r.get::<_, Option<String>>(3)?))
        },
      ).optional().map_err(|e| OfflineError::Db(e.to_string()))?;

      let Some((id, method, path, payload)) = row else { break; };
      let url = if path.starts_with("http://") || path.starts_with("https://") { path.clone() } else { format!("{}{}", base_url.trim_end_matches('/'), path) };
      let client = reqwest::blocking::Client::new();
      let mut req = client.request(method.parse().unwrap_or(reqwest::Method::POST), url);
      if let Some(p) = payload.as_ref() {
        if let Ok(val) = serde_json::from_str::<Value>(p) { req = req.json(&val); }
      }
      if let Some(b) = bearer { req = req.bearer_auth(b); }
      req = req.header("Content-Type", "application/json");
      let res = req.send().map_err(|e| OfflineError::Http(e.to_string()))?;
      if !res.status().is_success() {
        // Stop on first failure
        tx.rollback().map_err(|e| OfflineError::Db(e.to_string()))?;
        break;
      }
      tx.execute("DELETE FROM outbox WHERE id = ?1", params![id]).map_err(|e| OfflineError::Db(e.to_string()))?;
      tx.commit().map_err(|e| OfflineError::Db(e.to_string()))?;
      flushed += 1;
    }
    Ok(flushed)
  }
}

fn now_ms() -> i64 {
  use std::time::{SystemTime, UNIX_EPOCH};
  SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis() as i64
}
