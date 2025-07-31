<template>
  <div class="flex flex-col gap-1">
    <label class="text-prima-red font-semibold">{{ label || 'No Label' }}</label>
    <input :value="model" type="number" class="text-prima-red bg-gray-100 font-semibold px-2 py-1 border border-prima-red" :placeholder="placeholder" @input="handleInput">
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  placeholder?: string
}>()
const model = defineModel<number | undefined>()
function handleInput(event: Event) {
  const input = event.target as HTMLInputElement
  model.value = input.value === '' ? undefined : Number(input.value)
}
</script>
