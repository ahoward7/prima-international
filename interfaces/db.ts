import type { ObjectId } from 'mongoose'

interface DBBaseEntity {
  id: number
}

export interface DBContact extends DBBaseEntity {
  company: string
  name?: string
}

export interface DBMachine extends DBBaseEntity {
  contactId: ObjectId
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

export interface DBSoldMachine extends DBBaseEntity {
  machineId: number
  buyer: Contact
  truckingCompany: string
  totalCost: number | null
  machineCost: number | null
  freightCost: number | null
  paintCost: number | null
  profitFromSale: number | null
  notes?: string | null
}

export interface DBArchivedMachine extends DBBaseEntity {
  machineId: number
  dateArchived: string
}