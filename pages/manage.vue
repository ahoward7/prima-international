<template>
  <div class="min-h-screen flex justify-center px-4 py-12">
    <div class="flex flex-col gap-8 w-full max-w-[1200px]">
      <HeaderPrimary class="mb-8">Management</HeaderPrimary>
      <FilterTabs :model-value="action" :options="managementActions" @select="setManagementAction" />
      <FormAddMachine v-if="action === 'add'" />
      <FormExistingMachine v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { managementActions } from '~/constants'

const { action } = storeToRefs(useMachineStore())
const machineStore = useMachineStore()

function setManagementAction(action: FilterOption) {
  machineStore.setAction(action.data)
}
</script>
