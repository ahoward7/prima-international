<template>
  <tr class="even:bg-gray-200 border-b border-gray-400 cursor-pointer">
    <td
      v-for="column in columns"
      :key="column.key"
      class="border-l px-1 py-1 border-gray-400"
      :class="column.key === 'salesman' ? 'w-6' : ''"
      @click="column.key ? selectMachine() : ''" 
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
      <div v-else-if="column.key === 'notes'" class="h-6 overflow-hidden max-w-[420px]" v-text="getNestedValue(machine, column.key)" />
      <div v-else-if="column.key === 'lastModDate'">
        {{ isoToMMDDYYYY(getNestedValue(machine, column.key) as string) }}
      </div>
      <div v-else-if="column.key === ''" class="flex justify-around gap-1 items-center">
        <ConfirmationIconButton @confirm="''">
          <Icon name="carbon:currency-dollar" size="20" class="text-green-600" />
        </ConfirmationIconButton>
        <ConfirmationIconButton @confirm="''">
          <Icon name="carbon:volume-file-storage" size="20" class="text-blue-600" />
        </ConfirmationIconButton>
        <ConfirmationIconButton @confirm="''">
          <Icon name="carbon:trash-can" size="20" class="text-red-600" />
        </ConfirmationIconButton>
      </div>
      <div v-else class="h-6 overflow-hidden" :class="column.key === 'description' ? 'min-w-80' : ''">
        {{ getNestedValue(machine, column.key) }}
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { useMachineStore } from '~~/stores/machine'

const props = defineProps<{
  machine: Machine | Omit<Machine, 'm_id'>
  columns: TableColumnC[]
  machineId?: string
}>()

const { filters } = storeToRefs(useMachineStore())

function selectMachine() {
  if (props.machineId) {
    navigateTo(`/detail/?id=${props.machineId}&location=${filters.value.location}`)
  }
}
</script>