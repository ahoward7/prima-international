<template>
  <div class="flex flex-col border-t border-x border-prima-red min-w-[870px] font-[consolas]">
    <div class="w-full flex text-white font-extrabold text-sm bg-prima-red border-b border-white">
      <div v-for="column in columns" class="shrink-0 text-center whitespace-nowrap border-l border-white p-1 cursor-pointer select-none" :class="column.width" @click="handleSort(column.key)">
        <span>{{ column.label }}</span>
      </div>
    </div>
    <div v-if="machines" v-for="machine in machines" class="text-sm font-semibold even:bg-gray-200 odd:bg-gray-50">
      <div class="flex w-full border-b border-prima-red">
         <div class="w-24 shrink-0 flex justify-center items-center text-lg font-extrabold text-prima-red p-1">
          {{ machine.model }}
        </div>
        <div class="flex-1">
          <div class="flex w-full border-b border-gray-400 bg-prima-red/10">
            <div v-for="column in columns.filter(c => c.key !== 'model')" class="shrink-0 text-center whitespace-nowrap border-l border-gray-400 p-1" :class="column.width">
              <template v-if="column.key === 'serial'">
                {{ machine.serialNumber }}
              </template>
              <template v-else-if="column.key === 'year'">
                {{ machine[column.key] ? machine[column.key].substring(0, 8) : 'NONE' }}
              </template>
              <template v-else-if="column.key === 'lastModDate'">
                {{ machine[column.key].substring(0, 8) }}
              </template>
              <template v-else-if="column.key === 'location'">
                {{ machine[column.key] ? clampString(machine[column.key], 24) : 'NONE' }}
              </template>
              <template v-else>
                {{ getNestedValue(machine, column.key) || 'NONE' }}
              </template>
            </div>
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
  </div>
</template>

<script setup lang="ts">
const sortBy = defineModel('sortBy', { type: String, default: 'model' })

const props = defineProps<{
  machines?: Machine[]
}>()

const columns = [
  { key: 'model', label: 'Model', width: 'w-24' },
  { key: 'serial', label: 'Serial#', width: 'w-28' },
  { key: 'year', label: 'Year', width: 'w-20' },
  { key: 'hours', label: 'Hours', width: 'w-20' },
  { key: 'price', label: 'Price', width: 'w-24' },
  { key: 'lastModDate', label: 'Date', width: 'w-20' },
  { key: 'location', label: 'Location', width: 'w-48' },
  { key: 'salesman', label: 'Salesman', width: 'w-20' },
  { key: 'contact.company', label: 'Company', width: 'w-48' },
  { key: 'contact.name', label: 'Contact', width: 'w-40' },
]

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

function clampString(str: string, maxLength: number, suffix: string = '...') {
  if (typeof str !== 'string') {
    throw new Error('First argument must be a string');
  }
  
  if (typeof maxLength !== 'number' || maxLength < 0) {
    throw new Error('maxLength must be a non-negative number');
  }
  
  if (str.length <= maxLength) {
    return str;
  }
  
  const truncateLength = Math.max(0, maxLength - suffix.length);
  return str.substring(0, truncateLength) + suffix;
}

function handleSort(column: string) {
  if (sortBy.value === column) {
    sortBy.value = `-${column}`
  } else {
    sortBy.value = column
  }
}
</script>
