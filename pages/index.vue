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
          <InputSelect v-model="filters.location" label="Location" :options="filterOptions.location" />
          <InputSelect v-model="filters.model" label="Model" :options="filterOptions.model" />
          <InputSelect v-model="filters.type" label="Type" :options="filterOptions.type" />
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <HeaderSecondary>Table Display</HeaderSecondary>
        <div class="flex gap-4">
          <InputSelect v-model="displayFormat" label="Display Format" :options="filterOptions.displayFormat" :clearable="false" />
          <InputSelect v-model="filters.pageSize" label="Page Size" :options="filterOptions.pageSize" :clearable="false" />
        </div>
      </div>
      <DividerLine />
      <Table :machines="machines" v-model:sort-by="filters.sortBy" v-model:page="filters.page" :display-format="displayFormat" :page-size="filters.pageSize" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const { filterOptions } = storeToRefs(useMachineStore())

const filters = ref<MachineFilters>({
  location: '',
  search: '',
  pageSize: 20,
  page: 1,
  sortBy: 'model',
  model: '',
  type: '',
})

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
</script>