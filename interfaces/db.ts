export interface DBMachine {
  m_id: string
  contactId: string
  type: string | null
  model: string | null
  serialNumber: string | null
  year: string | null
  hours: number | null
  description: string | null
  salesman: string | null
  createDate: string | null
  lastModDate: string | null
  price: number | null
  location: string | null
  notes: string | null
}

export interface DBSoldMachine {
  s_id: string
  machineId: number
  buyer_id: string
  truckingCompany: string
  totalCost: number | null
  machineCost: number | null
  freightCost: number | null
  paintCost: number | null
  profitFromSale: number | null
  notes?: string | null
}

export interface DBArchivedMachine {
  a_id: string
  machineId: number
  dateArchived: string
}