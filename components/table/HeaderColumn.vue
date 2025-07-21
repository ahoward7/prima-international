<template>
  <th @click="handleSort(column.key)" class="bg-prima-red text-white py-1 border-l first:border-l-0 border-white" :class="isSorting ? 'px-2' : 'px-5'">
    <div class="flex justify-center cursor-pointer select-none">
      <span>{{ column.label }}</span>
      <div v-if="isSorting" class="flex items-center">
        <Icon v-if="sortBy.includes('-')" name="carbon:chevron-down" class="shrink-0 inline-block ml-1" size="20" />
        <Icon v-else name="carbon:chevron-up" class="shrink-0 inline-block ml-1" size="20" />
      </div>
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