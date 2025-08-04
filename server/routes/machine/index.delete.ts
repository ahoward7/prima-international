import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event): Promise<any> => {
  const { id, location } = getQuery(event)

  if (location === 'located') {
    await MachineSchema.deleteOne({ m_id: id })
  }
  else if (location === 'archived') {
    await ArchiveSchema.deleteOne({ a_id: id })
  }

  return {
    success: true
  }
})
