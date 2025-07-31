<template>
  <div class="flex flex-col gap-8">
    <div>
      <HeaderSecondary class="mb-4">
        Machine Search
      </HeaderSecondary>
      <InputMachineSearch @select="fillInMachine" />
    </div>
    <template v-if="machineToModify.m_id">
      <div class="flex justify-center w-full">
        <FormLocatedMachine v-model="machineToModify" mode="update" />
      </div>
      <DividerLine />
      
      <div class="flex justify-between">
        <div class="flex items-center bg-prima-yellow/50 pl-2">
          <label class="font-bold text-lg">Current Location:</label>
          <span class="font-bold text-lg text-prima-red underline px-3 py-2">Located</span>
        </div>
        <div class="flex gap-4 justify-end">
          <button class="text-lg text-white font-semibold bg-prima-red px-3 py-2 cursor-pointer" @click="updateMachine">
            Update Machine
          </button>
          <button class="text-lg text-white font-semibold bg-prima-red px-3 py-2 cursor-pointer">
            Move To Sold
          </button>
          <button class="text-lg text-white font-semibold bg-prima-red px-3 py-2 cursor-pointer" @click="archiveMachine">
            Archive Machine
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useMachineStore } from '~~/stores/machine'
const emit = defineEmits(['update', 'archive'])
const machineStore = useMachineStore()
const { machine } = storeToRefs(useMachineStore())

const machineToModify: Ref<MachineForm> = ref(machine.value)

function fillInMachine(selectedMachine: Machine) {
  machineToModify.value = selectedMachine
}

function updateMachine() {
  machineStore.setMachine(machineToModify.value)
  emit('update')
}

function archiveMachine() {
  machineStore.setMachine(machineToModify.value)
  emit('archive')
}
</script>
