<template>
  <th @click="handleSort(column.key)" class="bg-prima-red text-white px-2 py-1 border-l first:border-l-0 border-white">
    <div class="flex justify-center cursor-pointer select-none">
      <div class="duration-300" :class="isSorting ? 'w-0' : 'w-[10px]'" />
      <span>{{ column.label }}</span>
      <div class="flex items-center duration-300" :class="isSorting ? 'w-5 opacity-100' : 'w-0 opacity-0'">
        <Icon name="carbon:chevron-down" class="shrink-0 inline-block ml-1 duration-300" :class="{ '-rotate-180': !sortBy.includes('-')}" size="20" />
      </div>
      <div class="duration-300" :class="isSorting ? 'w-0' : 'w-[10px]'" />
    </div>
  </th> 
</template>

<script setup lang="ts">
const props = defineProps<{
  column: TableColumnC
  sortBy: string
}>()

const emit = defineEmits<{
  sort: [column: string]
}>()

function handleSort(column: string) {
  emit('sort', column)
}

const isSorting = computed(() => props.sortBy.includes(props.column.key))
</script>