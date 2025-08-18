
<template>
  <div :class="modeClass" class="relative font-roboto bg-white text-black dark:bg-prima-dark-bg dark:text-prima-dark-text min-h-screen">
    <button
      class="absolute top-4 right-4 text-prima-red dark:text-prima-dark-accent cursor-pointer flex items-center justify-center"
      :title="modeClass === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="toggleColorMode"
    >
      <Icon :name="modeClass === 'dark' ? 'carbon:sun' : 'carbon:moon'" size="24" />
    </button>
    <Notifications />
    <NuxtPage />
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { useNuxtApp } from '#app'
import { computed, watch } from 'vue'
const nuxtApp = useNuxtApp()
const colorMode = useColorMode()

const modeClass = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'))

if (import.meta.server) {
  const cookie = nuxtApp.ssrContext?.event?.req?.headers.cookie || ''
  const match = cookie.match(/color_mode=(dark|light)/)
  if (match) {
    colorMode.preference = match[1]
    colorMode.value = match[1]
  }
}

if (import.meta.client) {
  watch(
    () => colorMode.value,
    (v) => {
      document.cookie = `color_mode=${v}; path=/; SameSite=Lax`
    },
    { immediate: true }
  )
}

const toggleColorMode = () => {
  if (!colorMode) return
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>
