import { defineEventHandler, readBody } from 'h3'
import { created, problem } from '~~/server/utils/api'
import { MachineCreateSchema, zodProblem } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<unknown>(event)
    const parsed = MachineCreateSchema.safeParse(body)
    if (!parsed.success) return zodProblem(event, parsed.error)
    const machine = parsed.data as MachineForm

    const date = new Date().toISOString()
    const { contactId, contactChanged } = await handleContactUpdateOrCreate(machine.contact, date)

    const toCreate: DBMachine = {
      ...machine,
      m_id: generateRandom10DigitNumber(),
      contactId,
      createDate: date,
      lastModDate: date
    } as unknown as DBMachine
    delete (toCreate as any).contact

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
