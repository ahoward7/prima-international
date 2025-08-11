import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [],
    server: {
      deps: {
        inline: [/@nuxt\/test-utils/]
      }
    }
  },
  resolve: {
    alias: {
  // Avoid absolute path issues by using relative from project root
  '~/server/models/machine': 'test/mocks/nuxt-mongoose',
  '~/server/models/archive': 'test/mocks/nuxt-mongoose',
  '~/server/models/sold': 'test/mocks/nuxt-mongoose',
  '~/server/models/contact': 'test/mocks/nuxt-mongoose',
  '~~/server/models/machine': 'test/mocks/nuxt-mongoose',
  '~~/server/models/archive': 'test/mocks/nuxt-mongoose',
  '~~/server/models/sold': 'test/mocks/nuxt-mongoose',
  '~~/server/models/contact': 'test/mocks/nuxt-mongoose',
  '#nuxt/mongoose': 'test/mocks/nuxt-mongoose'
    }
  }
})
