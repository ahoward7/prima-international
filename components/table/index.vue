<template>
  <div class="min-w-[1400px] overflow-x-auto">
    <table class="font-[consolas] border-x border-b border-gray-400">
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
            v-for="machine in machines"
            :key="machine.serialNumber"
            :machine="machine"
            :columns="filteredColumns"
            @select="selectMachine(machine)"
          />
        </template>
        <template v-else>
          <TableRowTwoLine
            v-for="machine, index in machines"
            :key="machine.serialNumber"
            :machine="machine"
            :columns="filteredColumns"
            :display-format="displayFormat"
            :index="index"
            @select="selectMachine(machine)"
          />
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
const machineStore = useMachineStore()

const sortBy = defineModel('sortBy', { type: String, default: 'model' })

const props = defineProps<{
  machines: Machine[] | null,
  displayFormat: string
}>()

const columns: TableColumnC[] = [
  { key: 'model', label: 'Model' },
  { key: 'serialNumber', label: 'Serial#' },
  { key: 'type', label: 'Type' },
  { key: 'year', label: 'Year' },
  { key: 'hours', label: 'Hours' },
  { key: 'price', label: 'Price' },
  { key: 'lastModDate', label: 'Date' },
  { key: 'location', label: 'Location' },
  { key: 'description', label: 'Description' },
  { key: 'salesman', label: 'Salesman' },
  { key: 'contact.company', label: 'Company' },
  { key: 'contact.name', label: 'Contact' },
  { key: 'notes', label: 'Notes' },
]

const filteredColumns = computed(() => props.displayFormat === 'oneLine' ? columns : columns.filter(column => !['Description', 'Notes'].includes(column.label)))

function handleSort(column: string) {
  sortBy.value = sortBy.value === column ? `-${column}` : column
}

function selectMachine(machine: Machine) {
  machineStore.setMachine(machine)
  navigateTo('/view')
}
</script>
