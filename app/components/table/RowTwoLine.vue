<template>
  <tr class="border-b border-gray-400" :class="rowClass">
    <td rowspan="2" class="text-center font-bold px-1 py-1 cursor-pointer whitespace-nowrap" @click="emit('select')">
      {{ getFullValue(machine, 'model') }}
    </td>
    <td v-for="column in filteredColumns" :key="column.key" class="border-l px-1 py-1 border-gray-400">
      <div v-if="['price', 'hours'].includes(column.key)" class="h-6 overflow-hidden text-right">
        {{ formatCommas(getFullValue(machine, column.key) as number) }}
      </div>
      <div v-else-if="column.key === 'year'" class="h-6 overflow-hidden text-right">
        {{ getFullValue(machine, column.key )}}
      </div>
      <div v-else-if="column.key === 'notes'" class="h-6 overflow-hidden" v-text="machine.notes" />
      <div v-else-if="column.key === 'lastModDate'">
        {{ isoToMMDDYYYY(machine.lastModDate) }}
      </div>
      <div v-else class="h-6 overflow-hidden" :class="[column.key === 'description' ? 'min-w-80' : '', column.label === 'Model' ? 'font-bold' : '']">
        {{ getFullValue(machine, column.key) }}
      </div>
    </td>
  </tr>
  
  <tr class="border-b border-gray-400" :class="rowClass">
    <td colspan="5" class="px-1 py-1 border-l border-gray-400">
      <div :class="displayClass">
        <span class="font-bold">Description: </span>
        <span>{{ machine.description }}</span>
      </div>
    </td>
    <td colspan="5" class="px-1 py-1 border-l border-gray-400">
      <div :class="displayClass">
        <span class="font-bold">Notes: </span>
        <span>{{ machine.notes || 'No notes available' }}</span>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
const props = defineProps<{
  machine: Machine
  columns: TableColumnC[]
  displayFormat: string
  index: number
}>()

const emit = defineEmits(['select'])

const filteredColumns = computed(() => props.columns.filter(column => column.label !== 'Model'))
const rowClass = props.index % 2 === 1 ? 'bg-gray-200' : 'bg-gray-50'
const displayClass = computed(() => props.displayFormat === "twoLine" ? '' : 'h-6 overflow-hidden')

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

function isoToMMDDYYYY(isoString: string = ''): string {
  const date = new Date(isoString)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}
</script>