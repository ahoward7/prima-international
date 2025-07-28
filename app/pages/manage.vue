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
import { useMachineStore } from '~~/stores/machine'
const machineStore = useMachineStore()
const { machine, action } = storeToRefs(useMachineStore())

machineStore.resetMachine()

function setManagementAction(action: FilterOption) {
  machineStore.resetMachine()
  machineStore.setAction(action.data as string)
}

async function updateMachine() {
  const response = await $fetch('/machine', {
    method: 'PUT',
    body: machine.value
  })

  if (response.success) {
    navigateTo(`/detail?id=${machine.value.m_id}`)
  }
}

async function createMachine() {
  const response = await $fetch('/machine', {
    method: 'POST',
    body: machine.value
  })

  if (response.success) {
    navigateTo(`/detail?id=${response.machine.m_id}`)
  }
}

const managementActions = [
  { label: 'Add Machine', data: 'add' },
  { label: 'Update Machine', data: 'update' },
]
</script>
