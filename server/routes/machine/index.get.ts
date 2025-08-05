import type { H3Event } from 'h3'
import { getQuery } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  const filters = getQuery(event) as MachineFilterStrings
  const location = filters.location || 'located'

  if (location === 'archived') {
    return await getArchivedMachines(filters)
  }
  else if (location === 'located') {
    return await getLocatedMachines(filters)
  }
  return await getSoldMachines(filters)
})

async function getArchivedMachines(filters: MachineFilterStrings) {
  const queryOptions = {
    searchable: true,
    defaultSortField: 'model',
    fieldPrefix: 'machine.'
  }

  const { data: archives, total } = await buildQueryForSchema<ArchivedMachine>( ArchiveSchema, filters, queryOptions )

  const contactIds = extractContactIdsFromArchivesOrSold(archives)
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

async function getSoldMachines(filters: MachineFilterStrings) {
  const queryOptions = {
    searchable: true,
    defaultSortField: 'model',
    fieldPrefix: 'machine.'
  }

  const { data: soldMachines, total } = await buildQueryForSchema<SoldMachine>( SoldSchema, filters, queryOptions )

  const contactIds = extractContactIdsFromArchivesOrSold(soldMachines)
  const contactMap = await getContactMap(contactIds)

  const joinedData = soldMachines.map(soldMachine => ({
    ...soldMachine,
    machine: {
      ...soldMachine.machine,
      contact: contactMap.get(soldMachine.machine?.contactId ?? '') || { company: '', name: '' }
    }
  }))

  return { data: joinedData, total }
}

async function getLocatedMachines(filters: MachineFilterStrings) {
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

function extractContactIdsFromArchivesOrSold(archives: ArchivedMachine[] | SoldMachine[]) {
  return [...new Set(archives.map(a => a.machine?.contactId).filter(Boolean))]
}

function extractContactIdsFromMachines(machines: DBMachine[]) {
  return [...new Set(machines.map(m => m.contactId).filter(Boolean))]
}

async function getContactMap(contactIds: string[]) {
  const contacts = await ContactSchema.find({ c_id: { $in: contactIds } })
  return new Map(contacts.map(c => [c.c_id, c]))
}
