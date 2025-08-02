export interface MachineFilters {
  location?: string
  search?: string
  pageSize?: number
  page?: number
  sortBy?: string
  model?: string
  type?: string
}

export interface MachineFilterStrings {
  [key: string]: string
}

export interface ApiData<T> {
  data: T[],
  total: number
}

export interface Contact {
  c_id: string
  company?: string
  name?: string
  createDate: string
  lastModDate: string
}

export interface DBMachine {
  m_id: string
  contactId: string
  type?: string
  model?: string
  serialNumber?: string
  year?: number
  hours?: number
  description?: string
  salesman: string
  createDate: string
  lastModDate: string
  price?: number
  location?: string
  notes?: string
}

export interface Machine extends DBMachine {
  contact: Contact
}

export interface DBSoldMachine {
  s_id: string
  machine: Omit<DBMachine, 'm_id'>
  dateSold?: string
  truckingCompany?: string
  buyer?: string
  buyerLocation?: string
  purchaseFob?: string
  machineCost: number
  freightCost: number
  paintCost: number
  otherCost: number
  profit: number
  totalCost: number
  notes: string
}

export interface SoldMachine extends DBSoldMachine {
  machine: Omit<Machine, 'm_id'>
}

export interface ArchivedMachine {
  a_id: string
  archiveDate: string
  machine: Omit<Machine, 'm_id'>
}

export type ContactForm = Partial<Contact>

export interface MachineForm extends Partial<DBMachine> {
  contact: ContactForm
}

export interface SoldMachineForm extends Partial<Omit<DBSoldMachine, 'machine'>> {
  machine: MachineForm
}

export interface TableColumn {
  key: string
  label: string
  flex: string
}

export interface TableColumnC {
  key: string
  label: string
  sort: boolean
}

export interface FilterOption {
  label: string
  data: string | number
}

export interface FilterOptions { [key: string]: FilterOption[] }
export interface StringObject { [key: string]: string[] }