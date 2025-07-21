<template>
  <div class="min-w-[1400px] overflow-x-auto">
    <table class="font-[consolas] border-x border-b border-gray-400">
      <thead>
        <tr>
          <TablecHeaderColumn v-for="column in columns" :key="column.key" :column="column" :sort-by="sortBy" @sort="handleSort" />
        </tr>
      </thead>
      <tbody>
        <TablecRow v-for="machine in machines" :key="machine.serialNumber" :machine="machine" :columns="columns" />
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
const sortBy = defineModel('sortBy', { type: String, default: 'model' })

const props = defineProps<{
  machines: Machine[] | null,
}>()

const columns: TableColumnC[] = [
  { key: 'model', label: 'Model' },
  { key: 'serialNumber', label: 'Serial#' },
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

function handleSort(column: string) {
  sortBy.value = sortBy.value === column ? `-${column}` : column
}
</script>
