<template>
  <div class="flex justify-center px-4 py-12">
    <div class="flex flex-col gap-16 w-full max-w-[1200px]">
      <div class="text-prima-red text-5xl font-prima font-extrabold text-center">
        Manage Machines
      </div>
      <FilterTabs v-model="activeTab" :categories="categories" />
      <div class="flex justify-center w-full">
        <FormLocatedMachine v-if="activeTab === 'located'" v-model="machine" />
        <FormSoldMachine v-if="activeTab === 'sold'" v-model="soldMachine" />
        <FormArchive v-if="activeTab === 'archive'" v-model="machine" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const activeTab = ref<string>('located')

const categories: Ref<string[]> = ref(['located', 'sold', 'archive'])

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
  machine: machine.value,
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
</script>
