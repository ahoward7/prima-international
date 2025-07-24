<template>
  <tr class="border-b border-gray-400" :class="rowClass">
    <td rowspan="2" class="text-center font-bold px-1 py-1 cursor-pointer" @click="emit('select')">
      {{ getFullValue(machine, 'model') }}
    </td>
    <td v-for="column in filteredColumns" :key="column.key" class="border-l px-1 py-1 border-gray-400">
      <div class="h-6 overflow-hidden" :class="column.label === 'Model' ? 'font-bold' : ''">
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

function getFullValue(machine: Machine, key: string): string {
  const value = getNestedValue(machine, key)
  return value || 'NONE'
}
</script>