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

const emptyArchivedMachine: ArchivedMachineForm = {
  archiveDate: ""
}

export const useMachineStore = defineStore('machine', () => {
  const machine: Ref<MachineForm> = ref({...emptyMachine})
  const soldMachine: Ref<SoldMachineForm> = ref({...emptySoldMachine})
  const archivedMachine: Ref<ArchivedMachineForm> = ref({...emptyArchivedMachine})

  const filters = ref<MachineFilters>({...defaultFilters})
  const filterOptions: Ref<FilterOptions> = ref({})
  
  function setMachine(m: MachineForm | ArchivedMachineForm, location: string = 'located') {
    if (location === 'archived') {
      const archive = m as ArchivedMachine
      archivedMachine.value.archiveDate = archive.archiveDate
      machine.value = archive.machine
    }
    else {
      machine.value = m as MachineForm
    }
  }

  function resetMachine() {
    machine.value = {...emptyMachine}
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
    machine,
    soldMachine,
    archivedMachine,
    filterOptions,
    filters,
    setMachine,
    resetMachine,
    setFilterOptions,
    setFilters,
    resetFilters
  }
})
