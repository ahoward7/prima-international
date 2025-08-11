// Nuxt test-utils setup for API testing
import { afterAll, beforeAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

// We don't actually start a DB; endpoints should be testable with mocked models.
export let apiFetch: typeof $fetch

beforeAll(async () => {
  await setup({
    server: true,
    browser: false,
    // Use the current workspace Nuxt app
    rootDir: process.cwd()
  })
  apiFetch = $fetch
})

afterAll(async () => {
  // test-utils handles teardown automatically
})
