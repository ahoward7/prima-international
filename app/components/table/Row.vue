<template>
  <tr class="even:bg-gray-200 border-b border-gray-400">
    <td v-for="column in columns" :key="column.key" class="border-l px-1 py-1 border-gray-400" :class="column.key === 'salesman' ? 'w-6' : ''">
      <div v-if="column.key === 'model'" class="border-l-0 cursor-pointer whitespace-nowrap" @click="emit('select')">
        {{ getNestedValue(machine, column.key) }}
      </div>
      <div v-else-if="['price', 'hours'].includes(column.key)" class="h-6 overflow-hidden text-right">
        ${{ formatCommas(getNestedValue(machine, column.key) as number) }}
      </div>
      <div v-else-if="column.key === 'year'" class="h-6 overflow-hidden text-right">
        {{ getNestedValue(machine, column.key ) }}
      </div>
      <div v-else-if="column.key === 'notes'" class="h-6 overflow-hidden" v-text="machine.notes" />
      <div v-else-if="column.key === 'lastModDate'">
        {{ isoToMMDDYYYY(machine.lastModDate) }}
      </div>
      <div v-else class="h-6 overflow-hidden" :class="column.key === 'description' ? 'min-w-80' : ''">
        {{ getNestedValue(machine, column.key) }}
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
</script>