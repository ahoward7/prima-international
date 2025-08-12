import { defineEventHandler, readBody } from 'h3'
import { created, problem } from '~~/server/utils/api'
// ...removed zod validation import...

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<unknown>(event)
    const machine = body as MachineForm

    const date = new Date().toISOString()
    const { contactId, contactChanged } = await handleContactUpdateOrCreate(machine.contact, date)

    const { contact, ...machineRest } = machine
    const toCreate: DBMachine = {
      ...machineRest,
      salesman: machineRest.salesman ?? '',
      m_id: generateRandom10DigitNumber(),
      contactId,
      createDate: date,
      lastModDate: date
    }

    const result = await MachineSchema.create(toCreate)
    const payload = {
      success: true,
      contactUpdated: contactChanged,
      machineCreated: true,
      machine: result.toObject?.() ?? result
    }

    return created(event, payload, `/api/machines/${toCreate.m_id}`)
  }
  catch (e: any) {
    return problem(event, e?.statusCode || 500, 'Create failed', e?.message || 'Unexpected error')
  }
})
