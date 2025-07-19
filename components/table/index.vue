<template>
  <div class="flex flex-col border-t border-x border-prima-red min-w-[870px] font-[consolas]">
    <div class="w-full flex text-white font-extrabold text-sm bg-prima-red border-b border-white">
      <div v-for="column in columns" class="flex items-center justify-center shrink-0 whitespace-nowrap border-l first:border-l-0 border-white p-1 cursor-pointer select-none" :class="column.flex" @click="handleSort(column.key)">
        <span>{{ column.label }}</span>
        <div class="flex items-center duration-300" :class="sortBy.includes(column.key) ? 'w-5 opacity-100' : 'w-0 opacity-0'">
          <Icon v-if="sortBy.includes(column.key)" name="carbon:chevron-down" class="shrink-0 inline-block ml-1 duration-300" :class="{ '-rotate-180': sortBy.includes('-')}" size="20" />
        </div>
      </div>
    </div>
    <div v-if="machines" v-for="machine in machines" class="text-sm font-semibold even:bg-gray-200 odd:bg-gray-50">
      <div class="flex w-full border-b border-prima-red">
         <div class="basis-24 grow-0 shrink-0 flex justify-center items-center text-lg font-extrabold text-prima-red p-1">
          {{ machine.model }}
        </div>
        <div class="flex-1">
          <div class="flex w-full border-b border-gray-400 bg-prima-red/10">
            <div v-for="column in columns.filter(c => c.key !== 'model')" class="shrink-0 text-center whitespace-nowrap border-l border-gray-400 p-1" :class="column.flex">
              <template v-if="column.key === 'year'">
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
  { key: 'model', label: 'Model', flex: 'basis-24 grow-0' },
  { key: 'serialNumber', label: 'Serial#', flex: 'basis-28 grow-0' },
  { key: 'year', label: 'Year', flex: 'basis-20 grow-0' },
  { key: 'hours', label: 'Hours', flex: 'basis-20 grow-0' },
  { key: 'price', label: 'Price', flex: 'basis-24 grow-0' },
  { key: 'lastModDate', label: 'Date', flex: 'basis-20 grow-0' },
  { key: 'location', label: 'Location', flex: 'basis-48 grow' },
  { key: 'salesman', label: 'Salesman', flex: 'basis-24 grow-0' },
  { key: 'contact.company', label: 'Company', flex: 'basis-48 grow' },
  { key: 'contact.name', label: 'Contact', flex: 'basis-40 grow' },
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
