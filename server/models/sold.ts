import { defineMongooseModel } from '#nuxt/mongoose'

export const SoldSchema = defineMongooseModel<SoldMachine>({
  name: 'Sold',
  schema: {
    s_id: { type: String, required: true },
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
      notes: { type: String, required: false }
    },
    dateSold: { type: String, required: false },
    truckingCompany: { type: String, required: false },
    buyer: { type: String, required: false },
    buyerLocation: { type: String, required: false },
    purchaseFob: { type: String, required: false },
    machineCost: { type: Number, required: false },
    freightCost: { type: Number, required: false },
    paintCost: { type: Number, required: false },
    otherCost: { type: Number, required: false },
    profit: { type: Number, required: false },
    totalCost: { type: Number, required: false },
    notes: { type: String, required: false }
  },
  options: {
    collection: 'sold',
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
      { 's_id': 1 }
    ]
  }
})