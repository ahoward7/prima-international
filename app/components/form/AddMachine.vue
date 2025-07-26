<template>
  <div class="flex flex-col gap-8">
    <div class="flex justify-center w-full">
      <FormLocatedMachine v-model="machineToAdd" />
    </div>
    <DividerLine />
    <div class="flex justify-end">
      <button class="text-lg text-white font-semibold bg-prima-red px-3 py-2 cursor-pointer" @click="createMachine">Add Machine</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMachineStore } from '~~/stores/machine'
const { machine } = storeToRefs(useMachineStore())
const machineStore = useMachineStore()

const machineToAdd: Ref<MachineForm> = ref(machine.value)

const emit = defineEmits(['create'])

function createMachine() {
  emit('create', machineToAdd.value)
  machineStore.setMachine(machineToAdd.value)
}
</script>
