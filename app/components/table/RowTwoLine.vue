<template>
  <tr class="border-b border-gray-400" :class="rowClass">
    <td rowspan="2" class="text-center font-bold px-1 py-1 cursor-pointer whitespace-nowrap" @click="emit('select')">
      {{ getNestedValue(machine, 'model') }}
    </td>
    <td v-for="column in filteredColumns" :key="column.key" class="border-l px-1 py-1 border-gray-400">
      <div v-if="['price', 'hours'].includes(column.key)" class="h-6 overflow-hidden text-right">
        {{ formatCommas(getNestedValue(machine, column.key) as number) }}
      </div>
      <div v-else-if="column.key === 'year'" class="h-6 overflow-hidden text-right">
        {{ getNestedValue(machine, column.key )}}
      </div>
      <div v-else-if="column.key === 'notes'" class="h-6 overflow-hidden" v-text="machine.notes" />
      <div v-else-if="column.key === 'lastModDate'">
        {{ isoToMMDDYYYY(machine.lastModDate) }}
      </div>
      <div v-else class="h-6 overflow-hidden" :class="[column.key === 'description' ? 'min-w-80' : '', column.label === 'Model' ? 'font-bold' : '']">
        {{ getNestedValue(machine, column.key) }}
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
</script>