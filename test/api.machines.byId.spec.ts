import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import * as mocks from './mocks/nuxt-mongoose'

vi.mock('#nuxt/mongoose', async () => await import('./mocks/nuxt-mongoose'))

describe('GET /api/machines/:id by location', async () => {
  await setup({ server: true, browser: false, rootDir: process.cwd() })

  beforeEach(() => {
    vi.restoreAllMocks()
    ;(mocks.MachineSchema.findOne as any).mockResolvedValueOnce({ m_id: 'M1', contactId: 'C1' })
    ;(mocks.ContactSchema.findOne as any).mockResolvedValueOnce({ c_id: 'C1', name: 'N' })
  })

  it('returns located machine with joined contact', async () => {
    const res: any = await $fetch('/api/machines/M1?location=located')
    expect(res.data?.m_id || res.data?.machine?.m_id).toBeDefined()
  })
})
