import { defineMongooseModel } from '#nuxt/mongoose'

export const MachineSchema = defineMongooseModel<DBMachine>({
  name: 'Machine',
  schema: {
    m_id: { type: String, required: true },
    contactId: { type: String, ref: 'Contact', required: false },
    serialNumber: { type: String, required: false },
    model: { type: String, required: false },
    type: { type: String, required: false },
    year: { type: Number, required: false },
    hours: { type: Number, required: false },
    description: { type: String, required: false },
    salesman: { type: String, required: false },
    createDate: { type: String, required: true },
    lastModDate: { type: String, required: true },
    price: { type: Number, required: false },
    location: { type: String, required: false },
    notes: { type: String, required: false }
  },
  options: {
    autoIndex: false
  }
})

MachineSchema.collection.dropIndexes()

MachineSchema.collection.createIndex({
  serialNumber: 'text',
  model: 'text',
  type: 'text',
  description: 'text',
  notes: 'text'
}, {
  name: 'machine_full_text_search',
  weights: {
    serialNumber: 1,
    model: 1,
    type: 1,
    description: 1,
    notes: 1
  }
})