<template>
  <div class="flex justify-center px-4 py-12">
    <div class="flex flex-col gap-16 w-full max-w-[1200px]">
      <div class="text-prima-red text-5xl font-prima font-extrabold text-center">
        Inventory
      </div>
      <div class="flex">
        <FilterTabs v-model="filters.category" :categories="categories" />
      </div>
      <Table v-if="machines" :machines="machines" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: machines } = await useFetch<Machine[]>('/machine', { method: 'GET' })

const categories = ref<string[]>(['located', 'sold', 'archived', 'all'])

const filters = ref<MachineFilters>({
  category: 'located',
  search: ''
})
</script>
