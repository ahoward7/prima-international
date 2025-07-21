<template>
  <tr class="even:bg-gray-200 border-b border-gray-400">
    <td v-for="column in columns" :key="column.key" class="border-l px-1 py-1 border-gray-400 first:border-l-0">
      <div class="h-6 overflow-hidden" :class="column.label === 'Model' ? 'font-bold' : ''">
        {{ getFullValue(machine, column.key) }}
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
const props = defineProps<{
  machine: Machine
  columns: TableColumnC[]
}>()

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null
  }, obj)
}

function getFullValue(machine: Machine, key: string): string {
  if (key === 'year') {
    return machine[key] ? machine[key].substring(0, 8) : 'NONE'
  }
  else if (key === 'lastModDate') {
    return machine[key] ? machine[key].substring(0, 8) : 'NONE'
  }
  else {
    const value = getNestedValue(machine, key)
    return value || 'NONE'
  }
}
</script>