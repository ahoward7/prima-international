<template>
  <div class="min-h-screen flex justify-center px-4 md:px-8 py-12">
    <div class="flex flex-col gap-8 w-full">
      <HeaderPrimary>
        Inventory
      </HeaderPrimary>
      <div class="flex flex-col gap-2">
        <HeaderSecondary>Search Filters</HeaderSecondary>
        <div class="flex gap-4">
          <InputText class="w-60" v-model="searchInput" label="Universal" placeholder="Search anything..." />
          <FilterLocation class="w-40" v-model="filters.location" />
          <FilterModel class="w-40" v-model="filters.model" />
          <FilterType class="w-40" v-model="filters.type" />
        </div>
      </div>
      <div class="flex flex-col gap-4">
        <HeaderSecondary>Display Format</HeaderSecondary>
        <div class="flex">
          <FilterTabs v-model="displayFormat" :options="displayFormats" />
        </div>
      </div>
      <DividerLine />
      <Table :machines="machines" v-model:sort-by="filters.sortBy" :display-format="displayFormat" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const filters = ref<MachineFilters>({
  location: 'located',
  search: '',
  pageSize: 10,
  sortBy: 'model',
  model: 'All',
  type: 'All',
})

const searchInput = ref('')
const displayFormat = ref('oneLine')

const debouncedSearch = useDebounceFn((value: string) => {
  filters.value.search = value
}, 300)

watch(searchInput, (newValue) => {
  debouncedSearch(newValue)
})

const { data: machines } = await useFetch<Machine[]>('/machine', { 
  method: 'GET', 
  query: filters,
  watch: [filters]
})

const machineCategories: string[] = ['located', 'sold', 'archived', 'all']
const displayFormats: string[] = ['oneLine', "twoLine", "twoLineTruncated"]
</script>