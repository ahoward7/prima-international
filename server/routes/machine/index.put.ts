import type { H3Event } from 'h3'
import type { ArchivedMachineToPut } from '~~/shared/types/main'

export default defineEventHandler(async (event: H3Event): Promise<any> => {
  const machine: Machine | ArchivedMachine | SoldMachine = await readBody(event)
  const date = new Date().toISOString()
  const { location } = getQuery(event)

  try {
    if (location === 'located') {
      return updateLocatedMachine(machine as Machine, date)
    }
    else if (location === 'archived') {
      return updateArchivedMachine(machine as ArchivedMachine, date)
    }
    return updateSoldMachine(machine as SoldMachine, date)
  }
  catch(e) {
    console.error(e)
  }
})

async function updateLocatedMachine(machine: MachineForm, date: string) {
  const locatedMachine = machine

  if (!locatedMachine || !locatedMachine.m_id) {
    return { error: 'Missing required locatedMachine or contact information' }
  }
  
  const { contactId, contactChanged } = await handleContactUpdateOrCreate(locatedMachine.contact, date)
  
  locatedMachine.contactId = contactId
  locatedMachine.lastModDate = date

  const machineToPut = locatedMachine as MachineToPut
  delete machineToPut.contact
  
  const updateResult = await MachineSchema.updateOne({ m_id: machineToPut.m_id }, { $set: machineToPut })
  
  const updatedMachine = await MachineSchema.findOne({ m_id: machineToPut.m_id }).lean()
  
  return {
    success: true,
    contactUpdated: contactChanged,
    machineUpdated: updateResult.modifiedCount > 0,
    machine: updatedMachine
  }
}

async function updateArchivedMachine(machine: ArchivedMachine, date: string) {
  const archive = machine

  if (!archive.machine || !archive.machine.contact || !archive.machine.contact.c_id) {
    return { error: 'Missing required archive.machine or contact information' }
  }
  
  const { contactId, contactChanged } = await handleContactUpdateOrCreate(archive.machine.contact, date)
  
  archive.machine.contactId = contactId
  archive.machine.lastModDate = date

  const machineToPut = archive as ArchivedMachineToPut
  delete machineToPut.machine.contact
  
  const updateResult = await ArchiveSchema.updateOne({ a_id: machineToPut.a_id }, { $set: machineToPut })
  
  const updatedMachine = await ArchiveSchema.findOne({ a_id: machineToPut.a_id }).lean()
  
  return {
    success: true,
    contactUpdated: contactChanged,
    machineUpdated: updateResult.modifiedCount > 0,
    machine: updatedMachine
  }
}

async function updateSoldMachine(machine: SoldMachine, date: string) {
  const soldMachine = machine

  if (!soldMachine.machine || !soldMachine.machine.contact || !soldMachine.machine.contact.c_id) {
    return { error: 'Missing required archive.machine or contact information' }
  }
  
  const { contactId, contactChanged } = await handleContactUpdateOrCreate(soldMachine.machine.contact, date)
  
  soldMachine.machine.contactId = contactId
  soldMachine.machine.lastModDate = date

  const machineToPut = soldMachine as SoldMachineToPut
  delete machineToPut.machine.contact
  
  const updateResult = await SoldSchema.updateOne({ s_id: machineToPut.s_id }, { $set: machineToPut })
  
  const updatedMachine = await SoldSchema.findOne({ s_id: machineToPut.s_id }).lean()
  
  return {
    success: true,
    contactUpdated: contactChanged,
    machineUpdated: updateResult.modifiedCount > 0,
    machine: updatedMachine
  }
}
