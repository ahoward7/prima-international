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

    // try to create archive and delete original machine atomically when possible
    const originalMid = machine.m_id

    const connection = MachineSchema.db || ArchiveSchema.db
    let result: any
    if (connection?.startSession) {
      const session = await connection.startSession()
      try {
        await session.withTransaction(async () => {
          result = await ArchiveSchema.create([archive], { session })
          await MachineSchema.deleteOne({ m_id: originalMid }).session(session)
        })
      }
      finally {
        session.endSession()
      }
    }
    else {
      result = await ArchiveSchema.create(archive)
      try {
        await MachineSchema.deleteOne({ m_id: originalMid })
      }
      catch (err) {
        try {
          await ArchiveSchema.deleteOne({ a_id: archive.a_id })
        }
        catch {
          /* noop */
        }
        throw err
      }
    }

    const payload = {
      success: true,
      contactUpdated: contactChanged,
      machineCreated: true,
      machine: Array.isArray(result) ? (result[0].toObject?.() ?? result[0]) : (result.toObject?.() ?? result)
    }

    return created(event, payload, `/api/machines/${archive.a_id}?location=archived`)
  }
  catch (e: any) {
    return problem(event, e?.statusCode || 500, 'Archive failed', e?.message || 'Unexpected error')
  }
})
