<template>
  <div class="odd:bg-gray-200">
    <div class="flex w-full border-b border-gray-400">
      <div class="flex justify-center items-center shrink-0 text-prima-red font-bold p-1" :class="columns[0].flex">
        {{ machine.model }}
      </div>
      <div class="w-full">
        <div class="flex w-full">
          <div v-for="column in columnsWithoutModel" :key="column.key" class="border-l border-gray-400 p-1 overflow-hidden" :class="column.flex">
            <span class="block w-full whitespace-nowrap" :title="getFullValue(column.key)">
              {{ getDisplayValue(column.key) }}
            </span>
          </div>
        </div>
        <div class="grid grid-cols-2">
          <div class="flex gap-1 p-1 border-l border-t border-gray-400">
            <label class="font-bold">Description:</label>
            <span :class="displayFormat === 'twoLineTruncated' ? 'truncate' : ''">{{ machine.description }}</span>
          </div>
          <div class="flex gap-1 p-1 border-l border-t border-gray-400">
            <label class="font-bold">Notes:</label>
            <span :class="displayFormat === 'twoLineTruncated' ? 'truncate' : ''">{{ machine.notes }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  machine: Machine
  columns: TableColumn[]
  displayFormat: string
}>()

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

function getFullValue(key: string): string {
  if (key === 'year') {
    return props.machine[key] ? props.machine[key].substring(0, 8) : 'NONE';
  }
  else if (key === 'lastModDate') {
    return props.machine[key] ? props.machine[key].substring(0, 8) : 'NONE';
  }
  else {
    const value = getNestedValue(props.machine, key);
    return value || 'NONE';
  }
}

function getDisplayValue(key: string): string {
  return getFullValue(key);
}

const columnsWithoutModel = computed(() => props.columns.filter(column => column.key !== 'model'));
</script>
