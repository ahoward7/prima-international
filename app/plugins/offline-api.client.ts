import { invoke } from '@tauri-apps/api/core'

export default defineNuxtPlugin((nuxtApp) => {
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window
  const config = useRuntimeConfig()
  const apiBase = ((config.public as any)?.apiBase as string) || ''
  const isHttpApiBase = /^https?:\/\//i.test(apiBase)

  function toFullUrl(input: string): string {
    // Only rewrite if the caller is explicitly targeting our API.
    // Leave Nuxt/Vite internal endpoints like /_nuxt/** untouched.
    if (input.startsWith('http')) return input
    if (input.startsWith('/api')) return (apiBase && isHttpApiBase) ? `${apiBase}${input}` : input
    return input
  }

  const baseFetch: any = (globalThis as any).$fetch

  const wrapped: any = async (input: string, opts: any = {}) => {
    const method = (opts.method || 'GET').toString().toUpperCase()
    const url = toFullUrl(input)
    const isApi = typeof input === 'string' && input.startsWith('/api')
    const online = (() => {
      try {
        return typeof navigator !== 'undefined' ? !!navigator.onLine : true
      }
      catch {
        return true
      }
    })()
    try {
      // In Tauri, avoid issuing non-http(s) requests when offline or apiBase isn't configured.
      if (isTauri && isApi && (!online || !isHttpApiBase)) {
        if (method === 'GET') {
          const cached = await invoke('get_cached', { key: toFullUrl(input) })
          if (cached) return cached
        }
        else {
          try {
            await invoke('queue_request', { method, path: toFullUrl(input), payload: opts?.body })
          }
          catch {}
          return { data: { queued: true } }
        }
        // Fall through to try network only if not in Tauri or we have a valid http base
        throw new Error('Offline and no cache available')
      }

      const res = await baseFetch(url, opts)
      if (isTauri && isApi && method === 'GET') {
        try {
          await invoke('set_cached', { key: url, value: res })
        }
        catch (e: any) {
          console.info('cache set failed', e)
        }
      }
      return res
    }
    catch (err) {
      // GET fallback to cache
      if (isTauri && isApi && method === 'GET') {
        try {
          const cached = await invoke('get_cached', { key: url })
          if (cached) return cached
        }
        catch (e: any) {
          console.info('cache get failed', e)
        }
      }
      // Mutations: queue and return a best-effort envelope
      if (isTauri && isApi && method !== 'GET') {
        try {
          await invoke('queue_request', { method, path: url, payload: opts?.body })
        }
        catch (e: any) {
          console.info('queue failed', e)
        }
        return { data: { queued: true } }
      }
      throw err
    }
  }

  ;(globalThis as any).$fetch = wrapped
  nuxtApp.provide('fetch', wrapped)
})

