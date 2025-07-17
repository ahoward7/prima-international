<template>
  <div class="w-full flex justify-center text-lg font-semibold px-3 py-2 cursor-pointer border border-prima-red" :class="isActive ? 'text-white bg-prima-red' : 'text-prima-red bg-gray-100'">
    {{ `${category.substring(0, 1).toUpperCase()}${category.substring(1)}` }}
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  category: string
  activeTab: string
}>()

const isActive = computed(() => props.activeTab === props.category)
</script>
