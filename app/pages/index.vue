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
import { useOfflineStore } from '~~/stores/offline'

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
 
const { data: machinesEnvelope, refresh } = await useFetch<FetchResponse<ApiData<Machine | ArchivedMachine | SoldMachine>>>(
  '/api/machines',
  {
    method: 'GET',
    query: filters,
    watch: [filters]
  }
)
const offline = useOfflineStore()
// Track connectivity
const isOffline = ref(typeof navigator !== 'undefined' ? !navigator?.onLine : false)
if (import.meta.client) {
  const updateOnline = () => { isOffline.value = !navigator?.onLine }
  window.addEventListener('online', updateOnline)
  window.addEventListener('offline', updateOnline)
}

// Local snapshot fallback cache
const localApiData = ref<ApiData<any> | null>(null)

watch([filters, machinesEnvelope, isOffline], async () => {
  const env = machinesEnvelope.value
  const hasNetworkData = !!(env?.data?.data && (env.data.data as any[]).length)
  if (isOffline.value || !hasNetworkData) {
    try {
      const local = await localQueryMachines(filters.value)
      localApiData.value = local
    }
    catch {
      localApiData.value = null
    }
  }
  else {
    localApiData.value = null
  }
}, { immediate: true, deep: true })

const machines = computed<ApiData<any> | undefined>(() => {
  const env = machinesEnvelope.value // FetchResponse<ApiData<T>> | undefined
  const apiData = env?.data // ApiData<T> | undefined
  const baseList = (localApiData.value?.data as any[] | undefined) || (apiData?.data as any[] | undefined) || []
  const items = offline.applyOverlay(baseList, (filters.value.location as any), filters.value)
  const baseTotal = localApiData.value?.total ?? apiData?.total ?? baseList.length
  const total = baseTotal + (items.length - baseList.length)
  if (!env && !localApiData.value) return undefined
  return { data: items, total }
})

// Initial snapshot sync on first load (non-blocking)
onMounted(async () => {
  if (navigator?.onLine) {
    try {
      await syncAllSnapshots()
    }
    catch {
      // ignore
    }

    // Periodic full DB sync (once per day) for robust offline mode
    try {
      const k = 'offline:lastFullDbSync'
      const last = Number.parseInt(localStorage.getItem(k) || '0', 10) || 0
      const dayMs = 24 * 60 * 60 * 1000
      if (!last || Date.now() - last > dayMs) {
        await dbSyncAll()
        localStorage.setItem(k, String(Date.now()))
      }
    }
    catch {
      // ignore
    }
  }
})

watch(refreshMachines, () => {
  refresh()
})

function clearFilters() {
  machineStore.resetFilters()
  filters.value = storeFilters.value
  searchInput.value = ''
}
</script>
