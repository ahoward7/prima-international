<template>
  <div class="flex flex-col gap-1">
    <label class="text-prima-red font-semibold">{{ label }}</label>
    <div class="relative">
      <select ref="selectRef" class="h-[34px] bg-gray-100 px-1 pr-4 border border-prima-red" :class="width" @change="selectOption">
        <option v-for="option, index in options" :selected="index === selectedIndex" :disabled="clearable && index === 0">
          {{ option.label }}
        </option>
      </select>
      <Icon 
        v-if="clearable && selectedOption && selectedOption !== options[0]?.data" 
        name="carbon:close" 
        class="absolute right-5 top-2 text-prima-red cursor-pointer" 
        size="20" 
        @click="resetSelection" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const selectedOption = defineModel<string | number>()
const selectRef = ref<HTMLSelectElement>()

interface SelectOption {
  label: string
  data: string | number
}

const props = withDefaults(defineProps<{
  label: string
  options: SelectOption[]
  clearable?: boolean
  selectedIndex?: number
  width?: string
}>(), {
  clearable: true,
  selectedIndex: 0,
  width: 'w-44'
})

function selectOption(event: Event) {
  const target = event.target as HTMLSelectElement
  const foundOption = props.options.find(option => option.label === target.value)
  selectedOption.value = foundOption?.data
}

function resetSelection() {
  selectedOption.value = props.options[0]?.data
  if (selectRef.value) {
    selectRef.value.selectedIndex = 0
  }
}
</script>