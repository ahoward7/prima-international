export default defineEventHandler(async (event): Promise<Machine | null> => {
  const { id } = event.context.params as { id: string }

  const machine: DBMachine | null = await MachineSchema.findOne({ m_id: id}).lean()

  if (machine) {
    const contact = await ContactSchema.findOne({ c_id: machine.contactId })

    const joinedMachine: Machine = {
      ...machine,
      contact: contact || {company: '', name: ''},
    } as Machine

    return joinedMachine
  }

  return null
})