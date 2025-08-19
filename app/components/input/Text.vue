<template>
  <div class="relative flex flex-col gap-1">
    <label v-if="label" class="text-prima-red dark:text-prima-dark-accent font-semibold">{{ label || 'No Label' }}</label>
    <input
      v-model="model"
      type="text"
      class="text-prima-red dark:text-prima-dark-accent bg-gray-100 dark:bg-gray-800 px-2 py-1 border border-prima-red dark:border-prima-dark-accent" :class="[
        props.uppercase ? 'uppercase' : ''
      ]"
      :placeholder="placeholder"
      @focus="emit('focus')"
      @input="onInput"
    >
    <InputMessage v-show="message" class="absolute top-[65px]">
      {{ message }}
    </InputMessage>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  label?: string
  placeholder?: string
  message?: string
  uppercase?: boolean
}>(), {
  uppercase: false
})

const emit = defineEmits(['focus', 'input'])
const model = defineModel<string>()

function onInput() {
  if (props.uppercase && typeof model.value === 'string') {
    const up = model.value.toUpperCase()
    if (up !== model.value) model.value = up
  }
  emit('input', model.value)
}
</script>

<style scoped>
/* Keep placeholder text in its original case even when the input uses the
   `uppercase` utility (which sets text-transform: uppercase). */
input.uppercase::placeholder {
  text-transform: none;
}

/* Vendor-prefixed fallbacks for older browsers */
input.uppercase::-webkit-input-placeholder { text-transform: none; }
input.uppercase::-moz-placeholder { text-transform: none; }
input.uppercase:-ms-input-placeholder { text-transform: none; }
input.uppercase::-ms-input-placeholder { text-transform: none; }
</style>
