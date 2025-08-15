<template>
  <div class="min-h-screen flex justify-center px-4 md:px-8 py-16">
    <div class="flex flex-col gap-8 w-full">
      <HeaderPrimary>
        Inventory
      </HeaderPrimary>
      <div class="flex flex-col gap-2">
        <HeaderSecondary>Search Filters</HeaderSecondary>
        <div class="flex gap-4">
          <InputText v-model="searchInput" class="w-60" label="Universal" placeholder="Search anything..." />
          <InputSelect v-model="filters.location" label="Loc/Sold/Arch" placeholder="Filter by location..." :options="filterOptions.location" width="w-52" />
          <InputTextSelect v-model="filters.type" label="Type" placeholder="Filter by type..." :options="filterOptions.type" />
          <InputTextSelect v-model="filters.model" label="Model" placeholder="Filter by model..." :options="filterOptions.model" />
          <InputContactSearch v-model="filters.contactId" class="!w-[440px]" />
          <div class="flex items-end">
            <Button class="!h-fit !px-2 !py-1 !bg-prima-yellow border border-prima-yellow" @click="clearFilters">
              Clear
            </Button>
          </div>
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
      <Table
        v-model:sort-by="filters.sortBy"
        v-model:page="filters.page"
        :machines="machines"
        :display-format="displayFormat"
        :page-size="filters.pageSize"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { useMachineStore } from '~~/stores/machine'
import { useApiBase } from '~/composables/useApiBase'

const machineStore = useMachineStore()
const { filterOptions, filters: storeFilters, refreshMachines } = storeToRefs(machineStore)

const filters = ref<MachineFilters>(storeFilters.value)

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
}, 200)

watch(searchInput, (newValue) => {
  debouncedSearch(newValue as string)
})
 
const { base, url: withBase } = useApiBase()
const { data: machinesEnvelope, refresh } = await useFetch<FetchResponse<ApiData<Machine | ArchivedMachine | SoldMachine>>>(
  () => withBase('/api/machines'),
  {
    method: 'GET',
    query: filters,
    watch: [filters, base],
    server: false
  }
)
const machines = computed(() => machinesEnvelope.value?.data)

watch(refreshMachines, () => {
  refresh()
})

function clearFilters() {
  machineStore.resetFilters()
  filters.value = storeFilters.value
  searchInput.value = ''
}
</script>
