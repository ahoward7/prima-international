<template>
  <tr class="even:bg-gray-200 border-b border-gray-400 cursor-pointer">
    <td
      v-for="column in columns"
      :key="column.key"
      class="border-l px-1 py-1 border-gray-400"
      :class="column.key === 'salesman' ? 'w-6' : ''"
      @click="column.key ? emit('select') : ''" 
    >
      <div v-if="column.key === 'hours'" class="h-6 overflow-hidden text-right">
        {{ formatCommas(getNestedValue(machine, column.key) as number) }}
      </div>
      <div v-else-if="column.key === 'price'" class="h-6 overflow-hidden text-right">
        {{ formatPrice(getNestedValue(machine, column.key) as number) }}
      </div>
      <div v-else-if="column.key === 'year'" class="h-6 overflow-hidden text-right">
        {{ getNestedValue(machine, column.key ) }}
      </div>
      <div v-else-if="column.key === 'notes'" class="h-6 overflow-hidden max-w-[420px]" v-text="machine.notes" />
      <div v-else-if="column.key === 'lastModDate'">
        {{ isoToMMDDYYYY(machine.lastModDate) }}
      </div>
      <div v-else-if="column.key === ''" class="flex gap-1 items-center">
        <Icon name="carbon:pen" size="20" class="rounded-full text-yellow-600" />
        <Icon name="carbon:currency-dollar" size="20" class="rounded-full text-green-600" />
        <Icon name="carbon:volume-file-storage" size="20" class="rounded-full text-blue-600" />
        <Icon name="carbon:trash-can" size="20" class="rounded-full text-red-600" />
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