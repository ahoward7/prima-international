// utils/machineQueryUtils.ts
import type { ApiData } from '../types/api'
import type { MachineFilterStrings } from '../types/machine'

interface PipelineOptions {
  filters: Record<string, any>
  sortBy?: string
  pageSize?: string
  page?: string
  defaultSortField?: string
  prefix?: string
  sortLookup?: {
    from: string
    localField: string
    foreignField: string
    as: string
  }
}

interface QueryOptions {
  fieldPrefix?: string
  searchable?: boolean
  defaultSortField?: string
  sortLookup?: PipelineOptions['sortLookup']
}

/**
 * Builds an aggregation pipeline with filters, text score, null-sort handling, pagination, and sorting.
 */
export function buildPipeline({ filters, sortBy, pageSize = '10', page = '1', defaultSortField, prefix = '', sortLookup}: PipelineOptions): any[] {
  const sortField = sortBy?.startsWith('-') ? sortBy.slice(1) : sortBy || defaultSortField || ''
  const sortDir = sortBy?.startsWith('-') ? -1 : 1

  const pipeline: any[] = [{ $match: filters }]

  if (sortField) {
    const isContactCompanySort = sortField === 'contact.company' && sortLookup
    const sortPath = isContactCompanySort ? '_sortCompany' : `${prefix}${sortField}`

    if (isContactCompanySort) {
      pipeline.push({
        $lookup: {
          ...sortLookup
        }
      })
      pipeline.push({
        $addFields: {
          _sortCompany: { $arrayElemAt: [`$${sortLookup.as}.company`, 0] }
        }
      })
    }

    pipeline.push({
      $addFields: {
        _sortNull: {
          $cond: [
            {
              $or: [
                { $eq: [`$${sortPath}`, null] },
                { $eq: [`$${sortPath}`, '' ] },
                { $eq: [`$${sortPath}`, '0'] },
                { $not: [`$${sortPath}`] }
              ]
            },
            1,
            0
          ]
        }
      }
    })

    pipeline.push({
      $sort: {
        _sortNull: 1,
        [sortPath]: sortDir
      }
    })

    if (isContactCompanySort && sortLookup) {
      pipeline.push({ $unset: [sortLookup.as, '_sortCompany'] })
    }
  }

  // If pageSize is '1', fetch all machines (do not paginate)
  if (pageSize !== '1') {
    const pageSizeNum = Number.parseInt(pageSize, 10) || 10
    const pageNum = Number.parseInt(page, 10) || 1
    const skip = (pageNum - 1) * pageSizeNum

    pipeline.push({ $skip: skip })
    pipeline.push({ $limit: pageSizeNum })
  }

  return pipeline
}

/**
 * Builds a reusable query using any Mongoose model.
 */
/**
 * Builds a reusable query using any Mongoose model with partial match support.
 */
export async function buildQueryForSchema<T>(schema: any, machineFilters: MachineFilterStrings, queryOptions: QueryOptions = {}): Promise<ApiData<T>> {
  const { search, model, type, sortBy, pageSize, page, contactId, m_id, a_id, s_id, lastModDateFrom, lastModDateTo } = machineFilters
  const { fieldPrefix = '', searchable, defaultSortField } = queryOptions
  const filters: Record<string, any> = {}

  if (model) filters[`${fieldPrefix}model`] = model
  if (type) filters[`${fieldPrefix}type`] = type
  if (contactId) filters[`${fieldPrefix}contactId`] = contactId

  if (m_id) filters[`${fieldPrefix}m_id`] = m_id
  if (a_id) filters[`${fieldPrefix}a_id`] = a_id
  if (s_id) filters[`${fieldPrefix}s_id`] = s_id

  if (lastModDateFrom || lastModDateTo) {
    const lastModDateField = `${fieldPrefix}lastModDate`
    filters[lastModDateField] = {}
    if (lastModDateFrom) filters[lastModDateField].$gte = lastModDateFrom
    if (lastModDateTo) filters[lastModDateField].$lte = `${lastModDateTo}T23:59:59.999Z`
  }

  if (searchable && search) {
    const regex = { $regex: search, $options: 'i' }
    filters.$or = [
      { [`${fieldPrefix}model`]: regex },
      { [`${fieldPrefix}type`]: regex },
      { [`${fieldPrefix}years`]: regex },
      { [`${fieldPrefix}hours`]: regex },
      { [`${fieldPrefix}description`]: regex },
      { [`${fieldPrefix}serialNumber`]: regex },
      { [`${fieldPrefix}location`]: regex }
    ]
  }

  const pipeline = buildPipeline({
    filters,
    sortBy,
    pageSize,
    page,
    defaultSortField,
    prefix: fieldPrefix,
    sortLookup: queryOptions.sortLookup
  })

  const countPipeline = [
    { $match: filters },
    { $count: 'total' }
  ]

  const [data, totalResult] = await Promise.all([
    schema.aggregate(pipeline),
    schema.aggregate(countPipeline)
  ])

  const total = totalResult[0]?.total || 0

  return { data, total }
}
