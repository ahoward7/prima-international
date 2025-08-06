import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event): Promise<any> => {
  const machine = await readBody(event)
  const date = new Date().toISOString()

  if (!machine || !machine.contact) {
    return { error: 'Missing required machine or contact information' }
  }

  try {
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
  
    delete machine.m_id
  
    const archive: ArchivedMachine = {
      a_id: generateRandom10DigitNumber(),
      machine,
      archiveDate: date
    }
  
    const result = await ArchiveSchema.create(archive)
  
    return {
      success: true,
      contactUpdated: contactChanged,
      machineCreated: true,
      machine: result.toObject?.() ?? result
    }
  }
  catch (error: any) {
    return sendError(event, createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Server: Error archiving machine',
      data: error.data || error.message || 'Server: Unexpected error'
    }))
  }
})
