import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { ok, problem } from '~~/server/utils/api'
import { SoldBodySchema, zodProblem } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) return problem(event, 400, 'Missing id', 'Machine id route param is required')

    const raw = await readBody<unknown>(event)
    const parsed = SoldBodySchema.safeParse(raw)
    if (!parsed.success) return zodProblem(event, parsed.error)
    const input = parsed.data as { machine: Machine, sold: Partial<DBSoldMachine> }
    const date = new Date().toISOString()

    const machine = input?.machine
    const sold = input?.sold
    if (!machine || !machine.contact) return problem(event, 400, 'Invalid body', 'Missing required machine or contact information')

    const { contactId, contactChanged } = await handleContactUpdateOrCreate(machine.contact, date)

    const machineCopy = { ...machine }
    machineCopy.contactId = contactId
    machineCopy.lastModDate = date
    delete (machineCopy as any).contact
    delete (machineCopy as any).m_id

    const soldMachine: SoldMachine = {
      s_id: generateRandom10DigitNumber(),
      machine: machineCopy as unknown as Omit<Machine, 'm_id'>,
      dateSold: date,
      truckingCompany: sold?.truckingCompany,
      buyer: sold?.buyer,
      buyerLocation: sold?.buyerLocation,
      purchaseFob: sold?.purchaseFob,
      machineCost: sold?.machineCost as number,
      freightCost: sold?.freightCost as number,
      paintCost: sold?.paintCost as number,
      otherCost: sold?.otherCost as number,
      profit: sold?.profit as number,
      totalCost: sold?.totalCost as number,
      notes: sold?.notes as string
    }

    const result = await SoldSchema.create(soldMachine)
    return ok(event, { success: true, contactUpdated: contactChanged, machineCreated: true, machine: result.toObject?.() ?? result })
  }
  catch (e: any) {
    return problem(event, e?.statusCode || 500, 'Sell failed', e?.message || 'Unexpected error')
  }
})
