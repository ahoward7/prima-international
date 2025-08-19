import { useMachineStore } from '~~/stores/machine'
import { useNotificationStore } from '~~/stores/notification'

async function apiFetch<T>(url: string, opts: any): Promise<ApiEnvelope<T>> {
  try {
    const res: any = await $fetch(url, opts)
    if (res?.data !== undefined) return { ok: true, data: res.data as T }
    if (res?.success === true && res?.data === undefined) return { ok: true, data: res as T }
    if (res?.error) return { ok: false, error: res.error as ProblemDetails }
    return { ok: true, data: res as T }
  }
  catch (e: any) {
    return {
      ok: false,
      error: {
        title: e?.statusMessage || 'Request error',
        status: e?.statusCode || 500,
        detail: e?.data || e?.message || 'Client: Unexpected error'
      }
    }
  }
}

export async function createMachine() {
  const { machine, filters, filterStatus } = storeToRefs(useMachineStore())

  const notificationStore = useNotificationStore()

  try {
    filterStatus.value = 'fetch'
    
    const res = await apiFetch<ApiPayload<Machine>>('/api/machines', {
      method: 'POST',
      body: machine.value
    })

    if (!res.ok) return handleError(res.error, 'Error creating machine')

    notificationStore.pushNotification('success', 'Machine created successfully')
    filters.value.search = res.data?.machine?.serialNumber || ''
    navigateTo('/')
  }
  catch (error: any) {
    return handleError(error, 'Error creating machine')
  }
}

export function selectMachine(id?: string) {
  const { filters } = useMachineStore()

  if (id) {
    navigateTo(`/detail/?id=${id}&location=${filters.location}`)
  }
}

export async function updateMachine(id?: string) {
  if (!id) return

  const { machine, archivedMachine, soldMachine, filters, filterStatus } = storeToRefs(useMachineStore())
  const notificationStore = useNotificationStore()

  let machineToUpdate
  const location = filters.value.location

  if (location === 'located') {
    machineToUpdate = machine.value as Machine
  }
  else if (location === 'archived') {
    const aMachine = machine.value as Omit<Machine, 'm_id'>
    machineToUpdate = {
      a_id: id,
      archiveDate: archivedMachine.value.archiveDate,
      machine: aMachine
    } as ArchivedMachine
  }
  else {
    const sMachine = machine.value as Omit<Machine, 'm_id'>
    machineToUpdate = {
      s_id: id,
      dateSold: soldMachine.value.dateSold,
      machine: sMachine,
      truckingCompany: soldMachine.value.truckingCompany,
      buyer: soldMachine.value.buyer,
      buyerLocation: soldMachine.value.buyerLocation,
      purchaseFob: soldMachine.value.purchaseFob,
      machineCost: soldMachine.value.machineCost,
      freightCost: soldMachine.value.freightCost,
      paintCost: soldMachine.value.paintCost,
      otherCost: soldMachine.value.otherCost,
      profit: soldMachine.value.profit,
      totalCost: soldMachine.value.totalCost,
      notes: soldMachine.value.notes
    } as SoldMachine
  }

  try {
    const url = `/api/machines/${id}`
    filterStatus.value = 'fetch'

    const res = await apiFetch<ApiPayload<any>>(url, {
      method: 'PUT',
      query: { location },
      body: machineToUpdate
    })
    if (!res.ok) return handleError(res.error, 'Error updating machine')

    notificationStore.pushNotification('success', 'Machine updated successfully')
    filters.value.search = res.data?.machine?.serialNumber || res.data?.machine?.machine?.serialNumber || ''
    navigateTo('/')
  }
  catch (error: any) {
    return handleError(error, 'Error updating machine')
  }
}

export async function archiveMachine(machineFromTable?: Machine) {
  const { machine } = useMachineStore()
  const notificationStore = useNotificationStore()
  const machineToArchive = machineFromTable || machine

  try {
    const res = await apiFetch<any>('/api/machines/archive', {
      method: 'POST',
      body: machineToArchive
    })
    if (!res.ok) return handleError(res.error, 'Error archiving machine')

    notificationStore.pushNotification('success', 'Machine added to archives successfully')
    navigateTo('/')
  }
  catch (error: any) {
    return handleError(error, 'Error archiving machine')
  }
}

export async function sellMachine() {
  const { machine, soldMachine } = useMachineStore()
  const notificationStore = useNotificationStore()

  try {
    const res = await apiFetch<any>('/api/machines/sold', {
      method: 'POST',
      body: {
        machine,
        sold: soldMachine
      }
    })
    if (!res.ok) return handleError(res.error, 'Error selling machine')

    notificationStore.pushNotification('success', 'Machine added to sold table successfully')
    navigateTo('/')
  }
  catch (error: any) {
    return handleError(error, 'Error selling machine')
  }
}

export async function deleteMachine(id?: string) {
  if (!id) return

  const machineStore = useMachineStore()
  const notificationStore = useNotificationStore()

  try {
    const res = await apiFetch<any>(`/api/machines/${id}`, {
      method: 'DELETE',
      query: { location: machineStore.filters.location }
    })
    if (!res.ok) return handleError(res.error, 'Error deleting machine')

    machineStore.refreshMachines++
    notificationStore.pushNotification('success', 'Machine deleted successfully')
    navigateTo('/')
  }
  catch (error: any) {
    return handleError(error, 'Error deleting machine')
  }
}

function handleError(error: any, defaultMessage: string) {
  const notificationStore = useNotificationStore()
  notificationStore.pushNotification('error', defaultMessage)

  const statusCode = error?.status ?? error?.statusCode ?? 500
  const statusMessage = error?.title ?? error?.statusMessage ?? defaultMessage
  const data = error?.detail ?? error?.data ?? error?.message ?? 'Client: Unexpected error'

  return createError({
    statusCode,
    statusMessage,
    data
  })
}