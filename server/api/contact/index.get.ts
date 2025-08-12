import { defineEventHandler, getQuery } from 'h3'
import { ok, problem } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  try {
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

    return ok(event, { data: contacts, total } satisfies ApiData<Contact>)
  }
  catch (error: any) {
    return problem(event, error?.statusCode || 500, 'Server: Error fetching contacts', error?.message || 'Server: Unexpected error')
  }
})
