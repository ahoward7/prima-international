import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event): Promise<Machine[]> => {
  const { location, search, pageSize, sortBy, model, type } = getQuery(event)

  const machines = await MachineSchema.find({})

  return machines
})