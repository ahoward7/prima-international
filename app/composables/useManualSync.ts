export function useManualSync() {
  const syncing = ref(false)
  const lastResult = ref<any>(null)

  async function syncNow(mongoUriOverride?: string) {
    syncing.value = true
    try {
      const offlineBase = 'http://127.0.0.1:27271'
      const res = await $fetch<{ ok: boolean; counts?: any; error?: string }>(`${offlineBase}/api/sync`, {
        method: 'POST',
        query: mongoUriOverride ? { mongo_uri: mongoUriOverride } : undefined
      })
      lastResult.value = res
      return res
    }
    catch (e: any) {
      lastResult.value = { ok: false, error: e?.message || 'Sync failed' }
      return lastResult.value
    }
    finally {
      syncing.value = false
    }
  }

  return { syncing, lastResult, syncNow }
}
