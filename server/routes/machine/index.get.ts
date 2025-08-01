import type { H3Event } from 'h3'
import type { Document } from 'mongoose'

type DBMachineDocument = DBMachine & Document
interface MachineFilterStrings {[key: string]: string}

function buildPipeline(filters: MachineFilters, sortBy: string, pageSize: string, page: string) {
  let sortField = ''
  let sortDir = 1
  if (sortBy) {
    if (sortBy.startsWith('-')) {
      sortField = sortBy.slice(1)
      sortDir = -1
    } else {
      sortField = sortBy
      sortDir = 1
    }
  }

  const pipeline: any[] = [
    { $match: filters }
  ]

  if (sortField) {
    pipeline.push({
      $addFields: {
        _sortNull: {
          $cond: [
            { $or: [
              { $eq: [`$${sortField}`, null] },
              { $eq: [`$${sortField}`, ''] },
              { $eq: [`$${sortField}`, '0'] },
              { $not: [`$${sortField}`] }
            ] },
            1,
            0
          ]
        }
      }
    })
    pipeline.push({
      $sort: {
        _sortNull: 1,
        [sortField]: sortDir
      }
    })
  }

  const pageSizeNum = Number.parseInt(pageSize, 10) || 10
  const pageNum = Number.parseInt(page, 10) || 1
  const skip = (pageNum - 1) * pageSizeNum

  pipeline.push({ $skip: skip })
  pipeline.push({ $limit: pageSizeNum })

  return pipeline
}

async function buildQuery(machineFilters: MachineFilterStrings): Promise<{ data: DBMachineDocument[]; total: number }> {
  const { search, model, type, sortBy, pageSize, page } = machineFilters
  const filters: Record<string, any> = {}

  if (model) filters.model = model
  if (type) filters.type = type

  if (search) {
    filters.$or = [
      { serialNumber: { $regex: search, $options: 'i' } },
      { model: { $regex: search, $options: 'i' } },
      { type: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ]
  }

  const pipeline = buildPipeline(filters, sortBy, pageSize, page)

  const countPipeline = [
    { $match: filters },
    { $count: 'total' }
  ]

  const [data, totalResult] = await Promise.all([
    MachineSchema.aggregate(pipeline),
    MachineSchema.aggregate(countPipeline)
  ])

  const total = totalResult[0]?.total || 0

  return { data, total }
}

async function joinContacts(machines: DBMachineDocument[]) {
  const contactIds = [...new Set(machines.map(m => m.contactId).filter(Boolean))]
  const contacts = await ContactSchema.find({ c_id: { $in: contactIds } })
  const contactMap = new Map(contacts.map(contact => [contact.c_id, contact]))

  const joinedMachines: Machine[] = machines.map(machine => {
    const contact = contactMap.get(machine.contactId ?? '')

    return {
      ...machine,
      contact: contact || { company: '', name: ''}
    } as Machine
  })

  return joinedMachines
}

export default defineEventHandler(async (event: H3Event): Promise<{ data: Machine[]; total: number }> => {
  const filters: MachineFilterStrings = getQuery(event)

  const { data: machines, total } = await buildQuery(filters)
  const joinedMachines = await joinContacts(machines)

  return {
    data: joinedMachines,
    total
  }
})