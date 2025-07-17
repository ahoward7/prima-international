<template>
  <div class="flex justify-center px-4 py-12">
    <div class="flex flex-col gap-16 w-full max-w-[1200px]">
      <div class="text-prima-red text-5xl font-prima font-extrabold text-center">
        Inventory
      </div>
      <div class="flex">
        <FilterTabs v-model="filters.category" />
      </div>
      <Table :machines="machines" />
      <div class="grid grid-cols-2 gap-8">
        <MachineCard v-for="machine in machines" :key="machine.id" :machine="machine" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import machines from '~/temp/machines'

const filters = ref<MachineFilters>({
  category: 'located'
})
</script>
