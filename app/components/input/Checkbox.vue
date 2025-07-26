<template>
  <div class="flex items-center gap-4">
    <label class="text-prima-red font-semibold">{{ label || 'No Label' }}</label>
    <input v-model="model" type="checkbox" class="w-5 h-5 text-prima-red bg-gray-100 font-semibold px-2 py-1 border border-prima-red" :placeholder="placeholder" />
  </div>
</template>

<script setup lang="ts">
const model = defineModel<boolean>()
defineProps<{
  label?: string
  placeholder?: string
}>()
</script>
