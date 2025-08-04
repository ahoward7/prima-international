<template>
  <Button class="relative" tabindex="1" @focus="showConfirm = true" @focusout="showConfirm = false" @click.capture="showConfirm = true">
    <slot />
    <div v-if="showConfirm" class="w-full absolute left-0 top-12 flex justify-center gap-1">
      <Icon name="carbon:close" class="text-red-600" size="28" @click="showConfirm = false" />
      <Icon name="carbon:checkmark" class="text-green-600" size="28" @click="emit('confirm')" />
    </div>
  </Button>
</template>

<script setup lang="ts">
const emit = defineEmits(['confirm'])

const showConfirm = ref(false)
</script>