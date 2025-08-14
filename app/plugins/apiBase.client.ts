// Detect and manage API base URL: online uses Nuxt server ("/"), offline uses local Tauri server (http://127.0.0.1:27271)
export default defineNuxtPlugin(() => {
  const apiBase = useState<string>('apiBase', () => '/')
  const offlineBase = 'http://127.0.0.1:27271/'

  async function isReachable(url: string, timeoutMs = 800): Promise<boolean> {
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

  async function updateBase() {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      // offline: try local server
      apiBase.value = (await isReachable(offlineBase)) ? offlineBase : '/'
      return
    }
    // online: prefer Nuxt; but if local server is explicitly available and desired, keep '/'
    apiBase.value = '/'
  }

  // Initial check and listeners
  updateBase()
  if (typeof window !== 'undefined') {
    window.addEventListener('online', updateBase)
    window.addEventListener('offline', updateBase)
    // Periodic sanity check (local server may start after app loads)
    const interval = setInterval(updateBase, 3000)
    // Cleanup on HMR dispose
    if (import.meta && (import.meta as any).hot) {
      ;(import.meta as any).hot.on('vite:beforeFullReload', () => clearInterval(interval))
    }
  }

  return {
    provide: {
      getApiBase: () => apiBase.value
    }
  }
})
