import { defineMongooseModel } from '#nuxt/mongoose'

export const MachineSchema = defineMongooseModel<DBMachine>({
  name: 'Machine',
  schema: {
    m_id: { type: String, required: true },
    contactId: { type: String, ref: 'Contact', required: true },
    serialNumber: { type: String, required: false },
    model: { type: String, required: true },
    type: { type: String, required: true },
    year: { type: Number, required: false },
    hours: { type: Number, required: false },
    description: { type: String, required: false },
    salesman: { type: String, required: true },
    createDate: { type: String, required: true },
    lastModDate: { type: String, required: true },
    price: { type: Number, required: false },
    location: { type: String, required: false },
    notes: { type: String, required: false  }
  }
})