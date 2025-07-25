import { defineNuxtRouteMiddleware, useFetch } from '#app'
import { useMachineStore } from '~/stores/machine'

export default defineNuxtRouteMiddleware(async () => {
  const machineStore = useMachineStore()

  if (machineStore.filters.model) return

  const { data, error } = await useFetch('/machine/filters')

  if (error.value) {
    console.error('Failed to load machine filters:', error.value)
    return
  }

  if (data.value) {
    machineStore.setFilters(data.value)
  }
})
