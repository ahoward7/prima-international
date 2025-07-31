<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" class="text-prima-red font-semibold">{{ label || 'No Label' }}</label>
    <input v-model="model" type="text" class="text-prima-red bg-gray-100 px-2 py-1 border border-prima-red" :placeholder="placeholder">
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  placeholder?: string
}>()
const model = defineModel<string>()
</script>
