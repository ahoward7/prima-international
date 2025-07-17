<template>
  <div class="flex justify-center px-4 py-12">
    <div class="flex flex-col gap-16 w-full max-w-[1200px]">
      <div class="text-prima-red text-5xl font-prima font-extrabold text-center">
        Manage Machines
      </div>
      <div class="flex justify-center w-full">
        <FormLocatedMachine v-if="activeTab === 'located'" v-model="locatedMachine" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const activeTab = ref<MachineCategory>('located')

const locatedMachine = ref({
  serialNumber: undefined,
  contact: undefined,
  location: "",
  type: "",
  model: "",
  year: undefined,
  hours: undefined,
  price: undefined,
  salesman: "",
  description: "",
  dateCreated: "",
  dateLastModified: "",
  notes: "",
})
</script>
