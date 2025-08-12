export default defineEventHandler(async (event) => {
  try {
    const raw = await readBody<unknown>(event)
    let machine: Machine | undefined
    let archiveDate: string | undefined
    if (typeof raw === 'object' && raw !== null && 'machine' in raw) {
      machine = (raw as { machine: Machine }).machine
      archiveDate = (raw as { archiveDate?: string }).archiveDate
    }
    else {
      machine = raw as Machine
    }
    if (!machine) return problem(event, 400, 'Invalid body', 'Machine object is required')
    if (!machine?.contact) return problem(event, 400, 'Invalid body', 'Machine contact is required')

    const date = archiveDate || new Date().toISOString()

    const { contactId, contactChanged } = await handleContactUpdateOrCreate(machine.contact, date)

    const machineCopy: any = { ...machine, contactId, lastModDate: date }
    delete machineCopy.contact
    delete machineCopy.m_id

    const archive: ArchivedMachine = {
      a_id: generateRandom10DigitNumber(),
      machine: machineCopy as unknown as Omit<Machine, 'm_id'>,
      archiveDate: date
    }

    const result = await ArchiveSchema.create(archive)
    const payload = {
      success: true,
      contactUpdated: contactChanged,
      machineCreated: true,
      machine: result.toObject?.() ?? result
    }

    return created(event, payload, `/api/machines/${archive.a_id}?location=archived`)
  }
  catch (e: any) {
    return problem(event, e?.statusCode || 500, 'Archive failed', e?.message || 'Unexpected error')
  }
})
