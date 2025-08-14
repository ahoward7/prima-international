import { invoke } from '@tauri-apps/api/core'

export default defineNuxtPlugin((nuxtApp) => {
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window
  const config = useRuntimeConfig()
  const apiBase = ((config.public as any)?.apiBase as string) || ''

  function toFullUrl(input: string): string {
    // Only rewrite if the caller is explicitly targeting our API.
    // Leave Nuxt/Vite internal endpoints like /_nuxt/** untouched.
    if (input.startsWith('http')) return input
    if (input.startsWith('/api')) return apiBase ? `${apiBase}${input}` : input
    return input
  }

  const baseFetch: any = (globalThis as any).$fetch

  const wrapped: any = async (input: string, opts: any = {}) => {
    const method = (opts.method || 'GET').toString().toUpperCase()
    const url = toFullUrl(input)
    const isApi = typeof input === 'string' && input.startsWith('/api')
    try {
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

