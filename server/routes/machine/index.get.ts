import type { H3Event } from 'h3'
import type { Query, Document } from 'mongoose'

type DBMachineDocument = DBMachine & Document
type MachineQuery = Query<DBMachineDocument[], DBMachineDocument>

function buildQuery(machineFilters: MachineFilters): MachineQuery {
  const { search, model, type } = machineFilters
  const filters: Record<string, any> = {}

  if (model) filters.model = model
  if (type) filters.type = type

  if (search) {
    filters.$or = [
      { serialNumber: { $regex: search, $options: 'i' } },
      { model: { $regex: search, $options: 'i' } },
      { type: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ]
  }

  let query = MachineSchema.find<DBMachineDocument>(filters)
  query = sortMachines(query, filters.sortBy)
  query = limitMachines(query, filters.pageSize)

  return query
}

function sortMachines(machineQuery: MachineQuery, sortBy: string = ''): MachineQuery {
  return sortBy ? machineQuery.sort(sortBy) : machineQuery
}

function limitMachines(machineQuery: MachineQuery, pageSize: number = 20): MachineQuery {
  if (!isNaN(pageSize) && pageSize > 0) {
    return machineQuery.limit(pageSize)
  }
  return machineQuery
}

async function joinContacts(machines: DBMachineDocument[]) {
  const contactIds = [...new Set(machines.map(m => m.contactId).filter(Boolean))]
  const contacts = await ContactSchema.find({ c_id: { $in: contactIds } })
  const contactMap = new Map(contacts.map(contact => [contact.c_id, contact]))

  const joinedMachines: Machine[] = machines.map(machineDoc => {
    const machine = machineDoc.toObject()

    const contact = contactMap.get(machine.contactId ?? '')

    return {
      ...machine,
      contact: contact || null,
    } as Machine
  })

  return joinedMachines
}

export default defineEventHandler(async (event: H3Event): Promise<Machine[]> => {
  const filters: MachineFilters = getQuery(event)

  const query = buildQuery(filters)
  const machines = await query
  const joinedMachines = await joinContacts(machines)

  return joinedMachines
})
