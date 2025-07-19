interface DBBaseEntity {
  id: number
}

export interface DBContact extends DBBaseEntity {
  company: string
  name?: string
}

export interface DBMachine extends DBBaseEntity {
  contact_id: number
  type: string | null
  model: string | null
  serial_number: string | null
  year: string | null
  hours: number | null
  description: string | null
  salesman: string | null
  create_date: string | null
  last_mod_date: string | null
  price: number | null
  location: string | null
  notes: string | null
}

export interface DBSoldMachine extends DBBaseEntity {
  machine_id: number
  buyer: Contact
  trucking_company: string
  total_cost: number | null
  machine_cost: number | null
  freight_cost: number | null
  paint_cost: number | null
  profit_from_sale: number | null
  notes?: string | null
}

export interface DBArchivedMachine extends DBBaseEntity {
  machine_id: number
  date_archived: string
}