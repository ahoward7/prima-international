<template>
  <div class="min-w-24 text-center font-semibold px-2 py-1 cursor-pointer border border-prima-red" :class="isActive ? 'text-white bg-prima-red' : 'text-prima-red bg-prima-red-100'">
    {{ titleCase(option.label) }}
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  option: FilterOption
  activeTab: string
}>()

const isActive = computed(() => props.activeTab === props.option.data)
</script>
