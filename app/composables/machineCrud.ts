import { useMachineStore } from '~~/stores/machine'
import { useNotificationStore } from '~~/stores/notification'

// RFC7807-style error and response envelope used by the server
interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  code?: string
  errors?: Record<string, string[]>
}
// Change to discriminated union so TS can narrow on `ok`
type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: ProblemDetails }

// Thin wrapper that accepts both the new { data } envelope and legacy { success } shapes
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
  const { machine } = useMachineStore()
  const notificationStore = useNotificationStore()

  try {
    // Server improvement: return 201, Location header, and { data: Machine }
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

export function selectMachine(id?: string) {
  const { filters } = useMachineStore()

  if (id) {
    navigateTo(`/detail/?id=${id}&location=${filters.location}`)
  }
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
    // Server improvement: RESTful paths per resource/action
    const url =
      location === 'located'
        ? `/api/machines/${id}`
        : location === 'archived'
          ? `/api/machines/${id}/archive`
          : `/api/machines/${id}/sold`

    const res = await apiFetch<any>(url, {
      method: 'PUT',
      body: machineToUpdate
      // headers: { 'If-Match': (machine as any)?.version ?? (machine as any)?.etag ?? '' }
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
    // Server improvement: action endpoint with id in path; return { data: ArchivedMachine }
    const id = (machineToArchive as any)?.m_id
    const res = await apiFetch<any>(`/api/machines/${id}/archive`, {
      method: 'POST',
      body: { archiveDate: (machine as any)?.archiveDate } // or include only needed fields
      // headers: { 'Idempotency-Key': crypto.randomUUID() }
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
    // Server improvement: action endpoint; return { data: SoldMachine }
    const id = (machine as any)?.m_id
    const res = await apiFetch<any>(`/api/machines/${id}/sold`, {
      method: 'POST',
      body: soldMachine
      // headers: { 'Idempotency-Key': crypto.randomUUID() }
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
    // Server improvement: DELETE /api/machines/:id -> 204 No Content
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

  // Prefer RFC7807 fields when available
  const statusCode = error?.status ?? error?.statusCode ?? 500
  const statusMessage = error?.title ?? error?.statusMessage ?? defaultMessage
  const data = error?.detail ?? error?.data ?? error?.message ?? 'Client: Unexpected error'

  return createError({
    statusCode,
    statusMessage,
    data
  })
}