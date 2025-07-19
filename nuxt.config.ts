import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: ["@nuxt/icon"],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  imports: {
    dirs: ['./interfaces'],
  },
  nitro: {
    experimental: {
      wasm: true
    },
    imports: {
      dirs: ['./interfaces']
    }
  },
})
