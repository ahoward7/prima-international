import type { Contact, ContactForm } from './contact'

export interface MachineFilters {
  location?: string
  search?: string
  pageSize?: number
  page?: number
  sortBy?: string
  model?: string
  type?: string
  contactId?: string
}

export interface MachineFilterStrings {
  [key: string]: string
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

export interface MachineToPut extends DBMachine {
  contact?: Contact
}

export type MachineLocationString = 'located' | 'archived' | 'sold'

export interface MachineLocations {
  located: string[]
  archived: string[]
  sold: string[]
}

export interface MachineForm extends Partial<DBMachine> {
  contact: ContactForm
}
