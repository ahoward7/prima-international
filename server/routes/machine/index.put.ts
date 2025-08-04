import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event): Promise<any> => {
  const machine = await readBody(event)
  const date = new Date().toISOString()

  if (!machine || !machine.m_id || !machine.contact || !machine.contact.c_id) {
    return { error: 'Missing required machine or contact information' }
  }

  let contact: Contact
  let contactChanged = false
  let contactId: string

  if (machine.contact.c_id === 'new') {
    contact = generateContact(machine.contact.name, machine.contact.company, date)
    contactId = contact.c_id
    await ContactSchema.create(contact)
    contactChanged = true
  }
  else {
    contact = machine.contact
    contactId = contact.c_id

    const existingContact: Contact | null = await ContactSchema.findOne({ c_id: contactId }).lean()

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
      contact.lastModDate = date
      await ContactSchema.updateOne({ c_id: contactId }, { $set: contact }, { upsert: true })
    }
  }

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
