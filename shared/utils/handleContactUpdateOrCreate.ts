import type { Contact } from "../types/main"
import { ContactSchema } from "../../server/models/contact"
import { generateRandom10DigitNumber } from "./generateRandom10DigitNumber"

interface NewContact {
  c_id: string
  name: string
  company: string
}

interface ContactReturn {
  contactId: string
  contactChanged: boolean
  contact: Contact
}

export async function handleContactUpdateOrCreate( contactInput: Partial<Contact> & NewContact, date: string): Promise<ContactReturn> {
  let contact: Contact
  let contactChanged = false
  let contactId: string

  if (contactInput.c_id === 'new') {
    contact = {
      c_id: generateRandom10DigitNumber(),
      name: contactInput.name,
      company: contactInput.company,
      createDate: date,
      lastModDate: date
    }
    contactId = contact.c_id
    await ContactSchema.create(contact)
    contactChanged = true
  }
  else {
    contact = contactInput as Contact
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

  return { contactId, contactChanged, contact }
}
