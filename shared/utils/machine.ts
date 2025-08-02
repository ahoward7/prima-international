// utils/machineQueryUtils.ts
import type { ApiData, MachineFilterStrings } from '../types/main'

interface PipelineOptions {
  filters: Record<string, any>
  sortBy?: string
  pageSize?: string
  page?: string
  defaultSortField?: string
  prefix?: string
}

interface QueryOptions {
  fieldPrefix?: string
  searchable?: boolean
  defaultSortField?: string
}

/**
 * Builds an aggregation pipeline with filters, text score, null-sort handling, pagination, and sorting.
 */
export function buildPipeline({ filters, sortBy, pageSize = '10', page = '1', defaultSortField, prefix = ''}: PipelineOptions): any[] {
  const sortField = sortBy?.startsWith('-') ? sortBy.slice(1) : sortBy || defaultSortField || ''
  const sortDir = sortBy?.startsWith('-') ? -1 : 1

  const pipeline: any[] = [{ $match: filters }]

  if (sortField) {
    pipeline.push({
      $addFields: {
        _sortNull: {
          $cond: [
            {
              $or: [
                { $eq: [`$${prefix}${sortField}`, null] },
                { $eq: [`$${prefix}${sortField}`, '' ] },
                { $eq: [`$${prefix}${sortField}`, '0'] },
                { $not: [`$${prefix}${sortField}`] }
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
        [`${prefix}${sortField}`]: sortDir
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

/**
 * Builds a reusable query using any Mongoose model.
 */
export async function buildQueryForSchema<T>( schema: any, machineFilters: MachineFilterStrings, queryOptions: QueryOptions = {}): Promise<ApiData<T>> {
  const { search, model, type, sortBy, pageSize, page } = machineFilters
  const { fieldPrefix, searchable, defaultSortField } = queryOptions
  const filters: Record<string, any> = {}

  if (model) filters[`${fieldPrefix}model`] = model
  if (type) filters[`${fieldPrefix}type`] = type

  if (searchable && search) {
    filters.$text = {
      $search: search,
      $caseSensitive: false,
      $diacriticSensitive: false
    }
  }

  const pipeline = buildPipeline({
    filters,
    sortBy,
    pageSize,
    page,
    defaultSortField,
    prefix: fieldPrefix
  })

  if (searchable && search) {
    pipeline.splice(1, 0, {
      $addFields: {
        textScore: { $meta: 'textScore' }
      }
    })

    if (!sortBy) {
      pipeline.splice(-2, 0, {
        $sort: { textScore: { $meta: 'textScore' } }
      })
    }
  }

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
