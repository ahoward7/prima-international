<template>
  <div class="w-full flex justify-between gap-4">
    <FilterTab v-for="category in categories" :key="category" :active-tab="activeTab" :category="category" @click="activeTab = category" />
  </div>
</template>

<script setup lang="ts">
const activeTab = defineModel<string>({ required: true })

defineProps<{
  categories: string[]
}>()
</script>