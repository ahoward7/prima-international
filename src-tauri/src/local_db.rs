use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use rusqlite::{Connection, params, Result as SqlResult};
use chrono::Utc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Contact {
    pub c_id: String,
    pub company: Option<String>,
    pub name: Option<String>,
    #[serde(alias = "createDate", rename = "createDate")]
    pub create_date: Option<String>,
    #[serde(alias = "lastModDate", rename = "lastModDate")]
    pub last_mod_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DBMachine {
    pub m_id: String,
    #[serde(alias = "contactId", rename = "contactId")]
    pub contact_id: Option<String>,
    #[serde(alias = "serialNumber", rename = "serialNumber")]
    pub serial_number: Option<String>,
    pub model: Option<String>,
    pub r#type: Option<String>,
    pub year: Option<i64>,
    pub hours: Option<i64>,
    pub description: Option<String>,
    pub salesman: Option<String>,
    #[serde(alias = "createDate", rename = "createDate")]
    pub create_date: String,
    #[serde(alias = "lastModDate", rename = "lastModDate")]
    pub last_mod_date: String,
    pub price: Option<f64>,
    pub location: Option<String>,
    pub notes: Option<String>,
    // Store any additional fields as JSON for flexibility
    #[serde(flatten)]
    pub extra_fields: std::collections::HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchivedMachine {
    pub a_id: String,
    #[serde(alias = "archiveDate", rename = "archiveDate")]
    pub archive_date: String,
    pub machine: DBMachine,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SoldMachine {
    pub s_id: String,
    pub machine: DBMachine,
    #[serde(alias = "dateSold", rename = "dateSold")]
    pub date_sold: Option<String>,
    #[serde(alias = "truckingCompany", rename = "truckingCompany")]
    pub trucking_company: Option<String>,
    pub buyer: Option<String>,
    #[serde(alias = "buyerLocation", rename = "buyerLocation")]
    pub buyer_location: Option<String>,
    #[serde(alias = "purchaseFob", rename = "purchaseFob")]
    pub purchase_fob: Option<String>,
    #[serde(alias = "machineCost", rename = "machineCost")]
    pub machine_cost: Option<f64>,
    #[serde(alias = "freightCost", rename = "freightCost")]
    pub freight_cost: Option<f64>,
    #[serde(alias = "paintCost", rename = "paintCost")]
    pub paint_cost: Option<f64>,
    #[serde(alias = "otherCost", rename = "otherCost")]
    pub other_cost: Option<f64>,
    pub profit: Option<f64>,
    #[serde(alias = "totalCost", rename = "totalCost")]
    pub total_cost: Option<f64>,
    pub notes: Option<String>,
}

impl Default for DBMachine {
    fn default() -> Self {
        let now = Utc::now().to_rfc3339();
        Self {
            m_id: String::new(),
            contact_id: None,
            serial_number: None,
            model: None,
            r#type: None,
            year: None,
            hours: None,
            description: None,
            salesman: None,
            create_date: now.clone(),
            last_mod_date: now,
            price: None,
            location: None,
            notes: None,
            extra_fields: std::collections::HashMap::new(),
        }
    }
}

#[derive(Clone)]
pub struct LocalDatabase {
    conn: Arc<Mutex<Connection>>,
}

impl LocalDatabase {
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let conn = Arc::new(Mutex::new(conn));
        
        let db = LocalDatabase { conn };
        db.initialize_schema()?;
        
        Ok(db)
    }

    fn initialize_schema(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        // Create contacts table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS contacts (
                c_id TEXT PRIMARY KEY,
                company TEXT,
                name TEXT,
                create_date TEXT,
                last_mod_date TEXT,
                extra_fields TEXT -- JSON for additional fields
            )",
            [],
        )?;

        // Create machines table with extra_fields for flexibility
        conn.execute(
            "CREATE TABLE IF NOT EXISTS machines (
                m_id TEXT PRIMARY KEY,
                contact_id TEXT,
                serial_number TEXT,
                model TEXT,
                type TEXT,
                year INTEGER,
                hours INTEGER,
                description TEXT,
                salesman TEXT,
                create_date TEXT NOT NULL,
                last_mod_date TEXT NOT NULL,
                price REAL,
                location TEXT,
                notes TEXT,
                extra_fields TEXT, -- JSON for additional fields
                FOREIGN KEY (contact_id) REFERENCES contacts (c_id)
            )",
            [],
        )?;

        // Create archived_machines table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS archived_machines (
                a_id TEXT PRIMARY KEY,
                archive_date TEXT NOT NULL,
                m_id TEXT,
                contact_id TEXT,
                serial_number TEXT,
                model TEXT,
                type TEXT,
                year INTEGER,
                hours INTEGER,
                description TEXT,
                salesman TEXT,
                create_date TEXT NOT NULL,
                last_mod_date TEXT NOT NULL,
                price REAL,
                location TEXT,
                notes TEXT,
                extra_fields TEXT -- JSON for additional fields
            )",
            [],
        )?;

        // Create sold_machines table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS sold_machines (
                s_id TEXT PRIMARY KEY,
                date_sold TEXT,
                trucking_company TEXT,
                buyer TEXT,
                buyer_location TEXT,
                purchase_fob TEXT,
                machine_cost REAL,
                freight_cost REAL,
                paint_cost REAL,
                other_cost REAL,
                profit REAL,
                total_cost REAL,
                notes TEXT,
                m_id TEXT,
                contact_id TEXT,
                serial_number TEXT,
                model TEXT,
                type TEXT,
                year INTEGER,
                hours INTEGER,
                description TEXT,
                salesman TEXT,
                create_date TEXT NOT NULL,
                last_mod_date TEXT NOT NULL,
                price REAL,
                location TEXT,
                machine_notes TEXT,
                extra_fields TEXT -- JSON for additional fields
            )",
            [],
        )?;

        // Create indexes for better performance
        conn.execute("CREATE INDEX IF NOT EXISTS idx_machines_contact_id ON machines(contact_id)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_machines_serial ON machines(serial_number)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_machines_model ON machines(model)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_machines_type ON machines(type)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_archived_serial ON archived_machines(serial_number)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_sold_serial ON sold_machines(serial_number)", [])?;

        Ok(())
    }

    // Contact operations
    pub fn create_contact(&self, contact: &Contact) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let extra_fields_json = serde_json::to_string(&serde_json::json!({})).unwrap_or_default();
        
        conn.execute(
            "INSERT INTO contacts (c_id, company, name, create_date, last_mod_date, extra_fields) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                contact.c_id,
                contact.company,
                contact.name,
                contact.create_date,
                contact.last_mod_date,
                extra_fields_json
            ],
        )?;
        Ok(())
    }

    pub fn get_contacts(&self, search: Option<&str>, limit: usize, offset: usize) -> Result<(Vec<Contact>, usize)> {
        let conn = self.conn.lock().unwrap();
        
        let (query, count_query, params) = if let Some(search_term) = search {
            let search_pattern = format!("%{}%", search_term);
            (
                "SELECT c_id, company, name, create_date, last_mod_date 
                 FROM contacts 
                 WHERE company LIKE ?1 OR name LIKE ?1 
                 ORDER BY last_mod_date DESC 
                 LIMIT ?2 OFFSET ?3".to_string(),
                "SELECT COUNT(*) FROM contacts WHERE company LIKE ?1 OR name LIKE ?1".to_string(),
                vec![search_pattern, limit.to_string(), offset.to_string()]
            )
        } else {
            (
                "SELECT c_id, company, name, create_date, last_mod_date 
                 FROM contacts 
                 ORDER BY last_mod_date DESC 
                 LIMIT ?1 OFFSET ?2".to_string(),
                "SELECT COUNT(*) FROM contacts".to_string(),
                vec![limit.to_string(), offset.to_string()]
            )
        };

        // Get total count
        let total: usize = if search.is_some() {
            let param_refs: Vec<&str> = params.iter().take(1).map(|s| s.as_str()).collect();
            conn.query_row(&count_query, rusqlite::params_from_iter(param_refs.iter()), |row| row.get(0))?
        } else {
            conn.query_row(&count_query, [], |row| row.get(0))?
        };

        // Get contacts
        let mut stmt = conn.prepare(&query)?;
        let param_refs: Vec<&str> = params.iter().map(|s| s.as_str()).collect();
        let contact_iter = stmt.query_map(rusqlite::params_from_iter(param_refs.iter()), |row| {
            Ok(Contact {
                c_id: row.get(0)?,
                company: row.get(1)?,
                name: row.get(2)?,
                create_date: row.get(3)?,
                last_mod_date: row.get(4)?,
            })
        })?;

        let contacts: SqlResult<Vec<Contact>> = contact_iter.collect();
        Ok((contacts?, total))
    }

    // Machine operations
    pub fn create_machine(&self, machine: &DBMachine) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let extra_fields_json = serde_json::to_string(&machine.extra_fields).unwrap_or_default();
        
        conn.execute(
            "INSERT INTO machines (
                m_id, contact_id, serial_number, model, type, year, hours,
                description, salesman, create_date, last_mod_date, price, location, notes, extra_fields
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
            params![
                machine.m_id,
                machine.contact_id,
                machine.serial_number,
                machine.model,
                machine.r#type,
                machine.year,
                machine.hours,
                machine.description,
                machine.salesman,
                machine.create_date,
                machine.last_mod_date,
                machine.price,
                machine.location,
                machine.notes,
                extra_fields_json
            ],
        )?;
        Ok(())
    }

    pub fn get_machines(&self, 
        search: Option<&str>, 
        model: Option<&str>,
        machine_type: Option<&str>,
        contact_id: Option<&str>,
        limit: usize, 
        offset: usize
    ) -> Result<(Vec<DBMachine>, usize)> {
        let conn = self.conn.lock().unwrap();
        
        let mut where_clauses = Vec::new();
        let mut params: Vec<String> = Vec::new();
        
        if let Some(search_term) = search {
            where_clauses.push("(serial_number LIKE ? OR model LIKE ? OR type LIKE ? OR location LIKE ?)");
            let search_pattern = format!("%{}%", search_term);
            params.extend([search_pattern.clone(), search_pattern.clone(), search_pattern.clone(), search_pattern]);
        }
        if let Some(m) = model {
            where_clauses.push("model = ?");
            params.push(m.to_string());
        }
        if let Some(t) = machine_type {
            where_clauses.push("type = ?");
            params.push(t.to_string());
        }
        if let Some(cid) = contact_id {
            where_clauses.push("contact_id = ?");
            params.push(cid.to_string());
        }

        let where_clause = if where_clauses.is_empty() {
            String::new()
        } else {
            format!("WHERE {}", where_clauses.join(" AND "))
        };

        let base_query = format!(
            "SELECT m_id, contact_id, serial_number, model, type, year, hours,
                    description, salesman, create_date, last_mod_date, price, location, notes, extra_fields
             FROM machines {} ORDER BY last_mod_date DESC",
            where_clause
        );

        let count_query = format!("SELECT COUNT(*) FROM machines {}", where_clause);
        
        // Get total count
        let total: usize = {
            let param_refs: Vec<&str> = params.iter().map(|s| s.as_str()).collect();
            conn.query_row(&count_query, rusqlite::params_from_iter(param_refs.iter()), |row| row.get(0))?
        };

        // Add limit and offset params
        params.push(limit.to_string());
        params.push(offset.to_string());

        let query = format!("{} LIMIT ? OFFSET ?", base_query);

        // Get machines
        let mut stmt = conn.prepare(&query)?;
        let param_refs: Vec<&str> = params.iter().map(|s| s.as_str()).collect();
        let machine_iter = stmt.query_map(rusqlite::params_from_iter(param_refs.iter()), |row| {
            let extra_fields_str: String = row.get(14).unwrap_or_default();
            let extra_fields = serde_json::from_str(&extra_fields_str).unwrap_or_default();
            
            Ok(DBMachine {
                m_id: row.get(0)?,
                contact_id: row.get(1)?,
                serial_number: row.get(2)?,
                model: row.get(3)?,
                r#type: row.get(4)?,
                year: row.get(5)?,
                hours: row.get(6)?,
                description: row.get(7)?,
                salesman: row.get(8)?,
                create_date: row.get(9)?,
                last_mod_date: row.get(10)?,
                price: row.get(11)?,
                location: row.get(12)?,
                notes: row.get(13)?,
                extra_fields,
            })
        })?;

        let machines: SqlResult<Vec<DBMachine>> = machine_iter.collect();
        Ok((machines?, total))
    }

    pub fn update_machine(&self, machine: &DBMachine) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().to_rfc3339();
        let extra_fields_json = serde_json::to_string(&machine.extra_fields).unwrap_or_default();
        
        conn.execute(
            "UPDATE machines SET 
                contact_id = ?1, serial_number = ?2, model = ?3, type = ?4,
                year = ?5, hours = ?6, description = ?7, salesman = ?8,
                last_mod_date = ?9, price = ?10, location = ?11, notes = ?12, extra_fields = ?13
             WHERE m_id = ?14",
            params![
                machine.contact_id,
                machine.serial_number,
                machine.model,
                machine.r#type,
                machine.year,
                machine.hours,
                machine.description,
                machine.salesman,
                now,
                machine.price,
                machine.location,
                machine.notes,
                extra_fields_json,
                machine.m_id
            ],
        )?;
        Ok(())
    }

    pub fn get_machine_by_id(&self, machine_id: &str) -> Result<Option<DBMachine>> {
        log::info!("🔍 LocalDB: Looking up machine with ID: {}", machine_id);
        let conn = self.conn.lock().unwrap();
        
        let mut stmt = conn.prepare(
            "SELECT m_id, contact_id, serial_number, model, type, year, hours,
                    description, salesman, create_date, last_mod_date, price, location, notes, extra_fields
             FROM machines WHERE m_id = ?1"
        )?;
        
        let machine_result = stmt.query_row(params![machine_id], |row| {
            let extra_fields_str: String = row.get(14).unwrap_or_default();
            let extra_fields = serde_json::from_str(&extra_fields_str).unwrap_or_default();
            
            Ok(DBMachine {
                m_id: row.get(0)?,
                contact_id: row.get(1)?,
                serial_number: row.get(2)?,
                model: row.get(3)?,
                r#type: row.get(4)?,
                year: row.get(5)?,
                hours: row.get(6)?,
                description: row.get(7)?,
                salesman: row.get(8)?,
                create_date: row.get(9)?,
                last_mod_date: row.get(10)?,
                price: row.get(11)?,
                location: row.get(12)?,
                notes: row.get(13)?,
                extra_fields,
            })
        });
        
        match machine_result {
            Ok(machine) => {
                log::info!("✅ LocalDB: Found machine {} with model: {:?}", machine_id, machine.model);
                Ok(Some(machine))
            },
            Err(rusqlite::Error::QueryReturnedNoRows) => {
                log::warn!("❌ LocalDB: No machine found with ID: {}", machine_id);
                Ok(None)
            },
            Err(e) => {
                log::error!("💥 LocalDB: Database error for machine {}: {}", machine_id, e);
                Err(e.into())
            },
        }
    }

    pub fn delete_machine(&self, machine_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM machines WHERE m_id = ?1", params![machine_id])?;
        Ok(())
    }

    // Archive operations
    pub fn archive_machine(&self, machine: &DBMachine, archive_date: &str) -> Result<String> {
        let conn = self.conn.lock().unwrap();
        let a_id = self.generate_id();
        
        conn.execute(
            "INSERT INTO archived_machines (
                a_id, archive_date, m_id, contact_id, serial_number, model, type,
                year, hours, description, salesman, create_date, last_mod_date,
                price, location, notes
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
            params![
                a_id,
                archive_date,
                machine.m_id,
                machine.contact_id,
                machine.serial_number,
                machine.model,
                machine.r#type,
                machine.year,
                machine.hours,
                machine.description,
                machine.salesman,
                machine.create_date,
                machine.last_mod_date,
                machine.price,
                machine.location,
                machine.notes
            ],
        )?;

        // Remove from active machines
        self.delete_machine(&machine.m_id)?;
        
        Ok(a_id)
    }

    // Utility methods
    pub fn generate_id(&self) -> String {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        let n: u64 = rng.gen();
        format!("{:010}", n % 10_000_000_000)
    }

    pub fn get_distinct_values(&self, column: &str, table: &str) -> Result<Vec<String>> {
        let conn = self.conn.lock().unwrap();
        // Exclude NULLs and empty strings
        let query = format!(
            "SELECT DISTINCT {col} FROM {tbl} WHERE {col} IS NOT NULL AND TRIM({col}) <> '' ORDER BY {col}",
            col = column,
            tbl = table
        );
        
        let mut stmt = conn.prepare(&query)?;
        let value_iter = stmt.query_map([], |row| {
            Ok(row.get::<_, String>(0)?)
        })?;

        let values: SqlResult<Vec<String>> = value_iter.collect();
        Ok(values?)
    }

    // Sync operations
    pub fn clear_all_data(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM machines", [])?;
        conn.execute("DELETE FROM archived_machines", [])?;
        conn.execute("DELETE FROM sold_machines", [])?;
        conn.execute("DELETE FROM contacts", [])?;
        Ok(())
    }

    pub fn bulk_insert_contacts(&self, contacts: &[Contact]) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "INSERT OR REPLACE INTO contacts (c_id, company, name, create_date, last_mod_date, extra_fields) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
        )?;

        for contact in contacts {
            let extra_fields_json = serde_json::to_string(&serde_json::json!({})).unwrap_or_default();
            stmt.execute(params![
                contact.c_id,
                contact.company,
                contact.name,
                contact.create_date,
                contact.last_mod_date,
                extra_fields_json
            ])?;
        }

        Ok(())
    }

    pub fn bulk_insert_machines(&self, machines: &[DBMachine]) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "INSERT OR REPLACE INTO machines (
                m_id, contact_id, serial_number, model, type, year, hours,
                description, salesman, create_date, last_mod_date, price, location, notes, extra_fields
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)"
        )?;

        for machine in machines {
            let extra_fields_json = serde_json::to_string(&machine.extra_fields).unwrap_or_default();
            stmt.execute(params![
                machine.m_id,
                machine.contact_id,
                machine.serial_number,
                machine.model,
                machine.r#type,
                machine.year,
                machine.hours,
                machine.description,
                machine.salesman,
                machine.create_date,
                machine.last_mod_date,
                machine.price,
                machine.location,
                machine.notes,
                extra_fields_json
            ])?;
        }

        Ok(())
    }

    pub fn bulk_insert_archived(&self, archived: &[ArchivedMachine]) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "INSERT OR REPLACE INTO archived_machines (
                a_id, archive_date, m_id, contact_id, serial_number, model, type,
                year, hours, description, salesman, create_date, last_mod_date,
                price, location, notes, extra_fields
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)"
        )?;

        for item in archived {
            let extra_fields_json = serde_json::to_string(&item.machine.extra_fields).unwrap_or_default();
            stmt.execute(params![
                item.a_id,
                item.archive_date,
                item.machine.m_id,
                item.machine.contact_id,
                item.machine.serial_number,
                item.machine.model,
                item.machine.r#type,
                item.machine.year,
                item.machine.hours,
                item.machine.description,
                item.machine.salesman,
                item.machine.create_date,
                item.machine.last_mod_date,
                item.machine.price,
                item.machine.location,
                item.machine.notes,
                extra_fields_json
            ])?;
        }

        Ok(())
    }

    pub fn bulk_insert_sold(&self, sold: &[SoldMachine]) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "INSERT OR REPLACE INTO sold_machines (
                s_id, date_sold, trucking_company, buyer, buyer_location, purchase_fob,
                machine_cost, freight_cost, paint_cost, other_cost, profit, total_cost, notes,
                m_id, contact_id, serial_number, model, type, year, hours, description,
                salesman, create_date, last_mod_date, price, location, machine_notes, extra_fields
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26, ?27, ?28)"
        )?;

        for item in sold {
            let extra_fields_json = serde_json::to_string(&item.machine.extra_fields).unwrap_or_default();
            stmt.execute(params![
                item.s_id,
                item.date_sold,
                item.trucking_company,
                item.buyer,
                item.buyer_location,
                item.purchase_fob,
                item.machine_cost,
                item.freight_cost,
                item.paint_cost,
                item.other_cost,
                item.profit,
                item.total_cost,
                item.notes,
                item.machine.m_id,
                item.machine.contact_id,
                item.machine.serial_number,
                item.machine.model,
                item.machine.r#type,
                item.machine.year,
                item.machine.hours,
                item.machine.description,
                item.machine.salesman,
                item.machine.create_date,
                item.machine.last_mod_date,
                item.machine.price,
                item.machine.location,
                item.machine.notes,
                extra_fields_json
            ])?;
        }

        Ok(())
    }

    // Helper method to convert JSON to flexible structs
    pub fn json_to_contact(value: &serde_json::Value) -> Contact {
        Contact {
            c_id: value.get("c_id")
                .or_else(|| value.get("cId"))
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            company: value.get("company").and_then(|v| v.as_str()).map(|s| s.to_string()),
            name: value.get("name").and_then(|v| v.as_str()).map(|s| s.to_string()),
            create_date: value.get("createDate")
                .or_else(|| value.get("create_date"))
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            last_mod_date: value.get("lastModDate")
                .or_else(|| value.get("last_mod_date"))
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
        }
    }

    pub fn json_to_machine(value: &serde_json::Value) -> DBMachine {
        let now = Utc::now().to_rfc3339();
        
        // Collect all extra fields that aren't standard
        let mut extra_fields = std::collections::HashMap::new();
        if let Some(obj) = value.as_object() {
            for (key, val) in obj {
                match key.as_str() {
                    "m_id" | "contactId" | "contact_id" | "serialNumber" | "serial_number" |
                    "model" | "type" | "year" | "hours" | "description" | "salesman" |
                    "createDate" | "create_date" | "lastModDate" | "last_mod_date" |
                    "price" | "location" | "notes" | "contact" => {
                        // Skip standard fields
                    }
                    _ => {
                        extra_fields.insert(key.clone(), val.clone());
                    }
                }
            }
        }

        DBMachine {
            m_id: value.get("m_id")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            contact_id: value.get("contactId")
                .or_else(|| value.get("contact_id"))
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            serial_number: value.get("serialNumber")
                .or_else(|| value.get("serial_number"))
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            model: value.get("model").and_then(|v| v.as_str()).map(|s| s.to_string()),
            r#type: value.get("type").and_then(|v| v.as_str()).map(|s| s.to_string()),
            year: value.get("year").and_then(|v| v.as_i64()),
            hours: value.get("hours").and_then(|v| v.as_i64()),
            description: value.get("description").and_then(|v| v.as_str()).map(|s| s.to_string()),
            salesman: value.get("salesman").and_then(|v| v.as_str()).map(|s| s.to_string()),
            create_date: value.get("createDate")
                .or_else(|| value.get("create_date"))
                .and_then(|v| v.as_str())
                .unwrap_or(&now)
                .to_string(),
            last_mod_date: value.get("lastModDate")
                .or_else(|| value.get("last_mod_date"))
                .and_then(|v| v.as_str())
                .unwrap_or(&now)
                .to_string(),
            price: value.get("price").and_then(|v| v.as_f64()),
            location: value.get("location").and_then(|v| v.as_str()).map(|s| s.to_string()),
            notes: value.get("notes").and_then(|v| v.as_str()).map(|s| s.to_string()),
            extra_fields,
        }
    }
}
