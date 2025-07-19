<template>
  <div class="w-24 text-center font-semibold px-2 py-1 cursor-pointer border border-prima-red" :class="isActive ? 'text-white bg-prima-red' : 'text-prima-red bg-gray-100'">
    {{ startCase(option) }}
  </div>
</template>

<script setup lang="ts">
import { startCase } from 'lodash'

const props = defineProps<{
  option: string
  activeTab: string
}>()

const isActive = computed(() => props.activeTab === props.option)
</script>
