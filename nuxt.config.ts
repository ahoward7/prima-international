import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@pinia/nuxt',
    'nuxt-mongoose',
    '@nuxt/fonts'
  ],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss()
    ]
  },
  nitro: {
    experimental: {
      wasm: true
    }
  },
  eslint: {
    config: {
      standalone: false
    }
  }
})
