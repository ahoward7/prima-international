<template>
  <div class="flex flex-col gap-2 relative min-w-[1400px] overflow-x-auto">
    <div class="flex justify-center">
      <TablePagination v-model:page="page" :page-size="pageSize" :total="machines?.total || 0" />
    </div>
    <div v-show="!machines">
      <div class="w-full top-0 h-8 bg-prima-red" />
      <div v-for="p in pageSize" class="w-full top-0 odd:bg-gray-200 border-b border-x border-gray-400" :class="displayFormat === 'oneLine' ? 'h-[33px]' : 'h-[66px]'" />
    </div>
    <table v-show="machines" class="border-x border-b border-gray-400 !font-jbmono">
      <thead>
        <tr>
          <TableHeaderColumn
            v-for="column in filteredColumns"
            :key="column.key"
            :column="column"
            :sort-by="sortBy"
            @sort="handleSort"
          />
        </tr>
      </thead>
      <tbody>
        <template v-if="displayFormat === 'oneLine'">
          <TableRow
            v-for="machine in machines?.data"
            :key="machine.m_id"
            :machine="machine"
            :columns="filteredColumns"
            @select="selectMachine(machine)"
          />
        </template>
        <template v-else>
          <TableRowTwoLine
            v-for="machine, index in machines?.data"
            :key="machine.m_id"
            :machine="machine"
            :columns="filteredColumns"
            :display-format="displayFormat"
            :index="index"
            @select="selectMachine(machine)"
          />
        </template>
      </tbody>
    </table>
    <div class="flex justify-center">
      <TablePagination v-model:page="page" :page-size="pageSize" :total="machines?.total || 0" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMachineStore } from '~~/stores/machine'
const machineStore = useMachineStore()

const sortBy = defineModel('sortBy', { type: String, default: 'model' })
const page = defineModel('page', { default: 1 })

const props = defineProps<{
  machines?: { data: Machine[], total: number }
  displayFormat: string
  pageSize: number
}>()

const columns: TableColumnC[] = [
  { key: 'model', label: 'Model', sort: true },
  { key: 'serialNumber', label: 'Serial#', sort: true },
  { key: 'type', label: 'Type', sort: true },
  { key: 'year', label: 'Year', sort: true },
  { key: 'hours', label: 'Hours', sort: true },
  { key: 'description', label: 'Desc', sort: false },
  { key: 'price', label: 'Price', sort: true },
  { key: 'contact.company', label: 'Comp', sort: false },
  { key: 'lastModDate', label: 'Date', sort: true },
  { key: 'location', label: 'Location', sort: false },
  { key: 'notes', label: 'Notes', sort: false },
  { key: 'salesman', label: 'Sm', sort: false },
]

const filteredColumns = computed(() => props.displayFormat === 'oneLine' ? columns : columns.filter(column => !['Description', 'Notes'].includes(column.label)))

function handleSort(column: string) {
  sortBy.value = sortBy.value === column ? `-${column}` : column
}

function selectMachine(machine: Machine) {
  machineStore.setMachine(machine)
  navigateTo(`/detail/?id=${machine.m_id}`)
}
</script>
