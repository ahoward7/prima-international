// Decide API base URL per runtime:
// - In Tauri: always use the local SQLite HTTP server (http://127.0.0.1:27271)
// - In the web/browser: always use Nuxt server routes ("/")
export default defineNuxtPlugin(() => {
  const apiBase = useState<string>('apiBase', () => '/')
  const offlineBase = 'http://127.0.0.1:27271/'

  // Heuristic to detect Tauri runtime
  const isTauri = typeof window !== 'undefined' && (
    // Newer Tauri
    (window as any).__TAURI__ !== undefined ||
    // Older Tauri bridge
    (window as any).__TAURI_IPC__ !== undefined ||
    // Fallback UA check in dev
    (navigator?.userAgent || '').toLowerCase().includes('tauri')
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
    if (isTauri) {
      // Always prefer the local SQLite API when running inside Tauri
      apiBase.value = offlineBase
      // Optionally wait until server is up; keep base but log readiness
      isReachable(offlineBase).then((ok) => {
        if (!ok) console.info('Waiting for local SQLite server to start on 127.0.0.1:27271...')
      })
      return
    }

    // Web/browser: always use Nuxt server routes
    apiBase.value = '/'
  }

  setBase()

  return {
    provide: {
      getApiBase: () => apiBase.value
    }
  }
})
