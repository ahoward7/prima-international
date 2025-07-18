<template>
  <div class="flex flex-col gap-1">
    <label class="text-prima-red font-semibold">Model</label>
    <select class="h-[34px] bg-gray-100 border border-prima-red">
      <option v-for="model in models">
        {{ model }}
      </option>
    </select>
  </div>
</template>

<script setup lang='ts'>
const models = ['All', '988K', '775E ', 'A40D', 'D9T', '950GC', '772G ', 'WA9003EO', '950M', '775F', '924K', '777G', '544L', '785C', '773G', '772', '336FL', '14M' ]
</script>