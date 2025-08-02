import type { H3Event } from 'h3'
import { getQuery } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  const filters = getQuery(event) as MachineFilterStrings
  const location = filters.location || 'located'

  if (location === 'archived') {
    return await getArchivedMachines(filters)
  }
  else {
    return await getActiveMachines(filters)
  }
})

async function getArchivedMachines(filters: MachineFilterStrings) {
  const { data: archives, total } = await buildQueryForSchema<ArchivedMachine>(
    ArchiveSchema,
    filters,
    {
      searchable: true,
      defaultSortField: 'model',
      fieldPrefix: 'machine.'
    }
  )

  const contactIds = extractContactIdsFromArchives(archives)
  const contactMap = await getContactMap(contactIds)

  const joinedData = archives.map(archive => ({
    ...archive,
    machine: {
      ...archive.machine,
      contact: contactMap.get(archive.machine?.contactId ?? '') || { company: '', name: '' }
    }
  }))

  return { data: joinedData, total }
}

async function getActiveMachines(filters: MachineFilterStrings) {
  const { data: machines, total } = await buildQueryForSchema<DBMachine>(
    MachineSchema,
    filters,
    {
      searchable: true,
      defaultSortField: 'model'
    }
  )

  const contactIds = extractContactIdsFromMachines(machines)
  const contactMap = await getContactMap(contactIds)

  const joinedData = machines.map(machine => ({
    ...machine,
    contact: contactMap.get(machine.contactId ?? '') || { company: '', name: '' }
  }))

  return { data: joinedData, total }
}

function extractContactIdsFromArchives(archives: ArchivedMachine[]) {
  return [...new Set(archives.map(a => a.machine?.contactId).filter(Boolean))]
}

function extractContactIdsFromMachines(machines: DBMachine[]) {
  return [...new Set(machines.map(m => m.contactId).filter(Boolean))]
}

async function getContactMap(contactIds: string[]) {
  const contacts = await ContactSchema.find({ c_id: { $in: contactIds } })
  return new Map(contacts.map(c => [c.c_id, c]))
}
