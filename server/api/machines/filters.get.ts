import { defineEventHandler } from 'h3'
import { ok, problem } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  try {
    const [machineModels, archiveModels, soldModels] = await Promise.all([
      MachineSchema.distinct('model'),
      ArchiveSchema.distinct('machine.model'),
      SoldSchema.distinct('machine.model')
    ])
    const [machineTypes, archiveTypes, soldTypes] = await Promise.all([
      MachineSchema.distinct('type'),
      ArchiveSchema.distinct('machine.type'),
      SoldSchema.distinct('machine.type')
    ])
    const [machineSalesmen, archiveSalesmen, soldSalesmen] = await Promise.all([
      MachineSchema.distinct('salesman'),
      ArchiveSchema.distinct('machine.salesman'),
      SoldSchema.distinct('machine.salesman')
    ])

    const toFilterOptions = (a: string[], b: string[], c: string[]): FilterOption[] =>
      Array.from(new Set([...(a || []), ...(b || []), ...(c || [])].filter(Boolean))).map((value: string) => ({
        label: value,
        data: value
      }))

    return ok(event, {
      model: toFilterOptions(machineModels, archiveModels, soldModels),
      type: toFilterOptions(machineTypes, archiveTypes, soldTypes),
      salesman: toFilterOptions(machineSalesmen, archiveSalesmen, soldSalesmen),
      location: [
        { label: 'Located', data: 'located' },
        { label: 'Sold', data: 'sold' },
        { label: 'Archived', data: 'archived' }
      ],
      displayFormat: [
        { label: 'One Line', data: 'oneLine'},
        { label: 'Two Line', data: 'twoLine'},
        { label: 'Two Line Truncated', data: 'twoLineTruncated'}
      ],
      pageSize: [
        { label: '10', data: 10},
        { label: '20', data: 20},
        { label: '30', data: 30},
        { label: '40', data: 40},
        { label: '50', data: 50},
        { label: '100', data: 100}
      ]
    })
  }
  catch (error: any) {
    return problem(event, error?.statusCode || 500, 'Server: Error fetching filters', error?.message || 'Server: Unexpected error')
  }
})
