<template>
  <div class="odd:bg-gray-200">
    <div class="flex w-full border-b border-gray-400">
      <div v-if="displayFormat === 'twoLine'" class="text-prima-red font-bold p-1" :class="columns[0].flex">
        {{ machine.model }}
      </div>
      <div>
        <div class="flex w-full">
          <template v-for="column in columns" :key="column.key">
            <div v-if="displayFormat !== 'twoLine' || column.key !== 'model'"
              class="shrink-0 border-l border-gray-400 p-1 overflow-hidden"
              :class="[column.flex, displayFormat === 'oneLine' ? 'first:border-l-0' : '']">
              <span class="block truncate w-full" :title="getFullValue(column.key)">
                {{ getDisplayValue(column.key) }}
              </span>
            </div>
          </template>
        </div>
        <div v-if="displayFormat === 'twoLine'" class="grid grid-cols-2">
          <div class="p-1">
            <label class="font-bold">Description: </label>
            <span>{{ machine.description }}</span>
          </div>
          <div class="p-1 border-l">
            <label class="font-bold">Notes: </label>
            <span>{{ machine.notes }}</span>
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
</script>
