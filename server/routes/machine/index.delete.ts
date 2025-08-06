import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event): Promise<any> => {
  const { id, location } = getQuery(event)

  try {
    if (location === 'located') {
      await MachineSchema.deleteOne({ m_id: id })
    }
    else if (location === 'archived') {
      await ArchiveSchema.deleteOne({ a_id: id })
    }
    else if (location === 'sold') {
      await SoldSchema.deleteOne({ s_id: id })
    }
  }
  catch (error: any) {
    return sendError(event, createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Server: Error deleting machine',
      data: error.data || error.message || 'Server: Unexpected error'
    }))
  }

  return {
    success: true
  }
})
