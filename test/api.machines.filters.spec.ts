import { $fetch, setup } from '@nuxt/test-utils/e2e'
// Explicitly mock the actual schema import paths used in the API
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as mocks from './mocks/nuxt-mongoose'

vi.mock('~/server/models/machine', async () => {
  return { MachineSchema: (await import('./mocks/nuxt-mongoose')).MachineSchema }
})
vi.mock('~/server/models/archive', async () => {
  return { ArchiveSchema: (await import('./mocks/nuxt-mongoose')).ArchiveSchema }
})
vi.mock('~/server/models/sold', async () => {
  return { SoldSchema: (await import('./mocks/nuxt-mongoose')).SoldSchema }
})

describe('get /api/machines/filters', async () => {
  await setup({ server: true, browser: false, rootDir: process.cwd() })

  beforeEach(() => {
    mocks.MachineSchema.distinct.mockResolvedValueOnce(['M1']).mockResolvedValueOnce(['T1']).mockResolvedValueOnce(['S1'])
    mocks.ArchiveSchema.distinct.mockResolvedValueOnce(['M2']).mockResolvedValueOnce(['T2']).mockResolvedValueOnce(['S2'])
    mocks.SoldSchema.distinct.mockResolvedValueOnce(['M3']).mockResolvedValueOnce(['T3']).mockResolvedValueOnce(['S3'])
  })

  it('returns combined filter options', async () => {
    const res: any = await $fetch('/api/machines/filters')
    expect(res).toHaveProperty('data')
    const data = res.data
    expect(Array.isArray(data.model)).toBe(true)
    const labels = data.model.map((o:any)=>o.label)
    expect(labels).toEqual(expect.arrayContaining(['M1','M2','M3']))
    expect(data.location).toEqual(expect.arrayContaining([
      expect.objectContaining({ data: 'located' }),
      expect.objectContaining({ data: 'sold' }),
      expect.objectContaining({ data: 'archived' })
    ]))
  })
})
