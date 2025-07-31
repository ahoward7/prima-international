<template>
  <tr
    class="border-b border-gray-400 cursor-pointer"
    :class="[rowClass, isHovered ? 'bg-gray-300' : '']"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="emit('select')"
  >
    <td v-for="column in columns" :key="column.key" class="border-l px-1 py-1 border-gray-400">
      <div v-if="column.key === 'hours'" class="h-6 overflow-hidden text-right">
        {{ formatCommas(getNestedValue(machine, column.key) as number) }}
      </div>
      <div v-else-if="column.key === 'price'" class="h-6 overflow-hidden text-right">
        {{ formatPrice(getNestedValue(machine, column.key) as number) }}
      </div>
      <div v-else-if="column.key === 'year'" class="h-6 overflow-hidden text-right">
        {{ getNestedValue(machine, column.key) }}
      </div>
      <div v-else-if="column.key === 'notes'" class="h-6 overflow-hidden" v-text="machine.notes" />
      <div v-else-if="column.key === 'lastModDate'">
        {{ isoToMMDDYYYY(machine.lastModDate) }}
      </div>
      <div
        v-else
        class="h-6 overflow-hidden"
        :class="[column.key === 'description' ? 'min-w-80' : '', column.label === 'Model' ? 'font-bold' : '']"
      >
        {{ getNestedValue(machine, column.key) }}
      </div>
    </td>
  </tr>

  <tr
    class="border-b border-gray-400 cursor-pointer"
    :class="[rowClass, isHovered ? 'bg-gray-300' : '']"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="emit('select')"
  >
    <td colspan="5" class="px-1 py-1 border-l border-gray-400">
      <div :class="displayClass">
        <span class="!font-robconbold">Description: </span>
        <span>{{ machine.description }}</span>
      </div>
    </td>
    <td colspan="6" class="px-1 py-1 border-l border-gray-400">
      <div :class="displayClass">
        <span class="!font-robconbold">Notes: </span>
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

const isHovered = ref(false)

const rowClass = props.index % 2 === 1 ? 'bg-gray-200' : 'bg-gray-50'
const displayClass = computed(() => props.displayFormat === "twoLine" ? '' : 'h-6 overflow-hidden')
</script>