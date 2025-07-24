<template>
  <div class="flex flex-col gap-1">
    <label class="text-prima-red font-semibold">{{ label }}</label>
    <select class="h-[34px] bg-gray-100 px-1 border border-prima-red" @change="selectOption">
      <option v-for="option, index in options" :selected="index === 0" :disabled="index === 0">
        {{ option.label }}
      </option>
    </select>
    {{ selectedOption.value }}
  </div>
</template>

<script setup lang="ts">
const selectedOption = defineModel<string>()

interface SelectOption {
  label: string
  data: string
}

const props = defineProps<{
  label: string
  options: SelectOption[]
}>()

function selectOption(event: Event) {
  const target = event.target as HTMLSelectElement
  selectedOption.value = props.options.find(option => option.label === target.value).data
}
</script>