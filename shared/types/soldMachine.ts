import type { DBMachine, Machine, MachineToPut } from './machine'

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

export interface SoldMachineToPut extends Omit<SoldMachine, 'machine'> {
  machine: Omit<MachineToPut, 'm_id'>
}

export interface SoldMachineForm extends Partial<Omit<DBSoldMachine, 'machine'>> {}
