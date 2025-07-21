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
        <FilterTabs v-model="activeTab" :options="categories" />
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
const machineStore = useMachineStore()
const { machine, soldMachine } = storeToRefs(useMachineStore())

const activeTab = ref<string>('located')

const categories: Ref<string[]> = ref(['located', 'sold', 'archived'])

function fillInMachine(selectedMachine: Machine) {
  machineStore.setMachine(selectedMachine)
}
</script>
