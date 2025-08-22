export default defineEventHandler(async (event) => {
  const filters = getQuery(event) as MachineFilterStrings
  const location = (filters.location || 'located') as MachineLocationString

  let effectiveFilters = filters
  if (filters.id) {
    // If filters.id is set, ignore all other filters and only use the relevant ID filter
    const id = filters.id
    if (location === 'archived') {
      effectiveFilters = { a_id: id } as MachineFilterStrings
    }
    else if (location === 'sold') {
      effectiveFilters = { s_id: id } as MachineFilterStrings
    }
    else {
      effectiveFilters = { m_id: id } as MachineFilterStrings
    }
  }

  try {
    if (location === 'archived') {
      return ok(event, await getArchivedMachines(effectiveFilters))
    }
    if (location === 'located') {
      return ok(event, await getLocatedMachines(effectiveFilters))
    }
    return ok(event, await getSoldMachines(effectiveFilters))
  }
  catch (error: any) {
    return problem(event, error?.statusCode || 500, 'Server: Error getting machine', error?.message || 'Server: Unexpected error')
  }
})

async function getArchivedMachines(filters: MachineFilterStrings) {
  const queryOptions = {
    searchable: true,
    defaultSortField: 'model',
    fieldPrefix: filters.a_id ? '' : 'machine.'
  }

  const { data: archives, total } = await buildQueryForSchema<ArchivedMachine>(ArchiveSchema, filters, queryOptions)

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
    fieldPrefix: filters.s_id ? '' : 'machine.'
  }

  const { data: soldMachines, total } = await buildQueryForSchema<SoldMachine>(SoldSchema, filters, queryOptions)

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
  const queryOptions = {
    searchable: true,
    defaultSortField: 'model',
    fieldPrefix: filters.m_id ? '' : undefined
  }
  const { data: machines, total } = await buildQueryForSchema<DBMachine>(
    MachineSchema,
    filters,
    queryOptions
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
