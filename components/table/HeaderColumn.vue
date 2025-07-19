<template>
  <div 
    class="flex items-center justify-center shrink-0 whitespace-nowrap border-l first:border-l-0 border-white p-1 cursor-pointer select-none" 
    :class="column.flex" 
    @click="handleSort(column.key)"
  >
    <span>{{ column.label }}</span>
    <div class="flex items-center duration-300" :class="sortBy.includes(column.key) ? 'w-5 opacity-100' : 'w-0 opacity-0'">
      <Icon v-if="sortBy.includes(column.key)" name="carbon:chevron-down" class="shrink-0 inline-block ml-1 duration-300" :class="{ '-rotate-180': !sortBy.includes('-')}" size="20" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  column: TableColumn
  sortBy: string
}>()

const emit = defineEmits<{
  sort: [column: string]
}>()

function handleSort(column: string) {
  emit('sort', column)
}
</script>