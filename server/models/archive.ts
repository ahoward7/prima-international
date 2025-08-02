import { defineMongooseModel } from '#nuxt/mongoose'

export const ArchiveSchema = defineMongooseModel<ArchivedMachine>({
  name: 'Archive',
  schema: {
    a_id: { type: String, required: true },
    machine: {
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
      notes: { type: String, required: false  }
    },
    archiveDate: { type: String, required: true }
  },
  options: {
    // @ts-expect-error Indexes is correct here
    indexes: [
      { 'machine.serialNumber': 1 },
      { 'machine.model': 1 },
      { 'machine.type': 1 },
      { 'machine.location': 1 },
      { 
        'machine.type': 1, 
        'machine.model': 1 
      },
      { 
        'machine.location': 1, 
        'machine.type': 1 
      },
      { 'a_id': 1 },
      { 'archiveDate': 1 },
      { 
        'archiveDate': 1, 
        'machine.type': 1 
      }
    ]
  }
})