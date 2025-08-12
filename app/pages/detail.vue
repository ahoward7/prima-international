<template>
  <div class="flex justify-center py-12 px-8">
    <div class="w-[920px] flex flex-col items-center gap-8">
      <div class="w-full">
        <NuxtLink to="/" class="flex items-center text-prima-red">
          <Icon name="carbon:chevron-left" size="28" />
          <span class="text-xl">Inventory</span>
        </NuxtLink>
        <HeaderPrimary>Machine Detail</HeaderPrimary>
      </div>
      
      <div class="flex flex-col gap-4 w-full">
        <div class="grid grid-cols-2 gap-8">
          <InputContactSearch class="w-full col-span-2" @select="fillContact" @clear="clearContact" />
          <InputText v-model="machine.contact.name" label="Contact Name" placeholder="First Last" @input="setContactNew" />
          <InputText v-model="machine.contact.company" label="Company Name" placeholder="Company Inc." @input="setContactNew" />
        </div>
      </div>
      
      <template v-if="machine">
        <DividerLine class="w-full" />
        <div class="grid grid-cols-6 gap-8">
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
      </template>
      
      <template v-if="(id && sellingMachine) || location === 'sold'">
        <DividerLine class="w-full" />
        <div class="grid grid-cols-6 gap-8">
          <InputNumber v-model="soldMachine.totalCost" label="Total Cost" placeholder="Total sale cost" class="col-span-1" commas price />
          <InputNumber v-model="soldMachine.machineCost" label="Machine Cost" placeholder="Machine" class="col-span-1" commas price />
          <InputNumber v-model="soldMachine.freightCost" label="Freight Cost" placeholder="Freight" class="col-span-1" commas price />
          <InputNumber v-model="soldMachine.paintCost" label="Paint Cost" placeholder="Paint" class="col-span-1" commas price />
          <InputNumber v-model="soldMachine.otherCost" label="Other Cost" placeholder="Other" class="col-span-1" commas price />
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
            <div v-if="soldMachine?.dateSold">
              <label class="font-semibold text-prima-red">Date Sold: </label>
              <span>{{ isoToMMDDYYYY(soldMachine?.dateSold) }}</span>
            </div>
          </div>
          <div class="flex gap-4">
            <ButtonConfirmation class="!bg-prima-yellow" @confirm="updateMachine(id as string)">
              Update
            </ButtonConfirmation>
            <Button v-if="location !== 'sold'" class="!bg-green-600" @click="sellingMachine = true">
              Sell
            </Button>
            <ButtonConfirmation v-if="location !== 'archived'" class="!bg-blue-600" @confirm="archiveMachine()">
              Archive
            </ButtonConfirmation>
            <ButtonConfirmation class="!bg-red-600" @confirm="deleteMachine(id as string)">
              Delete
            </ButtonConfirmation>
          </div>
        </div>
      </template>
      
      <div v-if="id && sellingMachine" class="w-full flex justify-end gap-4">
        <ButtonConfirmation class="!bg-red-600" @confirm="sellingMachine = false">
          Cancel
        </ButtonConfirmation>
        <ButtonConfirmation class="!bg-green-600" @confirm="sellMachine()">
          Sell Machine
        </ButtonConfirmation>
      </div>
      
      <div v-else-if="!id" class="w-full flex justify-end">
        <ButtonConfirmation class="!bg-green-600" @confirm="createMachine()">
          Create Machine
        </ButtonConfirmation>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { useMachineStore } from '~~/stores/machine'

const { filterOptions, machine, archivedMachine, soldMachine } = storeToRefs(useMachineStore())
const machineStore = useMachineStore()

const { id, location, selling } = useRoute().query
const machineLocations: Ref<MachineLocations> = ref({} as MachineLocations)
const serialNumberMessage = ref('')
const sellingMachine = ref(selling === '1')

machineStore.resetMachine()

if (location && !['located', 'archived', 'sold'].includes(location as string)) {
  navigateTo('/')
}

if (id) {
  const { data: dataMachineEnv } = await useFetch<{ data: Machine }>(`/api/machines/${id}`, {
    query: { location }
  })
  const dataMachine = computed(() => dataMachineEnv.value?.data)

  if (dataMachine.value) {
    machineStore.setMachine(dataMachine.value, location as MachineLocationString)
  }

  const { data: dataMachineLocatonsEnv } = await useFetch<{ data: MachineLocations }>(
    '/api/machines/locations',
    {
      query: {
        serialNumber: machine.value?.serialNumber
      }
    }
  )
  const dataMachineLocatons = computed(() => dataMachineLocatonsEnv.value?.data)

  if (dataMachineLocatons.value) {
    machineLocations.value = dataMachineLocatons.value
  }
}
else {
  machineStore.resetMachine()
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
    const dataMachineLocationsEnv = await $fetch<{ data: MachineLocations }>(
      '/api/machines/locations',
      {
        query: {
          serialNumber: machine.value?.serialNumber
        }
      }
    )

    if (dataMachineLocationsEnv?.data) {
      machineLocations.value = dataMachineLocationsEnv.data
    }

    const locationToSearch = !id ? 'located' : location
    const locationLength = dataMachineLocationsEnv?.data?.[locationToSearch as MachineLocationString]?.length || 0

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
