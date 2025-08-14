use directories::ProjectDirs;
use rusqlite::{params, Connection, OptionalExtension};
use rusqlite::ToSql;
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
      -- Local snapshot tables for robust offline use
      CREATE TABLE IF NOT EXISTS machines_located (
        m_id TEXT PRIMARY KEY,
        serialNumber TEXT,
        model TEXT,
        type TEXT,
        salesman TEXT,
        contactId TEXT,
        lastModDate TEXT,
        data TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_located_model ON machines_located(model);
      CREATE INDEX IF NOT EXISTS idx_located_type ON machines_located(type);
      CREATE INDEX IF NOT EXISTS idx_located_serial ON machines_located(serialNumber);
      CREATE INDEX IF NOT EXISTS idx_located_salesman ON machines_located(salesman);
      CREATE INDEX IF NOT EXISTS idx_located_contact ON machines_located(contactId);

      CREATE TABLE IF NOT EXISTS machines_archived (
        a_id TEXT PRIMARY KEY,
        serialNumber TEXT,
        model TEXT,
        type TEXT,
        salesman TEXT,
        contactId TEXT,
        lastModDate TEXT,
        data TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_archived_model ON machines_archived(model);
      CREATE INDEX IF NOT EXISTS idx_archived_type ON machines_archived(type);
      CREATE INDEX IF NOT EXISTS idx_archived_serial ON machines_archived(serialNumber);
      CREATE INDEX IF NOT EXISTS idx_archived_salesman ON machines_archived(salesman);
      CREATE INDEX IF NOT EXISTS idx_archived_contact ON machines_archived(contactId);

      CREATE TABLE IF NOT EXISTS machines_sold (
        s_id TEXT PRIMARY KEY,
        serialNumber TEXT,
        model TEXT,
        type TEXT,
        salesman TEXT,
        contactId TEXT,
        lastModDate TEXT,
        data TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sold_model ON machines_sold(model);
      CREATE INDEX IF NOT EXISTS idx_sold_type ON machines_sold(type);
      CREATE INDEX IF NOT EXISTS idx_sold_serial ON machines_sold(serialNumber);
      CREATE INDEX IF NOT EXISTS idx_sold_salesman ON machines_sold(salesman);
      CREATE INDEX IF NOT EXISTS idx_sold_contact ON machines_sold(contactId);

      CREATE TABLE IF NOT EXISTS contacts (
        c_id TEXT PRIMARY KEY,
        name TEXT,
        company TEXT,
        lastModDate TEXT,
        data TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
      CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
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

  fn table_for_location(location: &str) -> Option<(&'static str, &'static str)> {
    match location {
      "located" => Some(("machines_located", "m_id")),
      "archived" => Some(("machines_archived", "a_id")),
      "sold" => Some(("machines_sold", "s_id")),
      _ => None,
    }
  }

  fn str_field<'a>(v: &'a Value, key: &str) -> String {
    v.get(key).and_then(|x| x.as_str()).unwrap_or("").to_string()
  }

  fn extract_machine_fields(location: &str, item: &Value) -> Option<(String, String, String, String, String, String, String, String)> {
    // returns (id, serial, model, type, salesman, contactId, lastModDate, data_json)
    let (_table, id_key) = Self::table_for_location(location)?;
    let (root, id_val) = if location == "located" {
      (item, item.get(id_key))
    } else {
      (item.get("machine").unwrap_or(&Value::Null), item.get(id_key))
    };
    let id = id_val.and_then(|x| x.as_str()).unwrap_or("").to_string();
    if id.is_empty() { return None; }
    let serial = Self::str_field(root, "serialNumber");
    let model = Self::str_field(root, "model");
    let mtype = Self::str_field(root, "type");
    let salesman = Self::str_field(root, "salesman");
    let contact_id = Self::str_field(root, "contactId");
    let last_mod = Self::str_field(root, "lastModDate");
    let data_json = serde_json::to_string(item).ok()?;
    Some((id, serial, model, mtype, salesman, contact_id, last_mod, data_json))
  }

  pub fn clear_snapshot(&self, category: &str) -> Result<(), OfflineError> {
    match category {
      "located" => { self.conn.execute("DELETE FROM machines_located", []).map_err(|e| OfflineError::Db(e.to_string()))?; }
      "archived" => { self.conn.execute("DELETE FROM machines_archived", []).map_err(|e| OfflineError::Db(e.to_string()))?; }
      "sold" => { self.conn.execute("DELETE FROM machines_sold", []).map_err(|e| OfflineError::Db(e.to_string()))?; }
      "contacts" => { self.conn.execute("DELETE FROM contacts", []).map_err(|e| OfflineError::Db(e.to_string()))?; }
      _ => {}
    }
    Ok(())
  }

  pub fn upsert_snapshot(&mut self, category: &str, items: &[Value]) -> Result<u32, OfflineError> {
    let tx = self.conn.transaction().map_err(|e| OfflineError::Db(e.to_string()))?;
    let mut count: u32 = 0;
    match category {
      "contacts" => {
        let mut stmt = tx.prepare(
          "INSERT INTO contacts(c_id, name, company, lastModDate, data) VALUES(?1, ?2, ?3, ?4, ?5)
           ON CONFLICT(c_id) DO UPDATE SET name=excluded.name, company=excluded.company, lastModDate=excluded.lastModDate, data=excluded.data"
        ).map_err(|e| OfflineError::Db(e.to_string()))?;
        for it in items.iter() {
          let c_id = it.get("c_id").and_then(|x| x.as_str()).unwrap_or("");
          if c_id.is_empty() { continue; }
          let name = Self::str_field(it, "name");
          let company = Self::str_field(it, "company");
          let last_mod = Self::str_field(it, "lastModDate");
          let data_json = serde_json::to_string(it).map_err(|e| OfflineError::Db(e.to_string()))?;
          stmt.execute(params![c_id, name, company, last_mod, data_json]).map_err(|e| OfflineError::Db(e.to_string()))?;
          count += 1;
        }
      }
      loc @ ("located" | "archived" | "sold") => {
        let (table, id_col) = Self::table_for_location(loc).ok_or_else(|| OfflineError::Db("bad location".into()))?;
        let sql = format!(
          "INSERT INTO {table}({id_col}, serialNumber, model, type, salesman, contactId, lastModDate, data) VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
           ON CONFLICT({id_col}) DO UPDATE SET serialNumber=excluded.serialNumber, model=excluded.model, type=excluded.type, salesman=excluded.salesman, contactId=excluded.contactId, lastModDate=excluded.lastModDate, data=excluded.data",
          table=table, id_col=id_col
        );
        let mut stmt = tx.prepare(&sql).map_err(|e| OfflineError::Db(e.to_string()))?;
        for it in items.iter() {
          if let Some((id, serial, model, mtype, salesman, contact_id, last_mod, data_json)) = Self::extract_machine_fields(loc, it) {
            stmt.execute(params![id, serial, model, mtype, salesman, contact_id, last_mod, data_json]).map_err(|e| OfflineError::Db(e.to_string()))?;
            count += 1;
          }
        }
      }
      _ => {}
    }
    tx.commit().map_err(|e| OfflineError::Db(e.to_string()))?;
    Ok(count)
  }

  pub fn query_machines(&self, location: &str, search: Option<String>, model: Option<String>, mtype: Option<String>, contact_id: Option<String>, sort_by: Option<String>, page: u32, page_size: u32) -> Result<(Vec<Value>, u32), OfflineError> {
    let (table, _id_col) = Self::table_for_location(location).ok_or_else(|| OfflineError::Db("bad location".into()))?;
    let mut where_clauses: Vec<String> = Vec::new();
    let mut values: Vec<String> = Vec::new();
    if let Some(s) = search.as_ref().filter(|s| !s.is_empty()) {
      where_clauses.push("(lower(model) LIKE ? OR lower(type) LIKE ? OR lower(serialNumber) LIKE ?)".into());
      let sval = format!("%{}%", s.to_lowercase());
      values.push(sval.clone());
      values.push(sval.clone());
      values.push(sval);
    }
    if let Some(m) = model.as_ref().filter(|m| !m.is_empty()) {
      where_clauses.push("model = ?".into());
      values.push(m.to_string());
    }
    if let Some(t) = mtype.as_ref().filter(|t| !t.is_empty()) {
      where_clauses.push("type = ?".into());
      values.push(t.to_string());
    }
    if let Some(c) = contact_id.as_ref().filter(|c| !c.is_empty()) {
      where_clauses.push("contactId = ?".into());
      values.push(c.to_string());
    }
    let where_sql = if where_clauses.is_empty() { "".to_string() } else { format!("WHERE {}", where_clauses.join(" AND ")) };

    let (sort_col, sort_dir) = if let Some(sb) = sort_by {
      let desc = sb.starts_with('-');
      let col = sb.trim_start_matches('-');
      let col = match col {
        "model" => "model",
        "type" => "type",
        "serialNumber" => "serialNumber",
        "salesman" => "salesman",
        "lastModDate" => "lastModDate",
        _ => "model",
      };
      (col, if desc { "DESC" } else { "ASC" })
    } else { ("model", "ASC") };

    let offset = (page.max(1) - 1) as u32 * page_size.max(1);

    // Count query
    let count_sql = format!("SELECT COUNT(*) FROM {table} {where_sql}");
    let mut count_stmt = self.conn.prepare(&count_sql).map_err(|e| OfflineError::Db(e.to_string()))?;
    let mut count_refs: Vec<&dyn ToSql> = Vec::new();
    for v in values.iter() { count_refs.push(v as &dyn ToSql); }
    let total: u32 = count_stmt.query_row(&count_refs[..], |r| r.get::<_, i64>(0)).map(|n| n as u32).map_err(|e| OfflineError::Db(e.to_string()))?;

    // List query
    let list_sql = format!("SELECT data FROM {table} {where_sql} ORDER BY {sort_col} {sort_dir} LIMIT ? OFFSET ?");
    let mut list_stmt = self.conn.prepare(&list_sql).map_err(|e| OfflineError::Db(e.to_string()))?;
    let limit_i64: i64 = page_size as i64;
    let offset_i64: i64 = offset as i64;
    let mut list_refs: Vec<&dyn ToSql> = Vec::new();
    for v in values.iter() { list_refs.push(v as &dyn ToSql); }
    list_refs.push(&limit_i64);
    list_refs.push(&offset_i64);

    let mut rows = list_stmt.query(&list_refs[..]).map_err(|e| OfflineError::Db(e.to_string()))?;
    let mut out: Vec<Value> = Vec::new();
    while let Some(row) = rows.next().map_err(|e| OfflineError::Db(e.to_string()))? {
      let s: String = row.get(0).map_err(|e| OfflineError::Db(e.to_string()))?;
      let v: Value = serde_json::from_str(&s).map_err(|e| OfflineError::Db(e.to_string()))?;
      out.push(v);
    }
    Ok((out, total))
  }

  pub fn get_machine_detail(&self, location: &str, id: &str) -> Result<Option<Value>, OfflineError> {
    let (table, id_col) = Self::table_for_location(location).ok_or_else(|| OfflineError::Db("bad location".into()))?;
    let sql = format!("SELECT data FROM {table} WHERE {id_col} = ?1");
    let row: Option<String> = self.conn.query_row(sql.as_str(), params![id], |r| r.get(0)).optional().map_err(|e| OfflineError::Db(e.to_string()))?;
    if let Some(s) = row { Ok(Some(serde_json::from_str(&s).map_err(|e| OfflineError::Db(e.to_string()))?)) } else { Ok(None) }
  }

  pub fn query_contacts(&self, search: Option<String>, page_size: u32) -> Result<Vec<Value>, OfflineError> {
    let mut where_sql = String::new();
    let mut values: Vec<String> = Vec::new();
    if let Some(s) = search.filter(|s| !s.is_empty()) {
      where_sql = "WHERE lower(name) LIKE ? OR lower(company) LIKE ?".into();
      let sval = format!("%{}%", s.to_lowercase());
      values.push(sval.clone());
      values.push(sval);
    }
    let limit_i64: i64 = page_size as i64;
    let sql = format!("SELECT data FROM contacts {where_sql} LIMIT ?");
    let mut stmt = self.conn.prepare(&sql).map_err(|e| OfflineError::Db(e.to_string()))?;
    let mut refs: Vec<&dyn ToSql> = Vec::new();
    for v in values.iter() { refs.push(v as &dyn ToSql); }
    refs.push(&limit_i64);
    let mut rows = stmt.query(&refs[..]).map_err(|e| OfflineError::Db(e.to_string()))?;
    let mut out: Vec<Value> = Vec::new();
    while let Some(row) = rows.next().map_err(|e| OfflineError::Db(e.to_string()))? {
      let s: String = row.get(0).map_err(|e| OfflineError::Db(e.to_string()))?;
      let v: Value = serde_json::from_str(&s).map_err(|e| OfflineError::Db(e.to_string()))?;
      out.push(v);
    }
    Ok(out)
  }
}

fn now_ms() -> i64 {
  use std::time::{SystemTime, UNIX_EPOCH};
  SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis() as i64
}
