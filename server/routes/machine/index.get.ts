import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event): Promise<Machine[]> => {
  const { location, search, pageSize, sortBy, model, type }: MachineFilters = getQuery(event)

  // Build the filter object
  const filter: any = {}

  // Add model filter if provided
  if (model) {
    filter.model = model
  }

  // Add type filter if provided
  if (type) {
    filter.type = type
  }

  // Add universal search filter if provided
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { model: { $regex: search, $options: 'i' } },
      { type: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ]
  }

  // Build the query
  let query = MachineSchema.find(filter)

  // Add sorting if provided
  if (sortBy) {
    query = query.sort(sortBy)
  }

  // Add pagination if provided
  if (pageSize) {
    const limit = pageSize
    if (!isNaN(limit) && limit > 0) {
      query = query.limit(limit)
    }
  }

  const machines = await query

  const contactIds = [...new Set(machines.map(m => m.contactId).filter(Boolean))]
  
  const contacts = await ContactSchema.find({ c_id: { $in: contactIds } })
  
  const contactMap = new Map(contacts.map(contact => [contact.c_id, contact]))

  const transformedMachines: Machine[] = machines.map(machine => {
    const machineObj = machine.toObject ? machine.toObject() : machine
    
    const contact = contactMap.get(machineObj.contactId)
    
    return {
      ...machineObj,
      contact: contact || null,
    } as Machine
  })

  return transformedMachines
})