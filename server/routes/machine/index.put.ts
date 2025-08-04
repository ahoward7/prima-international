import type { H3Event } from 'h3'
import type { ArchivedMachineToPut } from '~~/shared/types/main'

export default defineEventHandler(async (event: H3Event): Promise<any> => {
  const machine: Machine | ArchivedMachine = await readBody(event)
  const date = new Date().toISOString()
  const { location } = getQuery(event)

  if (location === 'located') {
    return updateLocatedMachine(machine as Machine, date)
  }
  else if (location === 'archived') {
    return updateArchivedMachine(machine as ArchivedMachine, date)
  }
})

async function updateLocatedMachine(machine: MachineForm, date: string) {
  const locatedMachine = machine

  if (!locatedMachine || !locatedMachine.m_id || !locatedMachine.contact || !locatedMachine.contact.c_id) {
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
