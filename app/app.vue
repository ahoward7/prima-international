
<template>
  <div :class="modeClass" class="relative font-roboto bg-white text-black dark:bg-prima-dark-bg dark:text-prima-dark-text min-h-screen">
    <Notifications />
    <NuxtPage />
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// useColorMode is auto-imported by Nuxt when @nuxtjs/color-mode is installed.
const maybeUseColorMode = typeof useColorMode === 'function' ? useColorMode : null
const colorMode = maybeUseColorMode ? maybeUseColorMode() : null

const modeClass = computed(() => {
  if (!colorMode) return 'light'
  return colorMode.value === 'dark' ? 'dark' : 'light'
})
</script>
