<template>
  <div class="min-h-screen flex justify-center px-4 md:px-8 py-12">
    <div class="flex flex-col gap-8 w-full">
      <HeaderPrimary>
        Inventory
      </HeaderPrimary>
      <div class="flex flex-col gap-2">
        <HeaderSecondary>Search Filters</HeaderSecondary>
        <div class="flex gap-4">
          <InputText v-model="searchInput" class="w-60" label="Universal" placeholder="Search anything..." />
          <InputSelect v-model="filters.location" label="Located/Sold/Archived" :options="filterOptions.location" width="w-52" />
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
      <Table v-model:sort-by="filters.sortBy" v-model:page="filters.page" :machines="machines" :display-format="displayFormat" :page-size="filters.pageSize" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { useMachineStore } from '~~/stores/machine'

const machineStore = useMachineStore()
const { filterOptions, filters: storeFilters } = storeToRefs(machineStore)

const filters = ref<MachineFilters>({
  location: storeFilters.value.location || '',
  search: storeFilters.value.search || '',
  pageSize: storeFilters.value.pageSize || 20,
  page: storeFilters.value.page || 1,
  sortBy: storeFilters.value.sortBy || 'type',
  model: storeFilters.value.model || '',
  type: storeFilters.value.type || ''
})

watch(filters, (newFilters) => {
  machineStore.setFilters(newFilters)
}, { deep: true })

watch(
  () => [filters.value.location, filters.value.pageSize, filters.value.sortBy, filters.value.model, filters.value.type],
  () => {
    filters.value.page = 1
  }
)

const searchInput = ref(filters.value.search)
const displayFormat = ref('oneLine')

const debouncedSearch = useDebounceFn((value: string) => {
  filters.value.search = value
}, 300)

watch(searchInput, (newValue) => {
  debouncedSearch(newValue as string)
})

const { data: machines } = await useFetch<{ data: Machine[], total: number }>('/machine', { 
  method: 'GET', 
  query: filters,
  watch: [filters]
})
</script>
