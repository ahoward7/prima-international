<template>
  <div class="odd:bg-gray-200">
    <div class="flex w-full border-b border-gray-400">
      <div v-for="column in columns" :key="column.key" class="shrink-0 border-l first:border-l-0 border-gray-400 p-1 overflow-hidden" :class="column.flex">
        <span class="block truncate w-full" :title="getFullValue(column.key)">
          {{ getDisplayValue(column.key) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  machine: Machine
  columns: TableColumn[]
}>()

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

function getFullValue(key: string): string {
  if (key === 'year') {
    return props.machine[key] ? props.machine[key].substring(0, 8) : 'NONE';
  }
  else if (key === 'lastModDate') {
    return props.machine[key] ? props.machine[key].substring(0, 8) : 'NONE';
  }
  else {
    const value = getNestedValue(props.machine, key);
    return value || 'NONE';
  }
}

function getDisplayValue(key: string): string {
  return getFullValue(key);
}
</script>
