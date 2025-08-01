import { defineStore } from 'pinia'

const contact: ContactForm = {
  company: undefined,
  name: undefined
}

const emptyMachine: MachineForm = {
  serialNumber: undefined,
  contact,
  location: "",
  type: "",
  model: "",
  year: undefined,
  hours: undefined,
  price: undefined,
  salesman: "",
  description: "",
  createDate: undefined,
  lastModDate: undefined,
  notes: ""
}

const defaultFilters: MachineFilters = {
  location: 'located',
  search: '',
  pageSize: 20,
  page: 1,
  sortBy: 'type',
  model: '',
  type: ''
}

const emptySoldMachine: SoldMachineForm = {
  machine: emptyMachine,
  buyer: '',
  buyerLocation: "",
  truckingCompany: "",
  totalCost: undefined,
  machineCost: undefined,
  freightCost: undefined,
  paintCost: undefined,
  profit: undefined,
  purchaseFob: "",
  notes: ""
}

export const useMachineStore = defineStore('machine', () => {
  const action = ref('add')

  const machine: Ref<MachineForm> = ref({...emptyMachine})

  const soldMachine: Ref<SoldMachineForm> = ref({...emptySoldMachine})

  const filters = ref<MachineFilters>({...defaultFilters})

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

  function resetFilters() {
    filters.value = {...defaultFilters}
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
    setFilters,
    resetFilters
  }
})
