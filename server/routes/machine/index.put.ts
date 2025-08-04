import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event): Promise<any> => {
  const machine = await readBody(event)
  const date = new Date().toISOString()

  if (!machine || !machine.m_id || !machine.contact || !machine.contact.c_id) {
    return { error: 'Missing required machine or contact information' }
  }

  const { contactId, contactChanged } = await handleContactUpdateOrCreate(machine.contact, date)

  machine.contactId = contactId
  machine.lastModDate = date
  delete machine.contact

  const updateResult = await MachineSchema.updateOne({ m_id: machine.m_id }, { $set: machine })

  const updatedMachine = await MachineSchema.findOne({ m_id: machine.m_id }).lean()

  return {
    success: true,
    contactUpdated: contactChanged,
    machineUpdated: updateResult.modifiedCount > 0,
    machine: updatedMachine
  }
})
