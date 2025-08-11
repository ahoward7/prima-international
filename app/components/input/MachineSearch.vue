<template>
  <div>
    <InputText v-model="searchInput" label="Universal" placeholder="Search anything..." />
    <div class="relative">
      <div v-if="searchInput.length !== 0" class="absolute z-10 w-full overflow-auto border-r border-gray-400">
        <table class="table-auto w-full text-sm">
          <thead class="bg-gray-200 text-prima-red">
            <tr>
              <th class="border-l border-b border-gray-400 p-1 w-28">
                Model
              </th>
              <th class="border-l border-b border-gray-400 p-1 w-28">
                Serial#
              </th>
              <th class="border-l border-b border-gray-400 p-1 w-20">
                Year
              </th>
              <th class="border-l border-b border-gray-400 p-1 w-20">
                Hours
              </th>
              <th class="border-l border-b border-gray-400 p-1 w-24">
                Price
              </th>
              <th class="border-l border-b border-gray-400 p-1 w-20">
                Last Modified
              </th>
              <th class="border-l border-b border-gray-400 p-1 w-48">
                Location
              </th>
              <th class="border-l border-b border-gray-400 p-1 w-48">
                Company
              </th>
              <th class="border-l border-b border-gray-400 p-1 w-20">
                Salesman
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-if="machines?.data.length && machines?.data.length > 0">
              <tr v-for="machine in machines?.data" :key="machine.m_id" class="cursor-pointer hover:bg-gray-300 bg-gray-100" @click="selectMachine(machine)">
                <td class="border-l border-b border-gray-400 p-1 font-bold whitespace-nowrap">
                  {{ machine.model }}
                </td>
                <td class="border-l border-b border-gray-400 p-1 whitespace-nowrap">
                  {{ machine.serialNumber }}
                </td>
                <td class="border-l border-b border-gray-400 p-1 whitespace-nowrap">
                  {{ machine.year || 'NONE' }}
                </td>
                <td class="border-l border-b border-gray-400 p-1 whitespace-nowrap">
                  {{ machine.hours }}
                </td>
                <td class="border-l border-b border-gray-400 p-1 whitespace-nowrap">
                  ${{ machine.price }}
                </td>
                <td class="border-l border-b border-gray-400 p-1 whitespace-nowrap">
                  {{ machine.lastModDate }}
                </td>
                <td class="border-l border-b border-gray-400 p-1 whitespace-nowrap">
                  {{ machine.location ? clampString(machine.location, 24) : 'NONE' }}
                </td>
                <td class="border-l border-b border-gray-400 p-1 whitespace-nowrap">
                  {{ machine.contact?.company || 'NONE' }}
                </td>
                <td class="border-l border-b border-gray-400 p-1 whitespace-nowrap">
                  {{ machine.salesman }}
                </td>
              </tr>
            </template>
            <tr v-else-if="!pending" class="font-bold bg-gray-100 border-b border-l border-gray-400">
              <td colspan="9" class="p-1 font-bold">
                No results
              </td>
            </tr>
          </tbody>
        </table>
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
}, 200)

watch(searchInput, (newValue) => {
  debouncedSearch(newValue)
})

const { data: machinesEnvelope, pending } = await useFetch<{ data: ApiData<Machine> }>(
  '/api/machines',
  {
    method: 'GET',
    query: filters,
    watch: [filters],
    lazy: true
  }
)
const machines = computed(() => machinesEnvelope.value?.data)

function clampString(str: string, maxLength: number, suffix: string = '...') {
  if (typeof str !== 'string') {
    throw new TypeError('First argument must be a string')
  }
  
  if (typeof maxLength !== 'number' || maxLength < 0) {
    throw new Error('maxLength must be a non-negative number')
  }
  
  if (str.length <= maxLength) {
    return str
  }
  
  const truncateLength = Math.max(0, maxLength - suffix.length)
  return str.substring(0, truncateLength) + suffix
}

function selectMachine(machine: Machine) {
  emit('select', machine)
  searchInput.value = ''
}
</script>