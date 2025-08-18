<template>
  <div class="relative flex flex-col gap-1">
    <label v-if="label" class="text-prima-red dark:text-prima-dark-accent font-semibold">{{ label || 'No Label' }}</label>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFileChange"
    >
    <div
      class="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800  border border-dashed border-prima-red dark:border-prima-dark-accent rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
      @click="triggerFileInput"
    >
      <template v-if="preview">
        <img :src="preview" alt="Image preview" class="max-h-32 rounded border border-prima-red dark:border-prima-dark-accent">
      </template>
      <template v-else>
        <span class="text-prima-red dark:text-prima-dark-accent opacity-60">Click to select an image</span>
      </template>
    </div>
    <InputMessage v-show="message" class="absolute top-[65px]">
      {{ message }}
    </InputMessage>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  message?: string
}>()
const emit = defineEmits(['input', 'focus'])
const preview = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

function triggerFileInput() {
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64 = e.target?.result as string
    preview.value = base64
    emit('input', base64)
  }
  reader.readAsDataURL(file)
}
</script>
