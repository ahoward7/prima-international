<template>
  <div class="flex flex-col gap-1">
    <label class="text-prima-red font-semibold">{{ label || 'No Label' }}</label>
    <div class="relative">
      <span class="absolute left-2 top-1/2 -translate-y-1/2 text-prima-red">$</span>
      <input
        :value="model"
        type="number"
        class="pl-5 text-prima-red bg-gray-100 px-2 py-1 border border-prima-red w-full"
        :placeholder="placeholder"
        @input="handleInput"
      >
    </div>
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
