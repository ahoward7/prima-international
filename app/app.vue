
<template>
  <div :class="modeClass" class="relative font-roboto bg-white text-black dark:bg-prima-dark-bg dark:text-prima-dark-text min-h-screen">
    <div class="absolute top-4 right-4 flex items-center gap-3">
      <button
        class="text-prima-red dark:text-prima-dark-accent cursor-pointer flex items-center justify-center"
        :title="modeClass === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleColorMode"
      >
        <Icon :name="modeClass === 'dark' ? 'carbon:sun' : 'carbon:moon'" size="24" />
      </button>
      <button
        v-if="showLogout"
        class="text-prima-red dark:text-prima-dark-accent cursor-pointer flex items-center justify-center"
        title="Log out"
        @click="onLogout"
      >
        <Icon name="carbon:logout" size="24" />
      </button>
    </div>
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
const { user, fetch: fetchUserSession } = useUserSession()
const route = useRoute()

const modeClass = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'))
const showLogout = computed(() => !!user?.value && route.path !== '/login')

if (import.meta.server) {
  const cookie = nuxtApp.ssrContext?.event?.req?.headers.cookie || ''
  const match = cookie.match(/color_mode=(dark|light)/)
  if (match) {
    colorMode.preference = match[1] || ''
    colorMode.value = match[1] || ''
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

const onLogout = async () => {
  try {
    await $fetch('/api/_auth/session', { method: 'DELETE' })
  }
  catch {}
  try {
    await fetchUserSession?.()
  }
  catch {}
  navigateTo('/login')
}
</script>
