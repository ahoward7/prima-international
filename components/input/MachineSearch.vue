<template>
  <div>
    <InputText v-model="searchInput" label="Universal" placeholder="Search anything..." />
    <div class="relative">
      <div v-if="searchInput.length !== 0" class="absolute w-full">
        <div v-for="machine in machines" @click="selectMachine(machine)">
          <div class="flex w-full bg-gray-200 hover:bg-gray-300 border-b border-r border-gray-400 cursor-pointer">
            <div class="w-28 shrink-0 whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.serialNumber }}
            </div>
            <div class="w-20 shrink-0 whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.year ? machine.year.substring(0, 8) : 'NONE' }}
            </div>
            <div class="w-20 shrink-0 whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.hours }}
            </div>
            <div class="w-24 shrink-0 whitespace-nowrap border-l border-gray-400 p-1">
              ${{ machine.price }}
            </div>
            <div class="w-20 shrink-0 whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.createDate.substring(0, 8) }}
            </div>
            <div class="w-48 shrink-0 whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.location ? clampString(machine.location, 24) : 'NONE' }}
            </div>
            <div class="w-20 shrink-0 whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.salesman }}
            </div>
            <div class="w-48 shrink-0 whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.contact?.company || 'NONE' }}
            </div>
            <div class="w-40 shrink-0 whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.contact?.name || 'NONE' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const emit = defineEmits(['select'])

const filters = ref<MachineFilters>({
  search: '',
  pageSize: 10
})

const searchInput = ref('')

const debouncedSearch = useDebounceFn((value: string) => {
  filters.value.search = value
}, 300)

watch(searchInput, (newValue) => {
  debouncedSearch(newValue)
})

const { data: machines } = await useFetch<Machine[]>('/machine', {
  method: 'GET', 
  query: filters,
  watch: [filters]
})

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

function selectMachine(machine: Machine) {
  emit('select', machine)
  searchInput.value = ''
}
</script>