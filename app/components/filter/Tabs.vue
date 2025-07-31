<template>
  <div class="flex gap-4">
    <FilterTab v-for="option in options" :key="option.data" :active-tab="activeTab" :option="option" @click="setActiveTab(option)" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  options: FilterOption[]
}>()

const emit = defineEmits(['select'])

const activeTab = defineModel<string>({ required: true })

function setActiveTab(option: FilterOption) {
  activeTab.value = option.data as string
  emit('select', option)
}
</script>