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
          <InputSelect v-model="filters.location" label="Location" :options="filterOptions.location" class="w-40" />
          <InputSelect v-model="filters.model" label="Model" :options="filterOptions.model" class="w-40" />
          <InputSelect v-model="filters.type" label="Type" :options="filterOptions.type" class="w-40" />
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
  location: '',
  search: '',
  pageSize: 20,
  sortBy: 'model',
  model: '',
  type: '',
})

const filterOptions = {
  location: [
    { label: 'Choose location', data: '' },
    { label: 'Located', data: 'located' },
    { label: 'Sold', data: 'sold' },
    { label: 'Archived', data: 'archived' },
  ],
  model: [
    { label: 'Choose model', data: '' },
    { label: '988K', data: '988K' },
    { label: '775E', data: '775E' },
    { label: 'A40D', data: 'A40D' },
    { label: 'D9T', data: 'D9T' },
    { label: '950GC', data: '950GC' },
    { label: '772G', data: '772G' },
    { label: 'WA9003EO', data: 'WA9003EO' },
    { label: '950M', data: '950M' },
    { label: '775F', data: '775F' },
    { label: '924K', data: '924K' },
    { label: '777G', data: '777G' },
    { label: '544L', data: '544L' },
    { label: '785C', data: '785C' },
    { label: '773G', data: '773G' },
    { label: '772', data: '772' },
    { label: '336FL', data: '336FL' },
    { label: '14M', data: '14M' }
  ],
  type: [
    { label: 'Choose type', data: '' },
    { label: 'WL', data: 'WL' },
    { label: 'OHT', data: 'OHT' },
    { label: 'ADT', data: 'ADT' },
    { label: 'TTT', data: 'TTT' },
    { label: 'EX', data: 'EX' },
    { label: 'MG', data: 'MG' }
  ]
}

const searchInput = ref('')
const displayFormat = ref('oneLine')

const debouncedSearch = useDebounceFn((value: string) => {
  filters.value.search = value
}, 300)

watch(searchInput, (newValue) => {
  debouncedSearch(newValue)
})

const { data: machines, pending } = await useFetch<Machine[]>('/machine', { 
  method: 'GET', 
  query: filters,
  watch: [filters]
})

const machineCategories: string[] = ['located', 'sold', 'archived', 'all']
const displayFormats: string[] = ['oneLine', "twoLine", "twoLineTruncated"]
</script>