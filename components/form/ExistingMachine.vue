<template>
  <div class="flex flex-col gap-8">
    <div>
      <HeaderSecondary class="mb-4">Machine Lookup</HeaderSecondary>
      <InputMachineSearch @select="fillInMachine" />
    </div>
    <template v-if="machine.m_id">
      <div class="flex justify-center w-full">
        <FormLocatedMachine v-if="['located', 'archived'].includes(activeTab)" v-model="machine" mode="update" />
        <FormSoldMachine v-if="activeTab === 'sold'" v-model="soldMachine" />
      </div>
      <DividerLine />
      
      <div class="flex justify-between">
        <div class="flex items-center bg-prima-yellow/50 pl-2">
          <label class="font-bold text-lg">Current Location:</label>
          <span class="font-bold text-lg text-prima-red underline px-3 py-2">Located</span>
        </div>
        <div class="flex gap-4 justify-end">
          <button class="text-lg text-white font-semibold bg-prima-red px-3 py-2 cursor-pointer" @click="updateMachine">Update Machine</button>
          <button class="text-lg text-white font-semibold bg-prima-red px-3 py-2 cursor-pointer">Move To Sold</button>
          <button class="text-lg text-white font-semibold bg-prima-red px-3 py-2 cursor-pointer">Archive Machine</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const machineStore = useMachineStore()
const { machine, soldMachine } = storeToRefs(useMachineStore())

const emit = defineEmits(['update'])

const activeTab = ref<string>('located')

const categories: Ref<string[]> = ref(['located', 'sold', 'archived'])

function fillInMachine(selectedMachine: Machine) {
  machineStore.setMachine(selectedMachine)
}

function updateMachine() {
  emit('update')
}
</script>
