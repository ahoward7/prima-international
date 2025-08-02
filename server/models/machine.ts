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
    // @ts-expect-error Indexes is correct here
    indexes: [
      { 'm_id': 1 },
      { 'serialNumber': 1 },
      { 'model': 1 },
      { 'type': 1 },
      { 'location': 1 },
      { 
        'type': 1, 
        'model': 1 
      },
      { 
        'location': 1, 
        'type': 1 
      },
      { 
        'type': 1, 
        'year': 1 
      },
      { 'contactId': 1 },
      { 'createDate': 1 },
      { 'lastModDate': 1 },
      { 'year': 1 },
      { 'hours': 1 },
      { 'price': 1 },
      { 
        'type': 1, 
        'createDate': -1 
      }
    ]
  }
})