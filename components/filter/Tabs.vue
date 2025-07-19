<template>
  <div class="flex gap-4">
    <FilterTab v-for="option in options" :key="option" :active-tab="activeTab" :option="option" @click="activeTab = option" />
  </div>
</template>

<script setup lang="ts">
const activeTab = defineModel<string>({ required: true })

defineProps<{
  options: string[]
}>()
</script>