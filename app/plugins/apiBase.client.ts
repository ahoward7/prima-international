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
    // Check for force offline mode via URL parameter or localStorage
    const forceOffline = typeof window !== 'undefined' && 
      (new URLSearchParams(window.location.search).has('offline') || 
       localStorage.getItem('forceOffline') === 'true')
    
    console.info('🔍 API Base Detection:', {
      forceOffline,
      navigatorOnline: typeof navigator !== 'undefined' ? navigator.onLine : 'unknown',
      currentBase: apiBase.value
    })
    
    if (forceOffline) {
      console.info('🔧 Force offline mode enabled')
      const isOfflineReachable = await isReachable(offlineBase)
      console.info('🏠 Offline server reachable:', isOfflineReachable)
      apiBase.value = isOfflineReachable ? offlineBase : '/'
      console.info('📍 API Base set to:', apiBase.value)
      return
    }
    
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      console.info('📴 Browser offline - trying local server')
      const isOfflineReachable = await isReachable(offlineBase)
      console.info('🏠 Offline server reachable:', isOfflineReachable)
      apiBase.value = isOfflineReachable ? offlineBase : '/'
      console.info('📍 API Base set to:', apiBase.value)
      return
    }
    
    console.info('🌐 Browser online - using Nuxt server')
    apiBase.value = '/'
    console.info('📍 API Base set to:', apiBase.value)
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
