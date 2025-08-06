import { defineStore } from 'pinia'

const contact: ContactForm = {
  company: undefined,
  name: undefined
}

const emptyMachine: MachineForm = {
  serialNumber: undefined,
  contact: {...contact},
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
  type: '',
  contactId: ''
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
  const refreshMachines = ref(0)
  
  function setMachine(m: MachineForm | ArchivedMachineForm | SoldMachineForm, location: string = 'located') {
    if (location === 'archived') {
      const archive = m as ArchivedMachine
      archivedMachine.value.archiveDate = archive.archiveDate
      machine.value = archive.machine
    }
    else if (location === 'sold') {
      const sold = m as SoldMachine
      soldMachine.value.buyer = sold.buyer
      soldMachine.value.buyerLocation = sold.buyerLocation
      soldMachine.value.truckingCompany = sold.truckingCompany
      soldMachine.value.totalCost = sold.totalCost
      soldMachine.value.machineCost = sold.machineCost
      soldMachine.value.freightCost = sold.freightCost
      soldMachine.value.paintCost = sold.paintCost
      soldMachine.value.profit = sold.profit
      soldMachine.value.purchaseFob = sold.purchaseFob
      soldMachine.value.notes = sold.notes
      soldMachine.value.dateSold = sold.dateSold
      machine.value = sold.machine
    }
    else {
      machine.value = m as MachineForm
    }
  }

  function resetMachine() {
    machine.value = {...emptyMachine}
    soldMachine.value = {...emptySoldMachine}
    archivedMachine.value = {...emptyArchivedMachine}
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
    refreshMachines,
    setMachine,
    resetMachine,
    setFilterOptions,
    setFilters,
    resetFilters
  }
})
