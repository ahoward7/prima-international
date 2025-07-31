<template>
  <div class="flex justify-center py-12 px-8">
    <div class="w-[920px] flex flex-col items-center gap-8">
      <HeaderPrimary>Machine Detail</HeaderPrimary>
      <div v-if="machine" class="grid grid-cols-6 gap-8">
        <InputText v-model="machine.type" label="Type" :options="filterOptions.type" class="col-span-1" width="w-full" createable />
        <InputText v-model="machine.model" label="Model" :options="filterOptions.model" class="col-span-1" width="w-full" createable />
        <InputText v-model="machine.serialNumber" label="Serial Number" placeholder="Number" class="col-span-2" />
        <InputNumber v-model="machine.year" label="Year" placeholder="2000" class="col-span-1" />
        <InputNumber v-model="machine.hours" label="Hours" placeholder="1000" class="col-span-1" />
        <InputTextarea v-model="machine.description" label="Description" placeholder="Description of machine..." class="col-span-6" />
        <InputNumber v-model="machine.price" label="Price" placeholder="Price" class="col-span-1" />
        <InputText v-model="machine.location" label="Location" placeholder="City, State, Country" class="col-span-4" />
        <InputText v-model="machine.salesman" label="Salesman" :options="filterOptions.salesman" class="col-span-1" width="w-full" createable />
        <InputTextarea v-model="machine.notes" label="Notes" placeholder="Other information..." class="col-span-6" />
      </div>
      <div class="w-full flex items-center gap-2 bg-prima-red/20 px-4 py-3">
        <label class="font-semibold">Table Locations:</label>
        <div v-for="ids, key in machineLocations" :key="key">
          <span>{{ `${titleCase(key)} ` }}</span>
          <span class="font-roboto-i">{{ `(${ids.length })${key !== 'sold' ? ',' : ''}` }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMachineStore } from '~~/stores/machine'

const { filterOptions } = storeToRefs(useMachineStore())
const { id, location } = useRoute().query

const { data: machine } = await useFetch < Machine > (`/machine/${id}`, {
  query: { location }
})

const { data: machineLocations } = await useFetch('/machine/locations', {
  query: {
    serialNumber: machine.value?.serialNumber
  }
})
</script>
