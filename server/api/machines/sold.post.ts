import { defineEventHandler, readBody } from 'h3'
import { SoldSchema } from '~~/server/models/sold'
import { created, problem } from '~~/server/utils/api'
import { generateRandom10DigitNumber } from '~~/shared/utils/generateRandom10DigitNumber'
import { handleContactUpdateOrCreate } from '~~/shared/utils/handleContactUpdateOrCreate'

export default defineEventHandler(async (event) => {
  try {
    const raw = await readBody<unknown>(event)
    let machine: Machine | undefined
    let sold: Partial<Omit<SoldMachine, 'machine' | 's_id'>> | undefined
    if (typeof raw === 'object' && raw !== null && 'machine' in raw) {
      machine = (raw as { machine: Machine }).machine
      sold = (raw as { sold?: Partial<Omit<SoldMachine, 'machine' | 's_id'>> }).sold
    }
    else {
      machine = raw as Machine
    }
    if (!machine) return problem(event, 400, 'Invalid body', 'Machine object is required')
    if (!machine?.contact) return problem(event, 400, 'Invalid body', 'Machine contact is required')

    const date = sold?.dateSold || new Date().toISOString()

    const { contactId, contactChanged } = await handleContactUpdateOrCreate(machine.contact, date)

    const machineCopy: any = { ...machine, contactId, lastModDate: date }
    delete machineCopy.contact
    delete machineCopy.m_id

    const soldMachine: SoldMachine = {
      s_id: generateRandom10DigitNumber(),
      machine: machineCopy as Omit<Machine, 'm_id'>,
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
    const payload = {
      success: true,
      contactUpdated: contactChanged,
      machineCreated: true,
      machine: result.toObject?.() ?? result
    }

    return created(event, payload, `/api/machines/${soldMachine.s_id}?location=sold`)
  }
  catch (e: any) {
    return problem(event, e?.statusCode || 500, 'Sell failed', e?.message || 'Unexpected error')
  }
})
