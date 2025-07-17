<template>
  <div class="w-full grid grid-cols-4 gap-4">
    <FilterTab v-for="category in categories" :key="category" :active-tab="activeTab" :category="category" @click="activeTab = category" />
  </div>
</template>

<script setup lang="ts">
const categories = ref<MachineCategory[]>(['located', 'sold', 'archived', 'all'])

const activeTab = defineModel<MachineCategory>({ required: true })
</script>