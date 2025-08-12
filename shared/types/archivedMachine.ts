import type { Machine, MachineToPut } from './machine'

export interface ArchivedMachine {
  a_id: string
  archiveDate: string
  machine: Omit<Machine, 'm_id'>
}

export interface ArchivedMachineToPut extends Omit<ArchivedMachine, 'machine'> {
  machine: Omit<MachineToPut, 'm_id'>
}

export interface ArchivedMachineForm extends Partial<Omit<ArchivedMachine, 'machine'>> {}
