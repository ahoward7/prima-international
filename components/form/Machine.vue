<template>
  <div v-if="machine">
    <div class="grid grid-cols-4 gap-8 w-full">
      <InputText v-model="machine.serialNumber" label="Serial Number" placeholder="XXXXXXXXXXXX" class="col-span-4" />
      <InputText v-model="machine.type" label="Type" placeholder="XXX" class="col-span-1" />
      <InputText v-model="machine.model" label="Model" placeholder="XXXXXX" class="col-span-1" />
      <InputNumber v-model="machine.price" label="Price" placeholder="XXXXXX" class="col-span-1 col-start-1" />
      <InputNumber v-model="machine.year" label="Year" placeholder="XXXX" class="col-span-1" />
      <InputNumber v-model="machine.hours" label="Hours" placeholder="XXXX" class="col-span-1" />
      <InputText v-model="machine.salesman" label="Salesman" placeholder="Initials" class="col-span-1" />
      <InputTextarea v-model="machine.description" label="Description" placeholder="Description of machine..." class="col-span-4" />
      <InputText v-model="machine.dateCreated" label="Date Added" placeholder="dd/mm/yyyy" class="col-span-1" />
      <InputText v-model="machine.dateLastModified" label="Last Modified Date" placeholder="dd/mm/yyyy" class="col-span-1" />
    </div>
    <DividerLine class="col-span-4 my-8" />
  
    <InputTextarea v-model="machine.notes" label="Notes" placeholder="Other information..." class="col-span-4" />
  </div>
</template>

<script setup lang="ts">
const machine = defineModel<MachineForm>()
</script>
