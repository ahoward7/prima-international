import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@pinia/nuxt',
    'nuxt-mongoose',
    '@nuxt/fonts',
    '@nuxtjs/color-mode',
    'nuxt-auth-utils'
  ],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss()
    ]
  },
  eslint: {
    config: {
      standalone: false
    }
  },
  runtimeConfig: {
    session: {
      maxAge: 60 * 60 * 24 * 30
    }
  }
})