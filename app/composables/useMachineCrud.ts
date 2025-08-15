import { useMachineStore } from '~~/stores/machine'
import { useNotificationStore } from '~~/stores/notification'
import { useApiBase } from '~/composables/useApiBase'

async function apiFetch<T>(url: string, opts: any): Promise<ApiEnvelope<T>> {
  // Route requests through the offline-aware base and retry once against the local server on network errors
  const { url: withBase } = useApiBase()
  const finalUrl = withBase(url)
  try {
    const res: any = await $fetch(finalUrl, opts)
    if (res?.data !== undefined) return { ok: true, data: res.data as T }
    if (res?.success === true && res?.data === undefined) return { ok: true, data: res as T }
    if (res?.error) return { ok: false, error: res.error as ProblemDetails }
    return { ok: true, data: res as T }
  }
  catch (e: any) {
    // If first attempt fails and the URL was relative, try the local offline server directly as a fallback
    const isRelative = typeof url === 'string' && !/^https?:\/\//i.test(url)
    if (isRelative) {
      try {
        const offlineUrl = new URL(url.replace(/^\//, ''), 'http://127.0.0.1:27271/').toString()
        const res: any = await $fetch(offlineUrl, opts)
        if (res?.data !== undefined) return { ok: true, data: res.data as T }
        if (res?.success === true && res?.data === undefined) return { ok: true, data: res as T }
        if (res?.error) return { ok: false, error: res.error as ProblemDetails }
        return { ok: true, data: res as T }
      }
      catch {
        // fall through to standard error envelope below
      }
    }
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
  const { machine } = useMachineStore()
  const notificationStore = useNotificationStore()

  try {
    const res = await apiFetch<Machine>('/api/machines', {
      method: 'POST',
      body: machine
    })
    if (!res.ok) return handleError(res.error, 'Error creating machine')

    notificationStore.pushNotification('success', 'Machine created successfully')
    navigateTo('/')
  }
  catch (error: any) {
    return handleError(error, 'Error creating machine')
  }
}

export async function selectMachine(id?: string) {
  if (!id) return
  const store = useMachineStore()
  const location = store.filters?.location || 'located'
  // Yield to next tick to avoid DOM patching race before route change
  await nextTick()
  navigateTo(`/detail/?id=${id}&location=${location}`)
}

export async function updateMachine(id?: string) {
  if (!id) return

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
      a_id: id,
      archiveDate: archivedMachine.archiveDate,
      machine: aMachine
    } as ArchivedMachine
  }
  else {
    const sMachine = machine as Omit<Machine, 'm_id'>
    machineToUpdate = {
      s_id: id,
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

  try {
    const url = `/api/machines/${id}`

    const res = await apiFetch<any>(url, {
      method: 'PUT',
      query: { location },
      body: machineToUpdate
    })
    if (!res.ok) return handleError(res.error, 'Error updating machine')

    notificationStore.pushNotification('success', 'Machine updated successfully')
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