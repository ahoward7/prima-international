import { useMachineStore } from '~~/stores/machine'
import { useNotificationStore } from '~~/stores/notification'

export function selectMachine(id?: string) {
  const machineStore = useMachineStore()

  if (id) {
    navigateTo(`/detail/?id=${id}&location=${machineStore.filters.location}`)
  }
}

export async function archiveMachine(machine: Machine) {
  const notificationStore = useNotificationStore()

  const response = await $fetch<{ success: boolean }>('/machine/archive', {
    method: 'POST',
    body: machine
  })

  if (response?.success) {
    notificationStore.pushNotification('success', 'Machine added to sold table successfully')
  }
}

export async function sellMachine(machine: Machine) {
  void machine
}

export async function deleteMachine(machine: Machine) {
  const machineStore = useMachineStore()
  const notificationStore = useNotificationStore()

  const response = await $fetch<{ success: boolean }>('/machine', {
    method: 'DELETE',
    query: { id: machine.m_id, location: machineStore.filters.location }
  })

  if (response.success) {
    notificationStore.pushNotification('success', 'Machine deleted successfully')
  }
}

// function getMachinePostfix(location: string): string {
//   if (location === 'located') {
//     return 'm_id'
//   }
//   if (location === 'archived') {
//     return 'a_id'
//   }
//   if (location === 'sold') {
//     return 's_id'
//   }
//   return ''
// }