// Decide API base URL per runtime:
// - In Tauri: always use the local SQLite HTTP server (http://127.0.0.1:27271)
// - In the web/browser: always use Nuxt server routes ("/")
export default defineNuxtPlugin(() => {
  const apiBase = useState<string>('apiBase', () => '/')
  const offlineBase = 'http://127.0.0.1:27271/'

  // Heuristic to detect Tauri runtime
  const detectTauri = () => (
    typeof window !== 'undefined' && (
      // Newer Tauri
      (window as any).__TAURI__ !== undefined ||
      // Older Tauri bridge
      (window as any).__TAURI_IPC__ !== undefined ||
      // Some builds add metadata
      (window as any).__TAURI_METADATA__ !== undefined ||
      // Fallback UA check in dev
      (navigator?.userAgent || '').toLowerCase().includes('tauri')
    )
  )

  // Optional: fast health-check for local server readiness
  async function isReachable(url: string, timeoutMs = 600): Promise<boolean> {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(new URL('health', url).toString(), { signal: controller.signal, cache: 'no-store' })
      return res.ok
    }
    catch {
      return false
    }
    finally {
      clearTimeout(id)
    }
  }

  async function setBase() {
    const isTauriNow = detectTauri()
    const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : undefined
    const forceLocal = (search?.get('local') === '1') || (typeof localStorage !== 'undefined' && localStorage.getItem('forceLocal') === '1')
    if (forceLocal) {
      apiBase.value = offlineBase
      console.info('[apiBase] Force-local flag detected -> using local SQLite API:', apiBase.value)
      return
    }
    if (isTauriNow) {
      // Always prefer the local SQLite API when running inside Tauri
      apiBase.value = offlineBase
      // Optionally wait until server is up; keep base but log readiness
      isReachable(offlineBase).then((ok) => {
        if (!ok) console.info('Waiting for local SQLite server to start on 127.0.0.1:27271...')
      })
      console.info('[apiBase] Tauri detected -> using local SQLite API:', apiBase.value)
      return
    }

    // Web/browser: always use Nuxt server routes
    apiBase.value = '/'
    console.info('[apiBase] Browser detected -> using Nuxt server routes:', apiBase.value)
  }

  // Initial set, then retry a few times in case Tauri injects globals after startup
  setBase()
  if (typeof window !== 'undefined') {
    let tries = 0
    const maxTries = 10
    const t = setInterval(() => {
      const search = new URLSearchParams(window.location.search)
      const forceLocal = (search.get('local') === '1') || (localStorage.getItem('forceLocal') === '1')
      if (forceLocal || detectTauri()) {
        apiBase.value = offlineBase
        console.info('[apiBase] Tauri detected late -> switching to local SQLite API:', apiBase.value)
        clearInterval(t)
        return
      }
      tries++
      if (tries >= maxTries) clearInterval(t)
    }, 300)
  }

  return {
    provide: {
      getApiBase: () => apiBase.value
    }
  }
})
