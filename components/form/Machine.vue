<template>
  <div v-if="machine" class="grid grid-cols-4 gap-8 w-full">
    <InputText v-model="machine.serialNumber" label="Serial Number" placeholder="Number" class="col-span-2" />
    <InputSelect v-model="machine.model" label="Model" :options="filterOptions.model" class="col-span-1" width="w-full" createable />
    <InputSelect v-model="machine.type" label="Type" :options="filterOptions.type" class="col-span-1" width="w-full" createable />
    <InputNumber v-model="machine.price" label="Price" placeholder="Price" class="col-span-1 col-start-1" />
    <InputNumber v-model="machine.year" label="Year" placeholder="2000" class="col-span-1" />
    <InputNumber v-model="machine.hours" label="Hours" placeholder="1000" class="col-span-1" />
    <InputSelect v-model="machine.salesman" label="Salesman" :options="filterOptions.salesman" class="col-span-1" width="w-full" createable />
    <InputTextarea v-model="machine.description" label="Description" placeholder="Description of machine..." class="col-span-4" />
    <InputReadonly v-if="action !== 'add'" :model-value="convertIsoToDdMonYy(machine.createDate)" label="Date Added" placeholder="dd/mm/yyyy" class="col-span-1" />
    <InputReadonly v-if="action !== 'add'" :model-value="convertIsoToDdMonYy(machine.lastModDate)" label="Last Modified Date" placeholder="dd/mm/yyyy" class="col-span-1" />
    <InputTextarea v-model="machine.notes" label="Notes" placeholder="Other information..." class="col-span-4" />
  </div>
</template>

<script setup lang="ts">
const { filterOptions } = storeToRefs(useMachineStore())

const machine = defineModel<MachineForm>()
const { action } = storeToRefs(useMachineStore())

function convertIsoToDdMonYy(isoString: string = '') {
  const date = new Date(isoString)

  if (!date) return 'Invalid date'

  const day = String(date.getDate()).padStart(2, '0')
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const month = monthNames[date.getMonth()]
  const year = String(date.getFullYear()).slice(-2) // last two digits

  return `${day}-${month}-${year}`
}
</script>
