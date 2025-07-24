import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event): Promise<number> => {
  return await MachineSchema.countDocuments()
})
