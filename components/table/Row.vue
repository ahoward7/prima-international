<template>
  <tr class="even:bg-gray-200 border-b border-gray-400">
    <td v-for="column in columns" :key="column.key" class="border-l px-1 py-1 border-gray-400" :class="column.key === 'salesman' ? 'w-6' : ''">
      <div v-if="column.key === 'model'" class="border-l-0 cursor-pointer" @click="emit('select')">
        {{ getFullValue(machine, column.key) }}
      </div>
      <div v-else-if="['price', 'hours'].includes(column.key)" class="h-6 overflow-hidden">
        {{ formatCommas(parseInt(getFullValue(machine, column.key))) }}
      </div>
      <div v-else class="h-6 overflow-hidden">
        {{ getFullValue(machine, column.key) }}
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
defineProps<{
  machine: Machine
  columns: TableColumnC[]
}>()

const emit = defineEmits(['select'])

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

function formatCommas(num: number = 0): string {
  if (!num) {
    return ''
  }

  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}
</script>