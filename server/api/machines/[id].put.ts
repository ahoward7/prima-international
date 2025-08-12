import { defineEventHandler, getQuery, getRouterParam, readBody } from 'h3'
import { ArchiveSchema } from '~~/server/models/archive'
import { MachineSchema } from '~~/server/models/machine'
import { SoldSchema } from '~~/server/models/sold'
import { ok, problem } from '~~/server/utils/api'
import { handleContactUpdateOrCreate } from '~~/shared/utils/handleContactUpdateOrCreate'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) return problem(event, 400, 'Missing id', 'Machine id route param is required')

    const body = await readBody<any>(event)
    if (!body) return problem(event, 400, 'Invalid body', 'Request body is required')

    const { location } = getQuery(event)
    const date = new Date().toISOString()

    if (location === 'located') {
      const locatedMachine = body as MachineForm
      if (!locatedMachine?.m_id && !id) return problem(event, 400, 'Invalid body', 'm_id is required')
      const { contactId, contactChanged } = await handleContactUpdateOrCreate(locatedMachine.contact, date)
      locatedMachine.contactId = contactId
      locatedMachine.lastModDate = date
      const toPut = { ...locatedMachine } as MachineToPut
      delete (toPut as any).contact
      await MachineSchema.updateOne({ m_id: id }, { $set: toPut })
      const updated = await MachineSchema.findOne({ m_id: id }).lean()
      return ok(event, { success: true, contactUpdated: contactChanged, machineUpdated: true, machine: updated })
    }

    if (location === 'archived') {
      const archive = body as ArchivedMachine
      if (!archive?.machine?.contact?.c_id) return problem(event, 400, 'Invalid body', 'Archived machine contact is required')
      const { contactId, contactChanged } = await handleContactUpdateOrCreate(archive.machine.contact, date)
      archive.machine.contactId = contactId
      archive.machine.lastModDate = date
      const toPut = { ...archive } as ArchivedMachineToPut
      delete (toPut as any).machine.contact
      await ArchiveSchema.updateOne({ a_id: (toPut as any).a_id || id }, { $set: toPut })
      const updated = await ArchiveSchema.findOne({ a_id: (toPut as any).a_id || id }).lean()
      return ok(event, { success: true, contactUpdated: contactChanged, machineUpdated: true, machine: updated })
    }

    // default to sold
    const sold = body as SoldMachine
    if (!sold?.machine?.contact?.c_id) return problem(event, 400, 'Invalid body', 'Sold machine contact is required')
    const { contactId, contactChanged } = await handleContactUpdateOrCreate(sold.machine.contact, date)
    sold.machine.contactId = contactId
    sold.machine.lastModDate = date
    const toPut = { ...sold } as SoldMachineToPut
    delete (toPut as any).machine.contact
    await SoldSchema.updateOne({ s_id: (toPut as any).s_id || id }, { $set: toPut })
    const updated = await SoldSchema.findOne({ s_id: (toPut as any).s_id || id }).lean()
    return ok(event, { success: true, contactUpdated: contactChanged, machineUpdated: true, machine: updated })
  }
  catch (e: any) {
    return problem(event, e?.statusCode || 500, 'Update failed', e?.message || 'Unexpected error')
  }
})
