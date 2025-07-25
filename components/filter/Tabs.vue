<template>
  <div class="flex gap-4">
    <FilterTab v-for="option in options" :key="option.data" :active-tab="activeTab" :option="option" @click="setActiveTab(option)" />
  </div>
</template>

<script setup lang="ts">
const activeTab = defineModel({ required: false })

defineProps<{
  options: FilterOption[]
}>()

const emit = defineEmits(['select'])

function setActiveTab(option: FilterOption) {
  activeTab.value = option.data
  emit('select', option)
}
</script>