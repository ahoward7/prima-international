<template>
  <div class="min-h-screen flex justify-center px-4 py-12">
    <div class="flex flex-col gap-8 w-full max-w-[1200px]">
      <HeaderPrimary>
        Inventory
      </HeaderPrimary>
      <div class="flex flex-col gap-4">
        <HeaderSecondary>Category</HeaderSecondary>
        <div class="flex">
          <FilterTabs v-model="filters.category" :categories="categories" />
        </div>
      </div>
      <div class="flex flex-col gap-4">
        <HeaderSecondary>Search Filters</HeaderSecondary>
        <div class="grid grid-cols-4">
          <InputText v-model="searchInput" label="Universal" placeholder="Search anything..." />
        </div>
      </div>
      <Table :machines="machines" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const filters = ref<MachineFilters>({
  category: 'located',
  search: '',
  pageSize: ''
})

const searchInput = ref('')

const debouncedSearch = useDebounceFn((value: string) => {
  filters.value.search = value
}, 300)

watch(searchInput, (newValue) => {
  debouncedSearch(newValue)
})

const { data: machines } = await useFetch<Machine[]>('/machine', { 
  method: 'GET', 
  query: filters,
  watch: [filters] // Re-fetch when filters change
})

const categories = ref<string[]>(['located', 'sold', 'archived', 'all'])
</script>