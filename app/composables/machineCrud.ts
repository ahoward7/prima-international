import { useMachineStore } from '~~/stores/machine'
import { useNotificationStore } from '~~/stores/notification'

export function selectMachine(id?: string) {
  const machineStore = useMachineStore()

  if (id) {
    navigateTo(`/detail/?id=${id}&location=${machineStore.filters.location}`)
  }
}

export async function updateMachine(id?: string) {
  if (!id) {
    return
  }

  const { machine, archivedMachine, soldMachine, filters } = useMachineStore()
  const notificationStore = useNotificationStore()

  let machineToUpdate
  const location = filters.location

  if (location === 'located') {
    machineToUpdate = machine as Machine
  }
  else if (location === 'archived') {
    const aMachine = machine as Omit<Machine, 'm_id'>

    machineToUpdate = {
      a_id: id || undefined,
      archiveDate: archivedMachine.archiveDate,
      machine: aMachine
    } as ArchivedMachine
  }
  else {
    const sMachine = machine as Omit<Machine, 'm_id'>

    machineToUpdate = {
      s_id: id || undefined,
      dateSold: soldMachine.dateSold,
      machine: sMachine,
      truckingCompany: soldMachine.truckingCompany,
      buyer: soldMachine.buyer,
      buyerLocation: soldMachine.buyerLocation,
      purchaseFob: soldMachine.purchaseFob,
      machineCost: soldMachine.machineCost,
      freightCost: soldMachine.freightCost,
      paintCost: soldMachine.paintCost,
      otherCost: soldMachine.otherCost,
      profit: soldMachine.profit,
      totalCost: soldMachine.totalCost,
      notes: soldMachine.notes
    } as SoldMachine
  }

  const response = await $fetch('/machine', {
    method: 'PUT',
    body: machineToUpdate,
    query: { location }
  })

  if (response?.success) {
    notificationStore.pushNotification('success', 'Machine updated successfully')
    navigateTo('/')
  }
  else if (response?.error) {
    console.error(response?.error)
  }
}

export async function archiveMachine(machine: Machine) {
  const notificationStore = useNotificationStore()

  const response = await $fetch<{ success: boolean }>('/machine/archive', {
    method: 'POST',
    body: machine
  })

  if (response?.success) {
    notificationStore.pushNotification('success', 'Machine added to archives successfully')
  }
}

export async function sellMachine(machine: Machine) {
  void machine
}

export async function deleteMachine(id?: string) {
  if (!id) {
    return
  }

  const machineStore = useMachineStore()
  const notificationStore = useNotificationStore()

  const response = await $fetch<{ success: boolean }>('/machine', {
    method: 'DELETE',
    query: { id, location: machineStore.filters.location }
  })

  if (response.success) {
    machineStore.refreshMachines++
    notificationStore.pushNotification('success', 'Machine deleted successfully')
    navigateTo('/')
  }
}