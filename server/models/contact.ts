import { defineMongooseModel } from '#nuxt/mongoose'

export const ContactSchema = defineMongooseModel<Contact>({
  name: 'Contact',
  schema: {
    c_id: { type: String, required: true},
    company: { type: String, required: false },
    name: { type: String, required: false },
    createDate: { type: String, required: true },
    lastModDate: { type: String, required: true },
  },
})