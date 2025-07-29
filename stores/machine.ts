import { defineStore } from 'pinia'

const contact: ContactForm = {
  company: undefined,
  name: undefined
}

const emptyMachine: MachineForm = {
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
}

const emptySoldMachine: SoldMachineForm = {
    machine: emptyMachine,
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
  }

export const useMachineStore = defineStore('machine', () => {
  const action = ref('add')

  const machine: Ref<MachineForm> = ref({...emptyMachine})

  const soldMachine: Ref<SoldMachineForm> = ref({...emptySoldMachine})

  const filters = ref<MachineFilters>({
    location: 'located',
    search: '',
    pageSize: 20,
    page: 1,
    sortBy: 'model',
    model: '',
    type: '',
  })

  const filterOptions: Ref<FilterOptions> = ref({})

  function setMachine(m: MachineForm) {
    machine.value = m
  }

  function resetMachine() {
    machine.value = {...emptyMachine}
  }

  function setAction(a: string) {
    action.value = a
  }

  function setFilterOptions(f: FilterOptions) {
    filterOptions.value = f
  }

  function setFilters(f: MachineFilters) {
    filters.value = f
  }

  return {
    action,
    machine,
    soldMachine,
    filterOptions,
    filters,
    setMachine,
    resetMachine,
    setAction,
    setFilterOptions,
    setFilters
  }
})
