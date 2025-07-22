<template>
  <div class="flex flex-col gap-8">
    <div class="flex justify-center w-full">
      <FormLocatedMachine v-if="['located', 'archived'].includes(activeTab)" v-model="machine" />
      <FormSoldMachine v-if="activeTab === 'sold'" v-model="soldMachine" />
    </div>
    <DividerLine />
    <div class="flex justify-end">
      <button class="text-lg text-white font-semibold bg-prima-red px-3 py-2 cursor-pointer">Add Machine</button>
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
