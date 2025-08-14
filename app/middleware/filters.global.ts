import { defineNuxtRouteMiddleware, useFetch } from '#app'
// offline helper auto-import: localGetFilters
import { useMachineStore } from '~~/stores/machine'

export default defineNuxtRouteMiddleware(async () => {
  const machineStore = useMachineStore()

  if (machineStore.filterOptions.model) return

  const { data, error } = await useFetch<FetchResponse<FilterOptions>>('/api/machines/filters', {
    deep: true
  })

  if (data.value?.data) {
    machineStore.setFilterOptions(data.value.data)
    return
  }

  // Fallback to local snapshot
  try {
    const local = await localGetFilters()
    if (local) machineStore.setFilterOptions(local)
  }
  catch (e) {
    console.error('Failed to load machine filters:', error.value || e)
  }
})
