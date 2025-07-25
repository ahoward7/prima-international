import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event): Promise<{ [key: string]: FilterOption[] }> => {
  // Get distinct models and types
  const models = await MachineSchema.distinct('model')
  const types = await MachineSchema.distinct('type')
  const salesmen = await MachineSchema.distinct('salesman')

  // Filter out empty or falsy values, then convert to FilterOption format
  const modelOptions: FilterOption[] = models.filter(Boolean).map((value: string) => ({
    label: value,
    data: value
  }))

  const typeOptions: FilterOption[] = types.filter(Boolean).map((value: string) => ({
    label: value,
    data: value
  }))

   const salesmanOptions: FilterOption[] = salesmen.filter(Boolean).map((value: string) => ({
    label: value,
    data: value
  }))

  return {
    model: [
      { label: 'Choose model', data: '' },
      ...modelOptions
    ],
    type: [
      { label: 'Choose type', data: '' },
      ...typeOptions
    ],
    salesman: [
      { label: 'Choose salesman', data: ''},
      ...salesmanOptions
    ],
    location: [
      { label: 'Choose location', data: '' },
      { label: 'Located', data: 'located' },
      { label: 'Sold', data: 'sold' },
      { label: 'Archived', data: 'archived' },
    ],
    displayFormat: [
      { label: 'One Line', data: 'oneLine'},
      { label: 'Two Line', data: 'twoLine'},
      { label: 'Two Line Truncated', data: 'twoLineTruncated'},
    ],
    pageSize: [
      { label: '10', data: 10},
      { label: '20', data: 20},
      { label: '30', data: 30},
      { label: '40', data: 40},
      { label: '50', data: 50},
      { label: '100', data: 100},
    ],
  }
})
