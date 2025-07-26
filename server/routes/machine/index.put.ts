import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event): Promise<any> => {
  const machine = await readBody(event)

  if (!machine || !machine.m_id || !machine.contact || !machine.contact.c_id) {
    return { error: 'Missing required machine or contact information' }
  }

  const contact: Contact = machine.contact
  const contactId = contact.c_id
  delete machine.contact

  const existingContact: Contact | null = await ContactSchema.findOne({ c_id: contactId }).lean()

  let contactChanged = false
  if (existingContact) {
    for (const key in contact) {
      const contactKey = key as keyof Contact
      if (key !== 'lastModDate' && contact[contactKey] !== existingContact[contactKey]) {
        contactChanged = true
        break
      }
    }
  }
  else {
    contactChanged = true
  }

  if (contactChanged) {
    contact.lastModDate = new Date().toISOString()
    await ContactSchema.updateOne({ c_id: contactId }, { $set: contact }, { upsert: true })
  }

  machine.lastModDate = new Date().toISOString()

  const result = await MachineSchema.updateOne({ m_id: machine.m_id }, { $set: machine })

  return { success: true, contactUpdated: contactChanged, machineUpdated: result.modifiedCount > 0 }
})
