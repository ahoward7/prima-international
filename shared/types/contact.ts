export interface Contact {
  c_id: string
  company?: string
  name?: string
  createDate: string
  lastModDate: string
}

export type ContactForm = Partial<Contact>
