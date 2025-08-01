import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event): Promise<any> => {
  const { id } = getQuery(event)

  await MachineSchema.deleteOne({ m_id: id })

  return {
    success: true
  }
})
