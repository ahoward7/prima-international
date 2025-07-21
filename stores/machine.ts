import { defineStore } from 'pinia'

const contact: ContactForm = {
  company: undefined,
  name: undefined
}

export const useMachineStore = defineStore('machine', () => {
  const machine: Ref<MachineForm> = ref({
    serialNumber: undefined,
    contact: contact,
    location: undefined,
    type: undefined,
    model: undefined,
    year: undefined,
    hours: undefined,
    price: undefined,
    salesman: undefined,
    description: undefined,
    dateCreated: undefined,
    dateLastModified: undefined,
    notes: undefined,
  })

  const soldMachine: Ref<SoldMachineForm> = ref({
    machine,
    buyer: contact,
    buyerLocation: undefined,
    truckingCompany: undefined,
    totalCost: undefined,
    machineCost: undefined,
    freightCost: undefined,
    paintCost: undefined,
    profitFromSale: undefined,
    purchaseFob: undefined,
    saleFobPoint: undefined,
    notes: undefined
  })

  function setMachine(m: Machine) {
    machine.value = m
  }

  return {
    machine,
    soldMachine,
    setMachine
  }
})
