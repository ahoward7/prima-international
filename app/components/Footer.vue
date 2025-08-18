<template>
  <div class="text-prima-red text-center p-8 dark:text-prima-dark-accent">
    <div class="w-full border-t-2 border-prima-red dark:border-prima-dark-accent" />
    <div class="font-extrabold py-16">
      Prima International Trading &copy; 2025
    </div>
    <button
      class="mt-4 px-4 py-2 rounded bg-prima-red text-white dark:bg-prima-dark-accent dark:text-black transition-colors"
      @click="toggleColorMode"
    >
      Switch to {{ label }} Mode
    </button>
  </div>
</template>
<script setup lang="ts">
const colorMode = useColorMode()

const label = computed(() => {
  if (!colorMode) return 'Dark'
  return colorMode.value === 'dark' ? 'Light' : 'Dark'
})

const toggleColorMode = () => {
  if (!colorMode) return
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>
