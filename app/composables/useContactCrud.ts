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

export async function saveContact(contact: ContactForm, isUpdate: boolean) {
  const notificationStore = useNotificationStore()
  const action = isUpdate ? 'updating' : 'creating'

  try {
    const res = await apiFetch<{ contactId: string, contactChanged: boolean, contact: Contact }>('/api/contact', {
      method: 'POST',
      body: contact
    })

    if (!res.ok) return handleError(res.error, `Error ${action} contact`)

    notificationStore.pushNotification('success', `Contact ${isUpdate ? 'updated' : 'created'} successfully`)
    navigateTo('/')
  }
  catch (error: any) {
    return handleError(error, `Error ${action} contact`)
  }
}

export async function deleteContact(c_id?: string) {
  if (!c_id) return

  const notificationStore = useNotificationStore()

  try {
    const machinesRes = await apiFetch<MachineLocations>(`/api/contact/${c_id}/machines`, { method: 'GET' })

    if (machinesRes.ok) {
      const { located, archived, sold } = machinesRes.data
      const total = located.length + archived.length + sold.length

      if (total > 0) {
        // eslint-disable-next-line no-alert
        const confirmed = window.confirm(
          `This contact is linked to ${total} machine(s) (${located.length} located, ${archived.length} archived, ${sold.length} sold). Delete anyway?`
        )
        if (!confirmed) return
      }
    }

    const res = await apiFetch<null>(`/api/contact/${c_id}`, { method: 'DELETE' })
    if (!res.ok) return handleError(res.error, 'Error deleting contact')

    notificationStore.pushNotification('success', 'Contact deleted successfully')
    navigateTo('/')
  }
  catch (error: any) {
    return handleError(error, 'Error deleting contact')
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
