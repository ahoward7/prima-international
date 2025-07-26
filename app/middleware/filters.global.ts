import { defineNuxtRouteMiddleware, useFetch } from '#app'
import { useMachineStore } from '~/../stores/machine'

export default defineNuxtRouteMiddleware(async () => {
  const machineStore = useMachineStore()

  if (machineStore.filterOptions.model) return

  const { data, error } = await useFetch('/machine/filters', {
    deep: true
  })

  if (error.value) {
    console.error('Failed to load machine filters:', error.value)
    return
  }

  if (data.value) {
    machineStore.setFilterOptions(data.value)
  }
})
