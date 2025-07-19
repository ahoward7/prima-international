<!-- TableRow.vue -->
<template>
  <div class="text-sm font-semibold even:bg-gray-200 odd:bg-gray-50">
    <div class="flex w-full border-b border-prima-red">
      <div class="basis-24 grow-0 shrink-0 flex justify-center items-center text-lg font-extrabold text-prima-red p-1">
        {{ machine.model }}
      </div>
      <div class="flex-1">
        <div class="flex w-full border-b border-gray-400 bg-prima-red/10">
          <TableColumn v-for="column in columns.filter(c => c.key !== 'model')" :key="column.key" :column="column" :machine="machine" />
        </div>
        <div>
          <div class="grid grid-cols-2">
            <div class="border-l border-gray-400 p-1">
              <span class="font-bold">Description: </span>
              <span>{{ machine.description || 'NONE' }}</span>
            </div>
            <div class="border-l border-gray-400 p-1">
              <span class="font-bold">Notes: </span>
              <span>{{ machine.notes || 'NONE' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  machine: MachineFilters
  columns: Column[]
}>()
</script>
