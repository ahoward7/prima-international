<template>
  <div class="flex items-center gap-4">
    <label class="text-prima-red dark:text-prima-dark-accent font-semibold">{{ label || 'No Label' }}</label>
    <input v-model="model" type="checkbox" class="w-5 h-5 text-prima-red dark:text-prima-dark-accent bg-gray-100 dark:bg-gray-800  px-2 py-1 border border-prima-red dark:border-prima-dark-accent" :placeholder="placeholder">
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  placeholder?: string
}>()
const model = defineModel<boolean>()
</script>
