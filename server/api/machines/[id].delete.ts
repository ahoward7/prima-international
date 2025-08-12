import { defineEventHandler, getQuery, getRouterParam, setResponseStatus } from 'h3'
import { problem } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) return problem(event, 400, 'Missing id', 'Machine id route param is required')

    const { location } = getQuery(event)
    if (location === 'located') {
      await MachineSchema.deleteOne({ m_id: id })
    }
    else if (location === 'archived') {
      await ArchiveSchema.deleteOne({ a_id: id })
    }
    else if (location === 'sold') {
      await SoldSchema.deleteOne({ s_id: id })
    }

    setResponseStatus(event, 204)
    return null
  }
  catch (e: any) {
    return problem(event, e?.statusCode || 500, 'Delete failed', e?.message || 'Unexpected error')
  }
})
