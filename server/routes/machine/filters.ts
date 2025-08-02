import type { H3Event } from 'h3'

export default defineEventHandler(async (_: H3Event): Promise<FilterOptions> => {
  // Get distinct values from both schemas
  const [machineModels, archiveModels] = await Promise.all([
    MachineSchema.distinct('model'),
    ArchiveSchema.distinct('machine.model')
  ])
  const [machineTypes, archiveTypes] = await Promise.all([
    MachineSchema.distinct('type'),
    ArchiveSchema.distinct('machine.type')
  ])
  const [machineSalesmen, archiveSalesmen] = await Promise.all([
    MachineSchema.distinct('salesman'),
    ArchiveSchema.distinct('machine.salesman')
  ])

  // Helper to merge, deduplicate, and convert to FilterOption[]
  const toFilterOptions = (a: string[], b: string[]): FilterOption[] =>
    Array.from(new Set([...a, ...b].filter(Boolean))).map((value: string) => ({
      label: value,
      data: value
    }))

  return {
    model: toFilterOptions(machineModels, archiveModels),
    type: toFilterOptions(machineTypes, archiveTypes),
    salesman: toFilterOptions(machineSalesmen, archiveSalesmen),
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
  }
})
