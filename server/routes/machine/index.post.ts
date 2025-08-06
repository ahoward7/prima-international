import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const machine = await readBody(event)
    const date = new Date().toISOString()

    if (!machine || !machine.contact) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required machine or contact information'
      })
    }

    const { contactId, contactChanged } = await handleContactUpdateOrCreate(machine.contact, date)

    machine.m_id = generateRandom10DigitNumber()
    machine.contactId = contactId
    machine.createDate = date
    machine.lastModDate = date
    delete machine.contact

    const result = await MachineSchema.create(machine)

    return {
      success: true,
      contactUpdated: contactChanged,
      machineCreated: true,
      machine: result.toObject?.() ?? result
    }
  }
  catch (error: any) {
    return sendError(event, createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Server: Error creating machine',
      data: error.data || error.message || 'Server: Unexpected error'
    }))
  }
})
