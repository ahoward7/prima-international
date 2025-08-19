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

    const originalMid = machine.m_id

    const connection = MachineSchema.db || SoldSchema.db
    let result: any
    if (connection?.startSession) {
      const session = await connection.startSession()
      try {
        await session.withTransaction(async () => {
          result = await SoldSchema.create([soldMachine], { session })
          await MachineSchema.deleteOne({ m_id: originalMid }).session(session)
        })
      }
      finally {
        session.endSession()
      }
    }
    else {
      result = await SoldSchema.create(soldMachine)
      try {
        await MachineSchema.deleteOne({ m_id: originalMid })
      }
      catch (err) {
        try {
          await SoldSchema.deleteOne({ s_id: soldMachine.s_id })
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

    return created(event, payload, `/api/machines/${soldMachine.s_id}?location=sold`)
  }
  catch (e: any) {
    return problem(event, e?.statusCode || 500, 'Sell failed', e?.message || 'Unexpected error')
  }
})
