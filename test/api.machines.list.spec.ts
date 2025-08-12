import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as mocks from './mocks/nuxt-mongoose'

vi.mock('#nuxt/mongoose', async () => await import('./mocks/nuxt-mongoose'))

// Helper data
const machine = {
  m_id: 'M1',
  contactId: 'C1',
  model: 'ModelX',
  type: 'TypeY',
  serialNumber: 'SN1',
  year: 2020,
  hours: 100,
  description: 'Desc',
  salesman: 'S',
  createDate: '2024-01-01T00:00:00.000Z',
  lastModDate: '2024-01-01T00:00:00.000Z',
  price: 10,
  location: 'located',
  notes: ''
}
const contact = { c_id: 'C1', name: 'Name', company: 'Co', createDate: 'd', lastModDate: 'd' }

describe('get /api/machines list', async () => {
  await setup({ server: true, browser: false, rootDir: process.cwd() })

  beforeEach(() => {
    vi.restoreAllMocks()
    ;(mocks.MachineSchema.aggregate as any).mockResolvedValueOnce([machine])
    ;(mocks.MachineSchema.aggregate as any).mockResolvedValueOnce([{ total: 1 }])
    ;(mocks.ContactSchema.find as any).mockResolvedValueOnce([contact])
  })

  it('returns located machines joined with contact', async () => {
    const res: any = await $fetch('/api/machines?location=located')
    expect(res).toHaveProperty('data')
    expect(res.data.total).toBe(1)
    expect(res.data.data[0].contact?.c_id).toBe('C1')
  })
})
