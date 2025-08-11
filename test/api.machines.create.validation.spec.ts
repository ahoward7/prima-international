import { describe, it, expect, vi, beforeAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

vi.mock('#nuxt/mongoose', async () => await import('./mocks/nuxt-mongoose'))

// Stub contact helper side-effects to isolate endpoint validation
vi.mock('~/shared/utils/handleContactUpdateOrCreate', () => ({
  handleContactUpdateOrCreate: vi.fn(async () => ({ contactId: 'C1', contactChanged: false, contact: {} }))
}))

// Minimal util for id so tests are deterministic
vi.mock('~/shared/utils/generateRandom10DigitNumber', () => ({
  generateRandom10DigitNumber: () => '1234567890'
}))

describe('POST /api/machines (validation)', async () => {
  await setup({ server: true, browser: false, rootDir: process.cwd() })

  it('rejects invalid body with Zod problem details', async () => {
    // year must be number if provided; send bad type
    const res: any = await $fetch('/api/machines', {
      method: 'POST',
      body: { year: 'not-a-number', contact: {} }
    }).catch(e => e.data || e)

    expect(res).toHaveProperty('error')
    expect(res.error.status).toBe(400)
    expect(res.error.title).toBe('Validation error')
    expect(res.error.errors).toBeDefined()
  })

  it('creates machine with minimal valid body', async () => {
    const res: any = await $fetch('/api/machines', {
      method: 'POST',
      body: { model: 'X', contact: { c_id: 'new', name: 'N' } }
    })
    expect(res).toHaveProperty('data')
    expect(res.data.success).toBe(true)
    expect(res.data.machine).toBeTruthy()
  })
})
