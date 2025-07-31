<template>
  <th
    class="bg-prima-red text-white py-1 border-l first:border-l-0 border-white"
    :class="[isSorting ? 'px-1' : 'px-4', column.key === 'salesman' ? 'w-10' : '']"
    @click="handleSort(column.key)"
  >
    <div class="flex justify-center select-none" :class="column.sort ? 'cursor-pointer' : ''">
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
  if (props.column.sort) {
    emit('sort', column)
  }
}

const isSorting = computed(() => props.column.sort && props.sortBy.includes(props.column.key))
</script>