import { invoke } from '@tauri-apps/api/core'

export async function dbSyncAll() {
  // Clear and store fresh snapshots into SQLite tables via Tauri
  const cats = ['located', 'archived', 'sold', 'contacts'] as const
  for (const c of cats) {
    try {
      await invoke('clear_snapshot', { category: c })
    }
    catch {
      // ignore
    }
  }
  // Machines
  const fetchAll = async <T>(path: string, query: Record<string, any> = {}, pageSize = 500): Promise<T[]> => {
    let page = 1
    const out: T[] = []
    while (true) {
      const res = await $fetch<FetchResponse<ApiData<T>>>(path, { query: { ...query, page, pageSize } })
      const data = res?.data?.data || []
      out.push(...data)
      const total = res?.data?.total ?? data.length
      if (out.length >= total || data.length === 0) break
      page++
    }
    return out
  }
  const [located, archived, sold] = await Promise.all([
    fetchAll<Machine>('/api/machines', { location: 'located' }),
    fetchAll<ArchivedMachine>('/api/machines', { location: 'archived' }),
    fetchAll<SoldMachine>('/api/machines', { location: 'sold' })
  ])
  await invoke('upsert_snapshot', { category: 'located', items: located })
  await invoke('upsert_snapshot', { category: 'archived', items: archived })
  await invoke('upsert_snapshot', { category: 'sold', items: sold })

  // Contacts
  const contacts = await fetchAll<Contact>('/api/contact', {})
  await invoke('upsert_snapshot', { category: 'contacts', items: contacts })
}

export async function dbQueryMachines(filters: MachineFilters): Promise<ApiData<Machine | ArchivedMachine | SoldMachine>> {
  const { location, search, model, type, contactId, sortBy, page = 1, pageSize = 50 } = filters as any
  const [list, total] = await invoke<[any[], number]>('query_machines', {
    location,
    search: search || null,
    model: model || null,
    mtype: type || null,
    contactId: contactId || null,
    sortBy: sortBy || null,
    page,
    pageSize
  })
  return { data: list as any[], total }
}

export async function dbGetMachineDetail(id: string, location: MachineLocationString): Promise<any | null> {
  const v = await invoke<any | null>('get_machine_detail', { id, location })
  if (!v) return null
  return location === 'located' ? v : v.machine
}

export async function dbQueryContacts(q: { search?: string; pageSize?: number }): Promise<ApiData<Contact>> {
  const list = await invoke<any[]>('query_contacts', { search: q.search || null, pageSize: q.pageSize || 50 })
  return { data: list as Contact[], total: list.length }
}
