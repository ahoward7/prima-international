<template>
  <div class="flex flex-col gap-1">
    <label class="text-prima-red font-semibold">Type</label>
    <select class="h-[34px] bg-gray-100 px-1 border border-prima-red" @change="selectType">
      <option v-for="type in types">
        {{ type }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
const selectedType = defineModel<string>()

const types = ['All', 'WL', 'OHT', 'ADT', 'TTT', 'EX', 'MG']

function selectType(event: Event) {
  const target = event.target as HTMLSelectElement
  selectedType.value = target.value
}
</script>