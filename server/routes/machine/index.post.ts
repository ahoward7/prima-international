import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event): Promise<any> => {
  const machine = await readBody(event)
  const date = new Date().toISOString()

  if (!machine || !machine.contact) {
    return { error: 'Missing required machine or contact information' }
  }

  const { contactId, contactChanged } = await handleContactUpdateOrCreate(machine.contact, date)

  machine.m_id = generateRandom10DigitNumber()
  machine.contactId = contactId
  machine.createDate = date
  machine.lastModDate = date
  delete machine.contact

  const result = await MachineSchema.create(machine)

  return {
    success: true,
    contactUpdated: contactChanged,
    machineCreated: true,
    machine: result.toObject?.() ?? result
  }
})
