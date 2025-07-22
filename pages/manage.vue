<template>
  <div class="flex justify-center px-4 py-12">
    <div class="flex flex-col gap-8 w-full max-w-[1200px]">
      <HeaderPrimary class="mb-8">Management Options</HeaderPrimary>
      <FilterTabs v-model="managementOption" :options="managementOptions" />
      <FormAddMachine v-if="managementOption === 'addNewMachine'" />
      <FormExistingMachine v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
const managementOption = ref('addNewMachine')

const managementOptions = ['addNewMachine', 'updateExistingMachine']
</script>
