<template>
  <div class="flex flex-col gap-1">
    <label class="text-prima-red font-semibold">Type</label>
    <select class="h-[34px] bg-gray-100 border border-prima-red">
      <option v-for="type in types">
        {{ type }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
const types = ['All', 'WL', 'OHT', 'ADT', 'TTT', 'EX', 'MG']
</script>