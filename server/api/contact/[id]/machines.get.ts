export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) return problem(event, 400, 'Missing id', 'Contact id route param is required')

    const [located, archived, sold] = await Promise.all([
      MachineSchema.find({ contactId: id }).select('m_id').lean(),
      ArchiveSchema.find({ 'machine.contactId': id }).select('a_id').lean(),
      SoldSchema.find({ 'machine.contactId': id }).select('s_id').lean()
    ])

    return ok(event, {
      located: located.map(m => m.m_id),
      archived: archived.map(a => a.a_id),
      sold: sold.map(s => s.s_id)
    } as MachineLocations)
  }
  catch (error: any) {
    return problem(event, error?.statusCode || 500, 'Server: Error fetching contact machines', error?.message || 'Server: Unexpected error')
  }
})
