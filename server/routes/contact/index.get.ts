import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event): Promise<ApiData<Contact>> => {
  const { search, page = '1', pageSize = '10' } = getQuery(event)

  const filters: Record<string, any> = {}

  if (search) {
    filters.$or = [
      { c_id: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } }
    ]
  }

  const pageNumber = Math.max(Number.parseInt(page as string, 10), 1)
  const size = Math.max(Number.parseInt(pageSize as string, 10), 1)
  const skip = (pageNumber - 1) * size

  const [contacts, total] = await Promise.all([
    ContactSchema.find(filters).skip(skip).limit(size),
    ContactSchema.countDocuments(filters)
  ])

  return {
    data: contacts,
    total
  }
})
