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

export async function createContact(contact: ContactForm) {
  const notificationStore = useNotificationStore()

  try {
    const res = await apiFetch<{ contactId: string, contactChanged: boolean, contact: Contact }>('/api/contact', {
      method: 'POST',
      body: contact
    })

    if (!res.ok) return handleError(res.error, 'Error creating contact')

    notificationStore.pushNotification('success', 'Contact created successfully')
    navigateTo('/')
  }
  catch (error: any) {
    return handleError(error, 'Error creating contact')
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
