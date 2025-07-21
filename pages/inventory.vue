<template>
  <div class="min-h-screen flex justify-center px-4 md:px-8 py-12">
    <div class="flex flex-col gap-8 w-full">
      <HeaderPrimary>
        Inventory
      </HeaderPrimary>
      <div class="flex flex-col gap-4">
        <HeaderSecondary>Category</HeaderSecondary>
        <div class="flex">
          <FilterTabs v-if="filters.category" v-model="filters.category" :options="machineCategories" />
        </div>
      </div>
      <div class="flex flex-col gap-4">
        <HeaderSecondary>Search Filters</HeaderSecondary>
        <div class="grid grid-cols-4 gap-4">
          <InputText v-model="searchInput" label="Universal" placeholder="Search anything..." />
          <FilterType />
          <FilterModel />
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
  category: 'located',
  search: '',
  pageSize: 10,
  sortBy: 'model'
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