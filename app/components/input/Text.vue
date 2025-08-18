<template>
  <div class="relative flex flex-col gap-1">
    <label v-if="label" class="text-prima-red dark:text-prima-dark-accent font-semibold">{{ label || 'No Label' }}</label>
    <input v-model="model" type="text" class="text-prima-red dark:text-prima-dark-accent bg-gray-100 dark:bg-gray-800  px-2 py-1 border border-prima-red dark:border-prima-dark-accent" :placeholder="placeholder" @focus="emit('focus')" @input="emit('input')">
    <InputMessage v-show="message" class="absolute top-[65px]">
      {{ message }}
    </InputMessage>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  placeholder?: string
  message?: string
}>()
const emit = defineEmits(['focus', 'input'])

const model = defineModel<string>()

</script>
