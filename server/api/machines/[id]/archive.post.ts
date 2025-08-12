import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { ok, problem } from '~~/server/utils/api'
// ...removed zod validation import...

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) return problem(event, 400, 'Missing id', 'Machine id route param is required')

    const raw = await readBody<unknown>(event)
    const body = raw as { archiveDate?: string } | Machine
    const date = body && 'archiveDate' in (body as any) && (body as any).archiveDate
      ? (body as any).archiveDate
      : new Date().toISOString()

    // If full machine with contact was provided, update contact and use it; otherwise load from DB
    let contactChanged = false
    let machineCopy: any

    if ((body as any)?.contact) {
      const fullMachine = body as Machine
      const { contactId, contactChanged: changed } = await handleContactUpdateOrCreate(fullMachine.contact, date)
      contactChanged = changed
      machineCopy = { ...fullMachine, contactId, lastModDate: date }
    }
    else {
      const existing = await MachineSchema.findOne({ m_id: id }).lean()
      if (!existing) return problem(event, 404, 'Not found', 'Machine not found')
      machineCopy = { ...existing, lastModDate: date }
    }

    delete (machineCopy as any).contact
    delete (machineCopy as any).m_id

    const archive: ArchivedMachine = {
      a_id: generateRandom10DigitNumber(),
      machine: machineCopy as unknown as Omit<Machine, 'm_id'>,
      archiveDate: date
    }

    const result = await ArchiveSchema.create(archive)
    return ok(event, { success: true, contactUpdated: contactChanged, machineCreated: true, machine: result.toObject?.() ?? result })
  }
  catch (e: any) {
    return problem(event, e?.statusCode || 500, 'Archive failed', e?.message || 'Unexpected error')
  }
})
