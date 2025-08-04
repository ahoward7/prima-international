<template>
  <div class="relative flex items-center justify-center" tabindex="1" @focus="showConfirm = true" @focusout="showConfirm = false" @click.capture="showConfirm = true">
    <slot />
    <div v-if="showConfirm" class="w-[52px] absolute top-6 right-[-4px] z-10 flex justify-center gap-1 bg-white border border-prima-red">
      <Icon name="carbon:close" class="text-red-600" size="24" @click="showConfirm = false" />
      <Icon name="carbon:checkmark" class="text-green-600" size="24" @click="emit('confirm')" />
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['confirm'])

const showConfirm = ref(false)
</script>