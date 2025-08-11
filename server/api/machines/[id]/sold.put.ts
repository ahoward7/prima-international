import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { ok, problem } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) return problem(event, 400, 'Missing id', 'Machine id route param is required')

    const body = await readBody<any>(event)
    if (!body) return problem(event, 400, 'Invalid body', 'Request body is required')

    const date = new Date().toISOString()
    const sold = body as SoldMachine
    if (!sold?.machine?.contact?.c_id) return problem(event, 400, 'Invalid body', 'Sold machine contact is required')

    const { contactId, contactChanged } = await handleContactUpdateOrCreate(sold.machine.contact, date)
    sold.machine.contactId = contactId
    sold.machine.lastModDate = date
    const toPut = { ...sold } as SoldMachineToPut
    delete (toPut as any).machine.contact

    await SoldSchema.updateOne({ s_id: toPut.s_id || id }, { $set: toPut })
    const updated = await SoldSchema.findOne({ s_id: toPut.s_id || id }).lean()
    return ok(event, { success: true, contactUpdated: contactChanged, machineUpdated: true, machine: updated })
  } catch (e: any) {
    return problem(event, e?.statusCode || 500, 'Sold update failed', e?.message || 'Unexpected error')
  }
})
