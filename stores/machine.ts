import { defineStore } from 'pinia'

const contact: ContactForm = {
  company: undefined,
  name: undefined
}

export const useMachineStore = defineStore('machine', () => {
  const action = ref('add')

  const machine: Ref<MachineForm> = ref({
    serialNumber: undefined,
    contact: contact,
    location: "",
    type: "",
    model: "",
    year: undefined,
    hours: undefined,
    price: undefined,
    salesman: "",
    description: "",
    dateCreated: undefined,
    dateLastModified: undefined,
    notes: "",
  })

  const soldMachine: Ref<SoldMachineForm> = ref({
    machine,
    buyer: contact,
    buyerLocation: "",
    truckingCompany: "",
    totalCost: undefined,
    machineCost: undefined,
    freightCost: undefined,
    paintCost: undefined,
    profitFromSale: undefined,
    purchaseFob: "",
    saleFobPoint: "",
    notes: ""
  })

  function setMachine(m: Machine) {
    machine.value = m
  }

  function setAction(a: string) {
    action.value = a
  }

  return {
    action,
    machine,
    soldMachine,
    setMachine,
    setAction
  }
})
