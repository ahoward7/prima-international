<template>
  <div v-if="machine" class="grid grid-cols-4 gap-8 w-full">
    <InputText v-model="machine.serialNumber" label="Serial Number" placeholder="Number" class="col-span-1" />
    <InputSelect v-model="machine.model" label="Model" :options="filterOptions.model" class="col-span-1" width="w-full" createable />
    <InputSelect v-model="machine.type" label="Type" :options="filterOptions.type" class="col-span-1" width="w-full" createable />
    <InputNumber v-model="machine.price" label="Price" placeholder="Price" class="col-span-1" />
    <InputNumber v-model="machine.year" label="Year" placeholder="2000" class="col-span-1" />
    <InputNumber v-model="machine.hours" label="Hours" placeholder="1000" class="col-span-1" />
    <InputText v-model="machine.location" label="Location" placeholder="City, State, Country" class="col-span-1" />
    <InputSelect v-model="machine.salesman" label="Salesman" :options="filterOptions.salesman" class="col-span-1" width="w-full" createable />
    <InputTextarea v-model="machine.description" label="Description" placeholder="Description of machine..." class="col-span-4" />
    <InputReadonly v-if="action !== 'add'" :model-value="isoToMMDDYYYY(machine.createDate)" label="Date Added" placeholder="mm/dd/yyyy" class="col-span-1" />
    <InputReadonly v-if="action !== 'add'" :model-value="isoToMMDDYYYY(machine.lastModDate)" label="Last Modified Date" placeholder="mm/dd/yyyy" class="col-span-1" />
    <InputTextarea v-model="machine.notes" label="Notes" placeholder="Other information..." class="col-span-4" />
  </div>
</template>

<script setup lang="ts">
const { filterOptions } = storeToRefs(useMachineStore())

const machine = defineModel<MachineForm>()
const { action } = storeToRefs(useMachineStore())

function isoToMMDDYYYY(isoString: string = ''): string {
  const date = new Date(isoString)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}
</script>
