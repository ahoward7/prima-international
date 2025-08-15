import { defineNuxtRouteMiddleware, useFetch } from '#app'
import { useMachineStore } from '~~/stores/machine'
import { useApiBase } from '~/composables/useApiBase'

export default defineNuxtRouteMiddleware(async () => {
  const machineStore = useMachineStore()

  if (machineStore.filterOptions.model) return

  const { base, url: withBase } = useApiBase()
  const { data, error } = await useFetch<FetchResponse<FilterOptions>>(() => withBase('/api/machines/filters'), {
    deep: true,
    watch: [base],
    server: false
  })

  if (error.value) {
    console.error('Failed to load machine filters:', error.value)
    return
  }

  if (data.value?.data) {
    machineStore.setFilterOptions(data.value.data)
  }
})
