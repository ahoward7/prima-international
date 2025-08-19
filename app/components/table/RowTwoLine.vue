<template>
  <tr class="border-b border-gray-400 cursor-pointer" :class="[rowClass, isHovered ? 'bg-prima-red-200 dark:bg-prima-red' : '']" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave" @click="selectMachine(machineId)">
    <td v-for="column in columns" :key="column.key" class="border-l px-1 py-1 border-gray-400" :class="!column.key ? 'w-20' : ''">
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
      <div v-else-if="column.key === ''" class="flex justify-around gap-1 items-center">
        <Icon name="carbon:currency-dollar" size="20" class="text-green-600" @click="navigateTo(`/detail/?id=${machineId}&location=${filters.location}&selling=1`)" />
        <ButtonConfirmationIcon v-if="filters.location !== 'archived'" @confirm="archiveMachine(machine as Machine)">
          <Icon name="carbon:volume-file-storage" size="20" class="text-blue-600" />
        </ButtonConfirmationIcon>
        <ButtonConfirmationIcon @confirm="deleteMachine(machineId)">
          <Icon name="carbon:trash-can" size="20" class="text-red-600" />
        </ButtonConfirmationIcon>
      </div>
      <div v-else class="h-6 overflow-hidden" :class="[column.key === 'description' ? 'min-w-80' : '']">
        {{ getNestedValue(machine, column.key) }}
      </div>
    </td>
  </tr>

  <tr class="border-b border-gray-400 cursor-pointer" :class="[rowClass, isHovered ? 'bg-prima-red-200 dark:bg-prima-red' : '']" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave" @click="selectMachine(machineId)">
    <td colspan="6" class="px-1 py-1 border-l border-gray-400">
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
import { computed, ref } from 'vue'
import { useMachineStore } from '~~/stores/machine'

const props = defineProps<{
  machine: Machine | Omit<Machine, 'm_id'>
  columns: TableColumnC[]
  displayFormat: string
  index: number
  machineId: string
}>()

const { filters } = useMachineStore()

const isHovered = ref(false)
const onMouseEnter = () => { isHovered.value = true }
const onMouseLeave = () => { isHovered.value = false }

const rowClass = computed(() => props.index % 2 === 1 ? 'bg-gray-200 dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900')
const displayClass = computed(() => props.displayFormat === 'twoLine' ? '' : 'h-6 overflow-hidden')
</script>