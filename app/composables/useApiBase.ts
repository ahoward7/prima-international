export function useApiBase() {
  const { $getApiBase } = useNuxtApp()
  const base = computed(() => (typeof $getApiBase === 'function' ? ($getApiBase as () => string)() : '/'))
  const url = (path: string) => {
    const b = base.value
    if (b === '/' || path.startsWith('http')) return path
    // ensure single slash
    return new URL(path.replace(/^\//, ''), b).toString()
  }
  return { base, url }
}
