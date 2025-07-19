<template>
  <div class="shrink-0 whitespace-nowrap border-l border-gray-400 p-1" :class="column.flex">
    <template v-if="column.key === 'year'">
      {{ machine[column.key] ? machine[column.key].substring(0, 8) : 'NONE' }}
    </template>
    <template v-else-if="column.key === 'lastModDate'">
      {{ machine[column.key].substring(0, 8) }}
    </template>
    <template v-else-if="column.key === 'location'">
      {{ machine[column.key] ? clampString(machine[column.key], 23) : 'NONE' }}
    </template>
    <template v-else-if="column.key === 'description'">
      {{ machine[column.key] ? clampString(machine[column.key], 30) : 'NONE' }}
    </template>
    <template v-else-if="column.key === 'notes'">
      {{ machine[column.key] ? clampString(machine[column.key], 30) : 'NONE' }}
    </template>
    <template v-else>
      {{ getNestedValue(machine, column.key) || 'NONE' }}
    </template>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  column: TableColumn
  machine: Machine
}>()

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

function clampString(str: string, maxLength: number, suffix: string = '...') {
  if (typeof str !== 'string') {
    throw new Error('First argument must be a string');
  }
  
  if (typeof maxLength !== 'number' || maxLength < 0) {
    throw new Error('maxLength must be a non-negative number');
  }
  
  if (str.length <= maxLength) {
    return str;
  }
  
  const truncateLength = Math.max(0, maxLength - suffix.length);
  return str.substring(0, truncateLength) + suffix;
}
</script>