<template>
  <tr class="even:bg-gray-200 border-b border-gray-400">
    <td v-for="column in columns" :key="column.key" class="border-l px-1 py-1 border-gray-400" :class="column.key === 'salesman' ? 'w-6' : ''">
      <div v-if="column.key === 'model'" class="border-l-0 cursor-pointer whitespace-nowrap" @click="emit('select')">
        {{ getFullValue(machine, column.key) }}
      </div>
      <div v-else-if="['price', 'hours'].includes(column.key)" class="h-6 overflow-hidden text-right">
        {{ formatCommas(getFullValue(machine, column.key) as number) }}
      </div>
      <div v-else-if="column.key === 'year'" class="h-6 overflow-hidden text-right">
        {{ getFullValue(machine, column.key )}}
      </div>
      <div v-else-if="column.key === 'notes'" class="h-6 overflow-hidden" v-text="machine.notes" />
      <div v-else-if="column.key === 'lastModDate'">
        {{ isoToMMDDYYYY(machine.lastModDate) }}
      </div>
      <div v-else class="h-6 overflow-hidden" :class="column.key === 'description' ? 'min-w-80' : ''">
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

function getFullValue(machine: Machine, key: string): string | number {
  const value = getNestedValue(machine, key)
  return value || 'NONE'
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

function isoToMMDDYYYY(isoString: string): string {
  const date = new Date(isoString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}
</script>