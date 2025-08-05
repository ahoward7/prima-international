<template>
  <div class="flex justify-center py-12 px-8">
    <div class="w-[920px] flex flex-col items-center gap-8">
      <!-- Header -->
      <div class="w-full">
        <NuxtLink to="/" class="flex items-center text-prima-red">
          <Icon name="carbon:chevron-left" size="28" />
          <span class="text-xl">Inventory</span>
        </NuxtLink>
        <HeaderPrimary>Machine Detail</HeaderPrimary>
      </div>
      <!-- Contact -->
      <div class="flex flex-col gap-4 w-full">
        <div class="grid grid-cols-2 gap-8">
          <InputContactSearch class="w-full col-span-2" @select="fillContact" @clear="clearContact" />
          <InputText v-model="machine.contact.name" label="Contact Name" placeholder="First Last" @input="setContactNew" />
          <InputText v-model="machine.contact.company" label="Company Name" placeholder="Company Inc." @input="setContactNew" />
        </div>
      </div>
      <DividerLine class="w-full" />
      <!-- Machine -->
      <div v-if="machine" class="grid grid-cols-6 gap-8">
        <InputTextSelect v-model="machine.type" label="Type" placeholder="Type" :options="filterOptions.type" class="col-span-1" width="w-full" createable />
        <InputTextSelect v-model="machine.model" label="Model" placeholder="Model" :options="filterOptions.model" class="col-span-1" width="w-full" createable />
        <InputText v-model="machine.serialNumber" label="Serial Number" placeholder="Number" class="col-span-2" :message="serialNumberMessage" @input="fetchLocations" />
        <InputNumber v-model="machine.year" label="Year" placeholder="2000" class="col-span-1" />
        <InputNumber v-model="machine.hours" commas label="Hours" placeholder="1000" class="col-span-1" />
        <InputTextarea v-model="machine.description" label="Description" placeholder="Description of machine..." class="col-span-6" />
        <InputNumber v-model="machine.price" commas price label="Price" placeholder="Price" class="col-span-1" />
        <InputText v-model="machine.location" label="Location" placeholder="City, State, Country" class="col-span-4" />
        <InputTextSelect v-model="machine.salesman" label="Salesman" placeholder="Initials" :options="filterOptions.salesman" class="col-span-1" width="w-full" createable />
        <InputTextarea v-model="machine.notes" label="Notes" placeholder="Other information..." class="col-span-6" />
      </div>
      <!-- Machine Actions -->
      <template v-if="id && sellingMachine">
        <DividerLine class="w-full" />
        <div class="grid grid-cols-6 gap-8">
          <InputNumber v-model="soldMachine.totalCost" label="Total Cost" placeholder="Total sale cost" class="col-span-2" commas price />
          <InputNumber v-model="soldMachine.machineCost" label="Machine Cost" placeholder="Machine" class="col-span-1" commas price />
          <InputNumber v-model="soldMachine.freightCost" label="Freight Cost" placeholder="Freight" class="col-span-1" commas price />
          <InputNumber v-model="soldMachine.paintCost" label="Paint Cost" placeholder="Paint" class="col-span-1" commas price />
          <InputNumber v-model="soldMachine.profit" label="Profit From Sale" placeholder="Profit" class="col-span-1" commas price />
          <InputText v-model="soldMachine.buyerLocation" label="Buyer Location" placeholder="City, Country" class="col-span-2" />
          <InputText v-model="soldMachine.truckingCompany" label="Trucking Company" placeholder="Company Name" class="col-span-2" />
          <InputText v-model="soldMachine.purchaseFob" label="Purchase FOB" placeholder="City, Country" class="col-span-2" />
          <InputTextarea v-model="soldMachine.notes" label="Notes On Sale" placeholder="Other information..." class="col-span-6" />
        </div>
      </template>
      <template v-if="id && !sellingMachine">
        <DividerLine class="w-full" />
        <div class="w-full flex items-center gap-2 bg-prima-yellow/20 px-4 py-3">
          <label class="font-semibold">Table Locations:</label>
          <div v-for="ids, key in machineLocations" :key="key">
            <span>{{ `${titleCase(key)} ` }}</span>
            <span class="font-roboto-i">{{ `(${ids.length })${key !== 'sold' ? ',' : ''}` }}</span>
          </div>
        </div>
        <div class="w-full flex justify-between">
          <div class="flex flex-col gap-1">
            <div>
              <label class="font-semibold text-prima-red">Date Created: </label>
              <span>{{ isoToMMDDYYYY(machine?.createDate) }}</span>
            </div>
            <div>
              <label class="font-semibold text-prima-red">Date Last Modified: </label>
              <span>{{ isoToMMDDYYYY(machine?.lastModDate) }}</span>
            </div>
            <div v-if="archivedMachine?.archiveDate">
              <label class="font-semibold text-prima-red">Date Archived: </label>
              <span>{{ isoToMMDDYYYY(archivedMachine?.archiveDate) }}</span>
            </div>
          </div>
          <div class="flex gap-4">
            <ConfirmationButton class="!bg-prima-yellow" @confirm="updateMachine">
              Update
            </ConfirmationButton>
            <Button class="!bg-green-600" @click="sellingMachine = true">
              Sell
            </Button>
            <ConfirmationButton v-if="location !== 'archived'" class="!bg-blue-600" @confirm="archiveMachine">
              Archive
            </ConfirmationButton>
            <ConfirmationButton class="!bg-red-600" @confirm="deleteMachine">
              Delete
            </ConfirmationButton>
          </div>
        </div>
      </template>
      <div v-if="id && sellingMachine" class="w-full flex justify-end gap-4">
        <ConfirmationButton class="!bg-red-600" @confirm="sellingMachine = false">
          Cancel
        </ConfirmationButton>
        <ConfirmationButton class="!bg-green-600" @confirm="sellMachine">
          Sell Machine
        </ConfirmationButton>
      </div>
      <div v-else-if="!id" class="w-full flex justify-end">
        <ConfirmationButton class="!bg-green-600" @confirm="createMachine">
          Create Machine
        </ConfirmationButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { useMachineStore } from '~~/stores/machine'

const { filterOptions, machine, archivedMachine, soldMachine } = storeToRefs(useMachineStore())
const machineStore = useMachineStore()
const { id, location } = useRoute().query
const machineLocations: Ref<MachineLocations> = ref({} as MachineLocations)
const serialNumberMessage = ref('')
const sellingMachine = ref(false)

if (location && !['located', 'archived', 'sold'].includes(location as string)) {
  navigateTo('/')
}

if (id) {
  const { data: dataMachine } = await useFetch<Machine>(`/machine/${id}`, {
    query: { location }
  })
  
  if (dataMachine.value) {
    if (location === 'located') {
      machineStore.setMachine(dataMachine.value)
    }
    else if (location === 'archived') {
      machineStore.setMachine(dataMachine.value, location)
    }
  }

  const { data: dataMachineLocatons } = await useFetch<MachineLocations>('/machine/locations', {
    query: {
      serialNumber: machine.value?.serialNumber
    }
  })

  if (dataMachineLocatons.value) {
    machineLocations.value = dataMachineLocatons.value
  }
}
else {
  machineStore.resetMachine()
}

async function createMachine() {
  const response = await $fetch('/machine', {
    method: 'POST',
    body: machine.value
  })

  if (response.success) {
    navigateTo('/')
  }
}

async function updateMachine() {
  let machineToUpdate

  if (location === 'located') {
    machineToUpdate = machine.value as Machine
  }
  else if (location === 'archived') {
    const aMachine = machine.value as Omit<Machine, 'm_id'>

    machineToUpdate = {
      a_id: id || undefined,
      archiveDate: archivedMachine.value.archiveDate,
      machine: aMachine
    } as ArchivedMachine
  }

  const response = await $fetch('/machine', {
    method: 'PUT',
    body: machineToUpdate,
    query: { location }
  })

  if (response?.success) {
    navigateTo('/')
  }
  else if (response?.error) {
    console.error(response.error)
  }
}

async function sellMachine() {

}

async function archiveMachine() {
  const response = await $fetch('/machine/archive', {
    method: 'POST',
    body: machine.value
  })

  if (response.success) {
    navigateTo(`/`)
  }
}

async function deleteMachine() {
  const response = await $fetch('/machine', {
    method: 'DELETE',
    query: { id, location }
  })

  if (response.success) {
    navigateTo('/')
  }
}

function fillContact(c: Contact) {
  machine.value.contact = c
}

function clearContact() {
  machine.value.contact = {}
}

function setContactNew() {
  machine.value.contact.c_id = 'new'
}

const fetchLocations = useDebounceFn(async () => {
  if (machine.value.serialNumber) {
    const dataMachineLocations = await $fetch<MachineLocations>('/machine/locations', {
      query: {
        serialNumber: machine.value?.serialNumber
      }
    })
  
    if (dataMachineLocations) {
      machineLocations.value = dataMachineLocations
    }

    const locationToSearch = !id ? 'located' : location
    const locationLength = dataMachineLocations[locationToSearch as MachineLocationString]?.length || 0
  
    if (!id && locationLength > 0) {
      serialNumberMessage.value = 'This number already exists'
    }
    else {
      serialNumberMessage.value = ''
    }
  }
  else {
    serialNumberMessage.value = ''
  }
}, 200)
</script>
