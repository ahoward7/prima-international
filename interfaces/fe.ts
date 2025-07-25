export interface MachineFilters {
  location?: string
  search?: string
  pageSize?: number
  page?: number
  sortBy?: string
  model?: string
  type?: string
}

export interface Contact {
  c_id: string
  company?: string
  name?: string
  createDate: string
  lastModDate: string
}

export interface Machine {
  m_id: string
  contactId: string
  contact: Contact
  type?: string
  model?: string
  serialNumber?: string
  year?: string
  hours?: number
  description?: string
  salesman: string
  createDate: string
  lastModDate: string
  price?: number
  location?: string
  notes?: string
}

export interface SoldMachine {
  s_id: string
  machine: Machine
  buyer: Contact
  buyerLocation: string
  truckingCompany: string
  totalCost: number
  machineCost: number
  freightCost: number
  paintCost: number
  profitFromSale: number
  purchaseFob: string
  saleFobPoint: string
  notes?: string
}

export interface ArchivedMachine {
  a_id: string
  machine: Machine
  dateArchived: Date | string
}

export type ContactForm = Partial<Omit<Contact, 'id'>>

export type MachineForm = Partial<Omit<Machine, 'id' | 'contact'>> & {
  contact?: ContactForm
}

export type SoldMachineForm = Partial<Omit<SoldMachine, 'id' | 'machine' | 'buyer'>> & {
  machine?: MachineForm
  buyer?: ContactForm
}

export type TableColumn = {
  key: string
  label: string
  flex: string
}

export type TableColumnC = {
  key: string
  label: string
  sort: boolean
}

export type FilterOption = {
  label: string
  data: string | number
}

export type FilterOptions = { [key: string]: FilterOption[] }