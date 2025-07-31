<template>
  <div class="flex flex-col gap-1">
    <label class="text-prima-red font-semibold">{{ label || 'No Label' }}</label>
    <textarea v-model="model" type="text" class="min-h-32 text-prima-red bg-gray-100 font-semibold px-2 py-1 border border-prima-red" :placeholder="placeholder" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  placeholder?: string
}>()
const model = defineModel<string>()
</script>
