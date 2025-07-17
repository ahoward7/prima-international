export type MachineCategory = 'located' | 'sold' | 'archived' | 'all'

export interface MachineFilters {
  category: MachineCategory
}

interface BaseEntity {
  id: string | number
}

export interface Contact extends BaseEntity {
  company: string
  name?: string
}

export interface Machine extends BaseEntity {
  serialNumber?: string
  contact: Contact
  location?: string
  type?: string
  model?: string
  year?: number
  hours?: number
  price?: number
  salesman: string
  description?: string
  dateCreated: string
  dateLastModified: string
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