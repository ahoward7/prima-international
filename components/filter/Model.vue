<template>
  <div class="flex flex-col gap-1">
    <label class="text-prima-red font-semibold">Model</label>
    <select class="h-[34px] bg-gray-100 px-1 border border-prima-red" @change="selectModel">
      <option v-for="model in models">
        {{ model }}
      </option>
    </select>
  </div>
</template>

<script setup lang='ts'>
const selectedModel = defineModel()

const models = ['All', '988K', '775E ', 'A40D', 'D9T', '950GC', '772G ', 'WA9003EO', '950M', '775F', '924K', '777G', '544L', '785C', '773G', '772', '336FL', '14M' ]

function selectModel(event: Event) {
  const target = event.target as HTMLSelectElement
  selectedModel.value = target.value
}
</script>