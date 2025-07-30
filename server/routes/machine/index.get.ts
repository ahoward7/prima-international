import type { H3Event } from 'h3'
import type { Document } from 'mongoose'

type DBMachineDocument = DBMachine & Document
type DBArchiveDocument = ArchivedMachine & Document
type MachineDocument = DBMachineDocument | DBArchiveDocument
type MachineFilterStrings = {[key: string]: string}

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
        _sortNull: 1, // falsey values at the end
        [sortField]: sortDir
      }
    })
  }

  // Add pagination
  const pageSizeNum = parseInt(pageSize, 10) || 10 // default to 10 if invalid
  const pageNum = parseInt(page, 10) || 1 // default to page 1 if invalid
  const skip = (pageNum - 1) * pageSizeNum

  pipeline.push({ $skip: skip })
  pipeline.push({ $limit: pageSizeNum })

  return pipeline
}

async function buildQuery(machineFilters: MachineFilterStrings): Promise<{ data: MachineDocument[]; total: number }> {
  const { search, model, type, sortBy, pageSize, page, location } = machineFilters

  const isArchived = location === 'archived'

  const fieldPrefix = isArchived ? 'machine.' : ''
  const filters: Record<string, any> = {}

  if (model) filters[`${fieldPrefix}model`] = model
  if (type) filters[`${fieldPrefix}type`] = type

  if (search) {
    filters.$or = [
      { [`${fieldPrefix}serialNumber`]: { $regex: search, $options: 'i' } },
      { [`${fieldPrefix}model`]: { $regex: search, $options: 'i' } },
      { [`${fieldPrefix}type`]: { $regex: search, $options: 'i' } },
      { [`${fieldPrefix}description`]: { $regex: search, $options: 'i' } },
    ]
  }

  const resolvedSortField = sortBy
    ? sortBy.startsWith('-')
      ? '-' + fieldPrefix + sortBy.slice(1)
      : fieldPrefix + sortBy
    : ''

  const pipeline = buildPipeline(filters, resolvedSortField, pageSize, page)

  const countPipeline = [
    { $match: filters },
    { $count: 'total' }
  ]

  const targetSchema = isArchived ? ArchiveSchema : MachineSchema

  const [data, totalResult] = await Promise.all([
    targetSchema.aggregate(pipeline),
    targetSchema.aggregate(countPipeline),
  ])

  const total = totalResult[0]?.total || 0

  return { data, total }
}

async function joinContacts(machines: MachineDocument[], location: string) {
  const isArchived = location === 'archived'

  const extracted: Machine[] = machines.map(m => isArchived ? { m_id: (m as ArchivedMachine).a_id, ...(m as ArchivedMachine).machine } : m) as Machine[]

  const contactIds = [...new Set(extracted.map(m => m?.contactId).filter(Boolean))]
  const contacts = await ContactSchema.find({ c_id: { $in: contactIds } })
  const contactMap = new Map(contacts.map(contact => [contact.c_id, contact]))

  const joinedMachines: Machine[] = extracted.map(machine => {
    const contact = contactMap.get(machine?.contactId ?? '')

    return {
      ...machine,
      contact: contact || { company: '', name: '' },
    } as Machine
  })

  return joinedMachines
}

export default defineEventHandler(async (event: H3Event): Promise<{ data: Machine[]; total: number }> => {
  const filters: MachineFilterStrings = getQuery(event)

  if (filters.location === 'sold') {
    return {
      data: [],
      total: 0
    }
  }

  const { data: machines, total } = await buildQuery(filters)
  const joinedMachines = await joinContacts(machines, filters.location)

  return {
    data: joinedMachines,
    total
  }
})

