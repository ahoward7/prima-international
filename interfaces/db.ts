interface DBBaseEntity {
  id: number
}

export interface DBContact extends DBBaseEntity {
  company: string
  name?: string
}

export interface DBMachine extends DBBaseEntity {
  contact_id: number
  type?: string
  model?: string
  serial_number?: string
  year?: string
  hours?: number
  description?: string
  salesman: string
  create_date: string
  last_mod_date: string
  price?: number
  location?: string
  notes?: string
}

export interface DBSoldMachine extends DBBaseEntity {
  machine_id: number
  buyer: Contact
  trucking_company: string
  total_cost: number
  machine_cost: number
  freight_cost: number
  paint_cost: number
  profit_from_sale: number
  notes?: string
}

export interface DBArchivedMachine extends DBBaseEntity {
  machine_id: number
  date_archived: string
}