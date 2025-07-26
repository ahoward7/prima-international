<template>
  <div class="min-h-screen flex justify-center px-4 py-12">
    <div class="flex flex-col gap-8 w-full max-w-[1200px]">
      <HeaderPrimary class="mb-8">Management</HeaderPrimary>
      <FilterTabs :model-value="action" :options="managementActions" @select="setManagementAction" />
      <FormAddMachine v-if="action === 'add'" @create="createMachine" />
      <FormExistingMachine @update="updateMachine" v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
const machineStore = useMachineStore()
const { machine, action } = storeToRefs(useMachineStore())

function setManagementAction(action: FilterOption) {
  machineStore.setAction(action.data as string)
}

async function updateMachine() {
  await $fetch('/machine', {
    method: 'PUT',
    body: machine.value
  })
}

async function createMachine() {
  console.log(machine.value)
  await $fetch('/machine', {
    method: 'POST',
    body: machine.value
  })
}

const managementActions = [
  { label: 'Add Machine', data: 'add' },
  { label: 'Update Machine', data: 'update' },
]
</script>
