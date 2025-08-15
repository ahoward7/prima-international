// Server-side companion to apiBase.client.ts so SSR and client choose the same base.
export default defineNuxtPlugin(() => {
  const apiBase = useState<string>('apiBase', () => '/')
  const offlineBase = 'http://127.0.0.1:27271/'

  // On server, detect the query flag from the incoming request
  const url = useRequestURL()
  const forceLocal = url.searchParams.get('local') === '1' || (process.env.FORCE_LOCAL_API === '1')

  if (forceLocal) {
    apiBase.value = offlineBase
    console.info('[apiBase][server] Force-local flag detected -> using local SQLite API:', apiBase.value)
  }
  else {
    apiBase.value = '/'
  }

  return {
    provide: {
      getApiBase: () => apiBase.value
    }
  }
})
