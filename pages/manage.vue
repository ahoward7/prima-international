<template>
  <div class="flex justify-center px-4 py-12">
    <div class="flex flex-col gap-8 w-full max-w-[1200px]">
      <HeaderPrimary> Add Machine</HeaderPrimary>
      <div>
        <HeaderSecondary class="mb-4">Machine Lookup</HeaderSecondary>
        <InputMachineSearch @select="fillInMachine" />
      </div>
      <div>
        <HeaderSecondary class="mb-4">Machine Type</HeaderSecondary>
        <FilterTabs v-model="activeTab" :categories="categories" />
      </div>
      <div class="flex justify-center w-full">
        <FormLocatedMachine v-if="['located', 'archived'].includes(activeTab)" v-model="machine" />
        <FormSoldMachine v-if="activeTab === 'sold'" v-model="soldMachine" />
      </div>
      <DividerLine />
      <div class="flex justify-end">
        <button class="text-lg text-white font-semibold bg-prima-red px-3 py-2 cursor-pointer">Add {{ `${activeTab.substring(0, 1).toUpperCase()}${activeTab.substring(1)}` }} Machine</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const machineSearch: Ref<string> = ref("")
const activeTab = ref<string>('located')

const categories: Ref<string[]> = ref(['located', 'sold', 'archived'])

const contact: ContactForm = {
  company: undefined,
  name: undefined
}

const machine: Ref<MachineForm> = ref({
  serialNumber: undefined,
  contact: contact,
  location: undefined,
  type: undefined,
  model: undefined,
  year: undefined,
  hours: undefined,
  price: undefined,
  salesman: undefined,
  description: undefined,
  dateCreated: undefined,
  dateLastModified: undefined,
  notes: undefined,
})

const soldMachine: Ref<SoldMachineForm> = ref({
  machine,
  buyer: contact,
  buyerLocation: undefined,
  truckingCompany: undefined,
  totalCost: undefined,
  machineCost: undefined,
  freightCost: undefined,
  paintCost: undefined,
  profitFromSale: undefined,
  purchaseFob: undefined,
  saleFobPoint: undefined,
  notes: undefined
})

function fillInMachine(selectedMachine: Machine) {
  machine.value = selectedMachine
}
</script>
