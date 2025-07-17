interface DBBaseEntity {
  id: number
}

export interface DBContact extends DBBaseEntity {
  company: string
  name?: string
}

export interface DBMachine extends DBBaseEntity {
  serial_number?: number
  contactId: string
  location?: string
  type?: string
  model?: string
  year?: number
  hours?: number
  price?: number
  salesman: string
  description?: string
  date_created: string
  date_last_modified: string
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