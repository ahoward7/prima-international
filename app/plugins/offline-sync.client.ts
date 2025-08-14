import { invoke } from '@tauri-apps/api/core'
import { useMachineStore } from '~~/stores/machine'
import { useOfflineStore } from '~~/stores/offline'

export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return
  const isTauri = '__TAURI__' in window
  const config = useRuntimeConfig()
  const apiBase = ((config.public as any)?.apiBase as string) || ''
  const isHttpApiBase = /^https?:\/\//i.test(apiBase)

  const isOnline = () => {
    try {
      // Treat unknown as online to avoid blocking flush; network will fail gracefully if truly offline
      return typeof window !== 'undefined' && (navigator?.onLine ?? true)
    }
    catch {
      return true
    }
  }

  async function flush() {
    // Prefer configured base; fall back to current origin (useful in dev)
    const fallbackOrigin = (window?.location?.origin || '')
    const baseUrl = (isHttpApiBase ? apiBase : fallbackOrigin)
    if (!isTauri || !isOnline() || !/^https?:\/\//i.test(baseUrl)) return
    try {
      const flushed = await invoke<number>('flush_outbox', { baseUrl, bearer: null })
      if (typeof flushed === 'number' && flushed > 0) {
        // Clear local overlays and refresh data
        const offline = useOfflineStore()
        offline.clearAll()
        const machineStore = useMachineStore()
        machineStore.refreshMachines++
      }
    }
    catch (e) {
      console.info('flush failed', e)
    }
  }

  window.addEventListener('online', () => {
    flush()
  })

  // Try once at boot
  setTimeout(() => { flush() }, 1000)
})
