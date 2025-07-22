export type MachineCategory = 'located' | 'sold' | 'archived' | 'all'

export interface MachineFilters {
  location?: MachineCategory
  search?: string
  pageSize?: number
  sortBy?: string
  model?: string
  type?: string
}

interface BaseEntity {
  id: string | number
}

export interface Contact extends BaseEntity {
  company: string
  name?: string
}

export interface Machine extends BaseEntity {
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

export interface SoldMachine extends BaseEntity {
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

export interface ArchivedMachine extends BaseEntity {
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
}