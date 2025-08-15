export function useApiBase() {
  const { $getApiBase } = useNuxtApp()
  const base = computed(() => (typeof $getApiBase === 'function' ? ($getApiBase as () => string)() : '/'))
  const url = (path: string) => {
    const b = base.value
    if (b === '/' || path.startsWith('http')) return path
    // ensure single slash
    const finalUrl = new URL(path.replace(/^\//, ''), b).toString()
    console.info('🔗 API URL generated:', { path, base: b, finalUrl })
    return finalUrl
  }
  return { base, url }
}
