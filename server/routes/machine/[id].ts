export default defineEventHandler(async (event): Promise<Machine | ArchivedMachine | SoldMachine | null> => {
  const { id } = event.context.params as { id: string }
  const { location } = getQuery(event)

  const fetchFunction = getFetchFunction(location as string)

  return await fetchFunction(id)
})

function getFetchFunction(location: string): Function {
  if (location === 'located') { return getLocatedMachine }
  if (location === 'archvied') { return getArchivedMachine }
  return getSoldMachine
}

async function getLocatedMachine(id: string): Promise<Machine | null> {
  const machine = await MachineSchema.findOne({ m_id: id }).lean()
  if (!machine) return null

  const contact = await ContactSchema.findOne({ c_id: machine.contactId }) || { company: '', name: '' }

  return {
    ...machine,
    contact,
  } as Machine
}

async function getArchivedMachine(id: string): Promise<ArchivedMachine | null> {
  const archived = await ArchiveSchema.findOne({ a_id: id }).lean()
  if (!archived) return null

  const contactId = archived.machine?.contactId
  const contact = await ContactSchema.findOne({ c_id: contactId }) || { company: '', name: '' }

  return {
    ...archived,
    machine: {
      ...archived.machine,
      contact
    }
  } as ArchivedMachine
}

async function getSoldMachine(id: string): Promise<SoldMachine | null> {
  return null
}
