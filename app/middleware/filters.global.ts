import { defineNuxtRouteMiddleware, useFetch } from '#app'
import { useMachineStore } from '~~/stores/machine'

export default defineNuxtRouteMiddleware(async () => {
  const machineStore = useMachineStore()

  if (machineStore.filterOptions.model) return

  const { data, error } = await useFetch<{ data: FilterOptions }>(
    '/api/machines/filters',
    {
      deep: true
    }
  )

  if (error.value) {
    console.error('Failed to load machine filters:', error.value)
    return
  }

  if (data.value?.data) {
    machineStore.setFilterOptions(data.value.data)
  }
})
