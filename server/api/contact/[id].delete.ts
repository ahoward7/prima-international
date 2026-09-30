export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) return problem(event, 400, 'Missing id', 'Contact id route param is required')

    await ContactSchema.deleteOne({ c_id: id })

    setResponseStatus(event, 204)
    return null
  }
  catch (error: any) {
    return problem(event, error?.statusCode || 500, 'Delete failed', error?.message || 'Unexpected error')
  }
})
