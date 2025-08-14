import { invoke } from '@tauri-apps/api/core'

type AnyMachine = Machine | ArchivedMachine | SoldMachine

const SNAP_KEYS = {
  located: 'snapshot:machines:located',
  archived: 'snapshot:machines:archived',
  sold: 'snapshot:machines:sold',
  contacts: 'snapshot:contacts',
  filters: 'snapshot:filters'
}

async function getSnap<T = any>(key: string): Promise<T | null> {
  try {
    return await invoke<T | null>('get_cached', { key })
  }
  catch {
    return null
  }
}

async function setSnap<T = any>(key: string, value: T): Promise<void> {
  try {
    await invoke('set_cached', { key, value })
  }
  catch {
    // noop
  }
}

async function fetchAllPages<T>(path: string, query: Record<string, any> = {}, pageSize = 100): Promise<T[]> {
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

export async function syncAllSnapshots(): Promise<void> {
  // Fetch all three machine sets
  const [located, archived, sold] = await Promise.all([
    fetchAllPages<Machine>('/api/machines', { location: 'located' }),
    fetchAllPages<ArchivedMachine>('/api/machines', { location: 'archived' }),
    fetchAllPages<SoldMachine>('/api/machines', { location: 'sold' })
  ])
  await setSnap(SNAP_KEYS.located, located)
  await setSnap(SNAP_KEYS.archived, archived)
  await setSnap(SNAP_KEYS.sold, sold)

  // Contacts (optional bulk; can be many - page across)
  const contacts = await fetchAllPages<Contact>('/api/contact', {})
  await setSnap(SNAP_KEYS.contacts, contacts)

  // Filters snapshot (or compute later)
  const filters = await $fetch<FetchResponse<FilterOptions>>('/api/machines/filters').catch(() => null)
  if (filters?.data) await setSnap(SNAP_KEYS.filters, filters.data)
}

function normalizeText(...parts: (string | undefined)[]) {
  return parts.filter(Boolean).join(' ').toLowerCase()
}

function applyClientFilters(list: AnyMachine[], filters: MachineFilters): AnyMachine[] {
  const location = (filters.location || 'located') as MachineLocationString
  const search = (filters.search || '').toLowerCase()
  const model = (filters.model || '').toLowerCase()
  const type = (filters.type || '').toLowerCase()
  const contactId = filters.contactId || ''

  return list.filter((item: any) => {
    const m = location === 'located' ? item : item?.machine
    const txt = normalizeText(m?.type, m?.model, m?.serialNumber)
    const okSearch = !search || txt.includes(search)
    const okModel = !model || (m?.model || '').toLowerCase().includes(model)
    const okType = !type || (m?.type || '').toLowerCase().includes(type)
    const okContact = !contactId || (m?.contactId || '') === contactId
    return okSearch && okModel && okType && okContact
  })
}

function applySort(list: AnyMachine[], sortBy?: string): AnyMachine[] {
  if (!sortBy) sortBy = 'model'
  const desc = sortBy.startsWith('-')
  const key = sortBy.replace(/^-/, '')
  const get = (it: any) => {
    const m = it?.machine ? it.machine : it
    return m?.[key as any]
  }
  return [...list].sort((a, b) => {
    const av = get(a)
    const bv = get(b)
    if (av == null && bv == null) return 0
    if (av == null) return desc ? 1 : -1
    if (bv == null) return desc ? -1 : 1
    if (av < bv) return desc ? 1 : -1
    if (av > bv) return desc ? -1 : 1
    return 0
  })
}

export async function localQueryMachines(filters: MachineFilters): Promise<ApiData<AnyMachine>> {
  const location = (filters.location || 'located') as MachineLocationString
  const key = SNAP_KEYS[location]
  const list = (await getSnap<AnyMachine[]>(key)) || []
  const filtered = applyClientFilters(list, filters)
  const sorted = applySort(filtered, filters.sortBy)
  const pageSize = filters.pageSize || 20
  const page = filters.page || 1
  const start = (page - 1) * pageSize
  const data = sorted.slice(start, start + pageSize)
  return { data, total: filtered.length }
}

export async function localGetMachineDetail(id: string, location: MachineLocationString): Promise<AnyMachine | null> {
  const key = SNAP_KEYS[location]
  const list = (await getSnap<AnyMachine[]>(key)) || []
  const idKey = location === 'located' ? 'm_id' : (location === 'archived' ? 'a_id' : 's_id')
  return (list.find((it: any) => String(it?.[idKey]) === String(id)) as AnyMachine) || null
}

export async function localGetFilters(): Promise<FilterOptions> {
  const fromSnap = await getSnap<FilterOptions>(SNAP_KEYS.filters)
  if (fromSnap) return fromSnap
  // derive from snapshots
  const located = (await getSnap<Machine[]>(SNAP_KEYS.located)) || []
  const archived = (await getSnap<ArchivedMachine[]>(SNAP_KEYS.archived)) || []
  const sold = (await getSnap<SoldMachine[]>(SNAP_KEYS.sold)) || []
  const toSet = (vals: string[]) => Array.from(new Set(vals.filter(Boolean))).sort().map(v => ({ label: v, data: v }))
  const getModel = (m: any) => (m?.machine ? m.machine.model : m.model) || ''
  const getType = (m: any) => (m?.machine ? m.machine.type : m.type) || ''
  const getSales = (m: any) => (m?.machine ? m.machine.salesman : m.salesman) || ''
  return {
    model: toSet([...located.map(getModel), ...archived.map(getModel), ...sold.map(getModel)]),
    type: toSet([...located.map(getType), ...archived.map(getType), ...sold.map(getType)]),
    salesman: toSet([...located.map(getSales), ...archived.map(getSales), ...sold.map(getSales)])
  }
}

export async function localGetLocationsBySerial(serialNumber?: string): Promise<MachineLocations> {
  const res: MachineLocations = { located: [], archived: [], sold: [] }
  if (!serialNumber) return res
  const [located, archived, sold] = await Promise.all([
    getSnap<Machine[]>(SNAP_KEYS.located),
    getSnap<ArchivedMachine[]>(SNAP_KEYS.archived),
    getSnap<SoldMachine[]>(SNAP_KEYS.sold)
  ])
  for (const m of located || []) if (m?.serialNumber === serialNumber) res.located.push(m.m_id)
  for (const a of archived || []) if (a?.machine?.serialNumber === serialNumber) res.archived.push(a.a_id)
  for (const s of sold || []) if (s?.machine?.serialNumber === serialNumber) res.sold.push(s.s_id)
  return res
}

export async function localQueryContacts(q: { search?: string; pageSize?: number }): Promise<ApiData<Contact>> {
  const list = (await getSnap<Contact[]>(SNAP_KEYS.contacts)) || []
  const term = (q.search || '').toLowerCase()
  const filtered = !term
    ? list
    : list.filter(c => `${(c.name || '').toLowerCase()} ${(c.company || '').toLowerCase()}`.includes(term))
  const pageSize = q.pageSize || 50
  return { data: filtered.slice(0, pageSize), total: filtered.length }
}
