export default defineEventHandler(async (event): Promise<Machine | null> => {
  const { id } = event.context.params as { id: string }
  const { location } = getQuery(event)
  
  const schema = location === 'located' ? MachineSchema : ArchiveSchema
  
  // Use different field names based on location
  const searchField = location === 'located' ? 'm_id' : 'a_id'
  const machine: DBMachine | ArchivedMachine | null = await schema.findOne({ [searchField]: id }).lean()

  const contactId = location === 'located' ? machine?.contactId || {} : machine?.machine?.contactId || {}
  
  if (machine) {
    const contact = await ContactSchema.findOne({ c_id: contactId })
    const joinedMachine: Machine = {
      ...machine,
      contact: contact || { company: '', name: '' },
    } as Machine
    return joinedMachine
  }
  
  return null
})