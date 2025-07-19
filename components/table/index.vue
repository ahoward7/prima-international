<template>
  <div class="flex flex-col border-t border-x border-prima-red min-w-[870px] font-[consolas] overflow-hidden">
    <div class="w-full flex text-white font-extrabold text-sm bg-prima-red border-b border-white">
      <TableHeaderColumn v-for="column in visibleColumns" :key="column.key" :column="column" :sort-by="sortBy" @sort="handleSort" />
    </div>
    <TableRow v-if="machines" v-for="machine in machines" :key="machine.serialNumber" :machine="machine" :columns="visibleColumns" :display-format="displayFormat" />
  </div>
</template>

<script setup lang="ts">
const sortBy = defineModel('sortBy', { type: String, default: 'model' })

const props = defineProps<{
  machines?: Machine[],
  displayFormat: string
}>()

const allColumns: TableColumn[] = [
  { key: 'model', label: 'Model', flex: 'basis-24 grow-0' },
  { key: 'serialNumber', label: 'Serial#', flex: 'basis-28 grow-0' },
  { key: 'year', label: 'Year', flex: 'basis-20 grow-0' },
  { key: 'hours', label: 'Hours', flex: 'basis-20 grow-0' },
  { key: 'price', label: 'Price', flex: 'basis-24 grow-0' },
  { key: 'lastModDate', label: 'Date', flex: 'basis-20 grow-0' },
  { key: 'location', label: 'Location', flex: `basis-48 ${props.displayFormat === 'oneLine' ? 'grow-0' : 'grow'}` },
  { key: 'description', label: 'Description', flex: 'basis-48 grow' },
  { key: 'salesman', label: 'Salesman', flex: 'basis-24 grow-0' },
  { key: 'contact.company', label: 'Company', flex: 'max-w-60 basis-48 grow' },
  { key: 'contact.name', label: 'Contact', flex: 'max-w-60 basis-40 grow' },
  { key: 'notes', label: 'Notes', flex: 'basis-48 grow' },
]

const visibleColumns = computed(() => {
  if (props.displayFormat === 'twoLine') {
    return allColumns.filter(col => !['description', 'notes'].includes(col.key))
  }
  return allColumns
})

function handleSort(column: string) {
  sortBy.value = sortBy.value === column ? `-${column}` : column
}
</script>
