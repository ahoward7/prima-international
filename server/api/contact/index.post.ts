export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<Partial<Contact>>(event)
    const date = getEasternDateISOString()

    const { contactId, contactChanged, contact } = await handleContactUpdateOrCreate(body, date)

    return created(event, { success: true, contactId, contactChanged, contact }, '/api/contact')
  }
  catch (error: any) {
    return problem(event, error?.statusCode || 500, 'Create failed', error?.message || 'Unexpected error')
  }
})
