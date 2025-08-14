import type { MachineFilters, MachineLocationString } from '~~/shared/types/machine'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { generateRandom10DigitNumber } from '~~/shared/utils/generateRandom10DigitNumber'

type PendingKey = `${MachineLocationString}:${string}`

export interface PendingCreateItem {
  id: string // temp id e.g., tmp-*
  location: MachineLocationString
  item: any // Machine | ArchivedMachine | SoldMachine
}

export interface PendingUpdateItem {
  key: PendingKey
  patch: any
}

export const useOfflineStore = defineStore('offline', () => {
  const creates = ref<PendingCreateItem[]>([])
  const updates = ref<PendingUpdateItem[]>([])
  const deletes = ref<Set<PendingKey>>(new Set())

  function makeKey(location: MachineLocationString, id: string): PendingKey {
    return `${location}:${id}`
  }

  function addCreate(location: MachineLocationString, item: any) {
    const id = (item?.m_id || item?.a_id || item?.s_id || `tmp-${generateRandom10DigitNumber()}`) as string
    if (!id) return
    // ensure no conflicting delete
    deletes.value.delete(makeKey(location, id))
    // ensure item carries the id for list reconciliation
    if (location === 'located') item.m_id = id
    if (location === 'archived') item.a_id = id
    if (location === 'sold') item.s_id = id
    creates.value.push({ id, location, item })
  }

  function addUpdate(location: MachineLocationString, id: string, patch: any) {
    deletes.value.delete(makeKey(location, id))
    const key = makeKey(location, id)
    const idx = updates.value.findIndex(u => u.key === key)
    if (idx >= 0) updates.value[idx] = { key, patch: { ...updates.value[idx]!.patch, ...patch } }
    else updates.value.push({ key, patch })
  }

  function addDelete(location: MachineLocationString, id: string) {
    const key = makeKey(location, id)
    // remove any pending create for same id
    creates.value = creates.value.filter(c => !(c.location === location && c.id === id))
    // remove any pending update
    updates.value = updates.value.filter(u => u.key !== key)
    deletes.value.add(key)
  }

  function clearAll() {
    creates.value = []
    updates.value = []
    deletes.value = new Set()
  }

  function applyOverlay(base: any, location: MachineLocationString, filters?: Partial<MachineFilters>): any[] {
    // Remove deleted
    const removed = new Set(
      Array.from(deletes.value)
        .map(k => String(k))
        .filter(k => k.startsWith(`${location}:`))
        .map(k => k.split(':')[1])
    )
    const list: any[] = Array.isArray(base) ? base : []
    let out = list.filter((it: any) => {
      const id = (it?.m_id || it?.a_id || it?.s_id) as string | undefined
      return id ? !removed.has(id) : true
    })

    // Apply updates
    const updForLoc = updates.value.filter(u => u.key.startsWith(`${location}:`))
    if (updForLoc.length) {
      const byId = new Map<string, any>()
      out.forEach((it: any) => {
        const id = (it?.m_id || it?.a_id || it?.s_id) as string | undefined
        if (id) byId.set(id, it)
      })
      for (const u of updForLoc) {
        const id = u.key.split(':')[1] as string
        const existing = byId.get(id)
        if (existing) byId.set(id, { ...existing, ...u.patch })
      }
      out = Array.from(byId.values())
    }

    // Append creates for this location
    const createsForLoc = creates.value.filter(c => c.location === location).map(c => c.item)

    // Optional: crude filter matching for client-only creates
    if (filters) {
      const search = (filters.search || '').toLowerCase()
      const model = (filters.model || '').toLowerCase()
      const type = (filters.type || '').toLowerCase()
      const contactId = filters.contactId || ''
      out = out.concat(
        createsForLoc.filter((it: any) => {
          const m = (location === 'located') ? it : it.machine
          const txt = `${m?.type || ''} ${m?.model || ''} ${m?.serialNumber || ''}`.toLowerCase()
          const okSearch = !search || txt.includes(search)
          const okModel = !model || (m?.model || '').toLowerCase().includes(model)
          const okType = !type || (m?.type || '').toLowerCase().includes(type)
          const okContact = !contactId || (m?.contactId || '') === contactId
          return okSearch && okModel && okType && okContact
        })
      )
    }
    else {
      out = out.concat(createsForLoc)
    }

    return out
  }

  return { creates, updates, deletes, addCreate, addUpdate, addDelete, clearAll, applyOverlay }
})
