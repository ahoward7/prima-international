<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" class="text-prima-red dark:text-prima-dark-accent font-semibold">{{ label || 'No Label' }}</label>
    <input v-model="model" type="text" readonly class="text-prima-red dark:text-prima-dark-accent bg-gray-100 dark:bg-gray-800  px-2 py-1 border border-prima-red dark:border-prima-dark-accent focus:outline-none" :placeholder="placeholder">
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  placeholder?: string
}>()
const model = defineModel<string>()
</script>
