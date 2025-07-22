<template>
  <div class="flex flex-col gap-1">
    <label class="text-prima-red font-semibold">Location</label>
    <select class="h-[34px] bg-gray-100 px-1 border border-prima-red" @change="selectLocation">
      <option v-for="location in locations">
        {{ location }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
const selectedType = defineModel<string>()

const locations = ['All', 'Located', 'Sold', 'Archived']

function selectLocation(event: Event) {
  const target = event.target as HTMLSelectElement
  selectedType.value = target.value
}
</script>