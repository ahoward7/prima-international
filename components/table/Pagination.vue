<template>
  <div class="flex text-prima-red">
    <Icon name="carbon:chevron-left" size="28" class="cursor-pointer" />
    <Icon name="carbon:chevron-right" size="28" class="cursor-pointer" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  pageSize: number
  page: number
}>()
</script>