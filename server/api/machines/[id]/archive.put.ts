import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { ok, problem } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) return problem(event, 400, 'Missing id', 'Machine id route param is required')

    const body = await readBody<any>(event)
    if (!body) return problem(event, 400, 'Invalid body', 'Request body is required')

    const date = new Date().toISOString()
    const archive = body as ArchivedMachine
    if (!archive?.machine?.contact?.c_id) return problem(event, 400, 'Invalid body', 'Archived machine contact is required')

    const { contactId, contactChanged } = await handleContactUpdateOrCreate(archive.machine.contact, date)
    archive.machine.contactId = contactId
    archive.machine.lastModDate = date

    const toPut = { ...archive } as ArchivedMachineToPut
    // remove nested contact for storage
    delete (toPut as any).machine.contact

    await ArchiveSchema.updateOne({ a_id: toPut.a_id || id }, { $set: toPut })
    const updated = await ArchiveSchema.findOne({ a_id: toPut.a_id || id }).lean()
    return ok(event, { success: true, contactUpdated: contactChanged, machineUpdated: true, machine: updated })
  } catch (e: any) {
    return problem(event, e?.statusCode || 500, 'Archive update failed', e?.message || 'Unexpected error')
  }
})
