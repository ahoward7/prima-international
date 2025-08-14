<template>
  <div class="w-68 min-h-24 flex flex-col items-center gap-2 border px-4 py-4" :class="[backgroundColor(), borderColor()]">
    <span class="font-semibold" :class="[headerColor()]">{{ header() }}</span>
    <span class="text-center">{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  type: string
  message: string
}>()

const header = () => {
  if (props.type === 'success') {
    return 'Success'
  }
  if (props.type === 'warning') {
    return 'Warning'
  }
  if (props.type === 'error') {
    return 'Error'
  }
}

const headerColor = () => {
  if (props.type === 'success') {
    return 'text-green-600'
  }
  if (props.type === 'warning') {
    return 'text-prima-yellow'
  }
  if (props.type === 'error') {
    return 'text-red-600'
  }
}

const backgroundColor = () => {
  if (props.type === 'success') {
    return 'bg-green-50'
  }
  if (props.type === 'warning') {
    return 'bg-yellow-50'
  }
  if (props.type === 'error') {
    return 'bg-red-50'
  }
}

const borderColor = () => {
  if (props.type === 'success') {
    return 'border-green-600'
  }
  if (props.type === 'warning') {
    return 'border-prima-yellow'
  }
  if (props.type === 'error') {
    return 'border-red-600'
  }
}
</script>