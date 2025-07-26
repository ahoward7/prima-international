import type { H3Event } from 'h3'

function generateRandom10DigitNumber(): string {
  const min = 1_000_000_000
  const max = 9_999_999_999
  return (Math.floor(Math.random() * (max - min + 1)) + min).toString()
}


export default defineEventHandler(async (event: H3Event): Promise<any> => {
  const machine = await readBody(event)
  const date = new Date().toISOString()

  if (!machine || !machine.contact ) {
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
    contact.lastModDate = date
    await ContactSchema.updateOne({ c_id: contactId }, { $set: contact }, { upsert: true })
  }

  machine.m_id = generateRandom10DigitNumber()
  machine.contactId = contactId
  machine.createDate = date
  machine.lastModDate = date

  const result = await MachineSchema.create(machine)

  return { success: true, contactUpdated: contactChanged, machineCreated: !!result }
})
