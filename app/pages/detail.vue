<template>
  <div class="flex justify-center py-12 px-8">
    <div class="w-[920px] flex flex-col items-center gap-8">
      <HeaderPrimary>Machine Detail</HeaderPrimary>
      <div class="flex flex-col gap-4 w-full">
        <div class="grid grid-cols-2 gap-8">
          <InputContactSearch class="w-full col-span-2" @select="fillContact" @clear="clearContact" />
          <InputText v-model="machine.contact.name" label="Contact Name" placeholder="First Last" />
          <InputText v-model="machine.contact.company" label="Company Name" placeholder="Company Inc." />
        </div>
      </div>
      <DividerLine class="w-full" />
      <div v-if="machine" class="grid grid-cols-6 gap-8">
        <InputText v-model="machine.type" label="Type" placeholder="Type" :options="filterOptions.type" class="col-span-1" width="w-full" createable />
        <InputText v-model="machine.model" label="Model" placeholder="Model" :options="filterOptions.model" class="col-span-1" width="w-full" createable />
        <InputText v-model="machine.serialNumber" label="Serial Number" placeholder="Number" class="col-span-2" />
        <InputNumber v-model="machine.year" label="Year" placeholder="2000" class="col-span-1" />
        <InputNumber v-model="machine.hours" label="Hours" placeholder="1000" class="col-span-1" />
        <InputTextarea v-model="machine.description" label="Description" placeholder="Description of machine..." class="col-span-6" />
        <InputMoney v-model="machine.price" label="Price" placeholder="Price" class="col-span-1" />
        <InputText v-model="machine.location" label="Location" placeholder="City, State, Country" class="col-span-4" />
        <InputText v-model="machine.salesman" label="Salesman" placeholder="Initials" :options="filterOptions.salesman" class="col-span-1" width="w-full" createable />
        <InputTextarea v-model="machine.notes" label="Notes" placeholder="Other information..." class="col-span-6" />
      </div>
      <template v-if="id">
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
          </div>
          <div class="flex gap-4">
            <Button class="!bg-prima-yellow" @click="updateMachine">
              Update
            </Button>
            <Button class="!bg-green-600">
              Sell
            </Button>
            <Button class="!bg-blue-600" @click="archiveMachine">
              Archive
            </Button>
            <Button class="!bg-red-600" @click="deleteMachine">
              Delete
            </Button>
          </div>
        </div>
      </template>
      <div v-else class="w-full flex justify-end">
        <Button class="!bg-green-600" @click="createMachine">
          Create Machine
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMachineStore } from '~~/stores/machine'

const { filterOptions, machine } = storeToRefs(useMachineStore())
const machineStore = useMachineStore()
const { id, location } = useRoute().query
const machineLocations: Ref<StringObject> = ref({})

if (id) {
  const { data: dataMachine } = await useFetch<Machine>(`/machine/${id}`, {
    query: { location }
  })
  
  if (dataMachine.value) {
    machineStore.setMachine(dataMachine.value)
  }

  const { data: dataMachineLocatons } = await useFetch<StringObject>('/machine/locations', {
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
  const response = await $fetch('/machine', {
    method: 'PUT',
    body: machine.value
  })

  if (response.success) {
    navigateTo('/')
  }
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
    query: { id: machine.value.m_id }
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
</script>
