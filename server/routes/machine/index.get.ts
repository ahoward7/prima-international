import type { H3Event } from 'h3'

// Types
interface MachineFilters {
  location?: string
  search?: string
  pageSize?: number
  sortBy?: string
  model?: string
  type?: string
}

interface Machine {
  contactId?: string
  contact?: any
  [key: string]: any
}

interface Contact {
  c_id: string
  [key: string]: any
}

// Error classes
class MachineQueryError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message)
    this.name = 'MachineQueryError'
  }
}

class ContactQueryError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message)
    this.name = 'ContactQueryError'
  }
}

// Utility functions
function validateFilters(filters: MachineFilters): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (filters.pageSize !== undefined) {
    const pageSize = Number(filters.pageSize)
    if (isNaN(pageSize) || pageSize <= 0) {
      errors.push('pageSize must be a positive number')
    }
  }
  
  if (filters.search !== undefined && typeof filters.search !== 'string') {
    errors.push('search must be a string')
  }
  
  if (filters.model !== undefined && typeof filters.model !== 'string') {
    errors.push('model must be a string')
  }
  
  if (filters.type !== undefined && typeof filters.type !== 'string') {
    errors.push('type must be a string')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

function buildMachineFilter(filters: MachineFilters): any {
  const filter: any = {}

  // Add model filter if provided
  if (filters.model) {
    filter.model = filters.model
  }

  // Add type filter if provided
  if (filters.type) {
    filter.type = filters.type
  }

  // Add universal search filter if provided
  if (filters.search) {
    filter.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { model: { $regex: filters.search, $options: 'i' } },
      { type: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } }
    ]
  }

  return filter
}

function buildMachineQuery(filter: any, sortBy?: string, pageSize?: number): any {
  let query = MachineSchema.find(filter)

  // Add sorting if provided
  if (sortBy) {
    query = query.sort(sortBy)
  }

  // Add pagination if provided
  if (pageSize) {
    const limit = Number(pageSize)
    if (!isNaN(limit) && limit > 0) {
      query = query.limit(limit)
    }
  }

  return query
}

async function fetchMachines(query: any): Promise<any[]> {
  try {
    console.log('Executing machine query...')
    const machines = await query
    console.log(`Successfully fetched ${machines.length} machines`)
    return machines
  } catch (error) {
    console.error('Error fetching machines:', error)
    throw new MachineQueryError('Failed to fetch machines from database', error as Error)
  }
}

function extractContactIds(machines: any[]): string[] {
  const contactIds = [...new Set(
    machines
      .map(m => m.contactId)
      .filter(Boolean)
      .filter((id): id is string => typeof id === 'string')
  )]
  
  console.log(`Extracted ${contactIds.length} unique contact IDs`)
  return contactIds
}

async function fetchContacts(contactIds: string[]): Promise<Contact[]> {
  if (contactIds.length === 0) {
    console.log('No contact IDs to fetch')
    return []
  }

  try {
    console.log(`Fetching contacts for ${contactIds.length} IDs...`)
    const contacts = await ContactSchema.find({ c_id: { $in: contactIds } })
    console.log(`Successfully fetched ${contacts.length} contacts`)
    return contacts
  } catch (error) {
    console.error('Error fetching contacts:', error)
    throw new ContactQueryError('Failed to fetch contacts from database', error as Error)
  }
}

function createContactMap(contacts: Contact[]): Map<string, Contact> {
  const contactMap = new Map(contacts.map(contact => [contact.c_id, contact]))
  console.log(`Created contact map with ${contactMap.size} entries`)
  return contactMap
}

function transformMachinesWithContacts(machines: any[], contactMap: Map<string, Contact>): Machine[] {
  console.log('Transforming machines with contact data...')
  
  const transformedMachines: Machine[] = machines.map(machine => {
    const machineObj = machine.toObject ? machine.toObject() : machine
    const contact = contactMap.get(machineObj.contactId)
    
    return {
      ...machineObj,
      contact: contact || null,
    } as Machine
  })
  
  console.log(`Successfully transformed ${transformedMachines.length} machines`)
  return transformedMachines
}

// Main event handler
export default defineEventHandler(async (event: H3Event): Promise<Machine[]> => {
  const startTime = Date.now()
  
  try {
    console.log('Starting machine query request...')
    
    // Parse and validate query parameters
    const filters: MachineFilters = getQuery(event)
    console.log('Received filters:', JSON.stringify(filters, null, 2))
    
    const validation = validateFilters(filters)
    if (!validation.isValid) {
      console.error('Filter validation failed:', validation.errors)
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid filters: ${validation.errors.join(', ')}`
      })
    }
    
    // Build database filter
    const filter = buildMachineFilter(filters)
    console.log('Built filter:', JSON.stringify(filter, null, 2))
    
    // Build and execute machine query
    const query = buildMachineQuery(filter, filters.sortBy, filters.pageSize)
    const machines = await fetchMachines(query)
    
    // Extract contact IDs and fetch contacts
    const contactIds = extractContactIds(machines)
    const contacts = await fetchContacts(contactIds)
    
    // Create contact lookup map
    const contactMap = createContactMap(contacts)
    
    // Transform machines with contact data
    const transformedMachines = transformMachinesWithContacts(machines, contactMap)
    
    const duration = Date.now() - startTime
    console.log(`Request completed successfully in ${duration}ms`)
    
    return transformedMachines
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`Request failed after ${duration}ms:`, error)
    
    // Handle known error types
    if (error instanceof MachineQueryError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database error while fetching machines'
      })
    }
    
    if (error instanceof ContactQueryError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database error while fetching contacts'
      })
    }
    
    // Handle validation errors (already thrown above)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    // Handle unexpected errors
    console.error('Unexpected error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})