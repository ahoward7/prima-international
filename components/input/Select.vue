<template>
  <div class="flex flex-col gap-1" :class="width">
    <label class="text-prima-red font-semibold">{{ label }}</label>

    <div ref="dropdownRef" class="relative">
      <div class="bg-gray-100 border border-prima-red px-2 py-1 flex justify-between items-center cursor-pointer" @click="toggleDropdown">
        <span class="select-none">{{ selectedLabel || 'Select...' }}</span>
        <Icon name="carbon:chevron-down" class="text-prima-red" />
      </div>

      <!-- Dropdown Panel -->
      <div v-if="isOpen" class="absolute z-10 bg-white border border-prima-red mt-1 w-full max-h-80 overflow-auto shadow-md">
        <!-- Search Input -->
        <input v-model="searchTerm" type="text" placeholder="Search..." class="w-full px-2 py-1 border-b border-gray-200 outline-none" />

        <!-- Options -->
        <div v-for="(option, index) in filteredOptions" :key="index" @click="selectOption(option)" class="px-2 py-1 cursor-pointer hover:bg-gray-100">
          {{ option.label }}
        </div>

        <!-- No Results -->
        <div v-if="filteredOptions.length === 0" class="px-2 py-1 text-gray-400">
          No results found.
        </div>
      </div>

      <!-- Clear Button -->
      <Icon v-if="clearable && selectedOption !== options[0]?.data" name="carbon:close" class="absolute right-2 top-2 text-prima-red cursor-pointer" size="20" @click="resetSelection"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

const selectedOption = defineModel<string | number>()
const dropdownRef = ref(null)
const isOpen = ref(false)
const searchTerm = ref('')

const props = withDefaults(defineProps<{
  label: string
  options: FilterOption[]
  clearable?: boolean
  width?: string
}>(), {
  clearable: true,
  width: 'w-44'
})

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function selectOption(option: FilterOption) {
  selectedOption.value = option.data
  isOpen.value = false
  searchTerm.value = ''
}

function resetSelection() {
  selectedOption.value = props.options[0]?.data
  searchTerm.value = ''
}

const selectedLabel = computed(() => {
  return props.options.find(o => o.data === selectedOption.value)?.label || ''
})

const filteredOptions = computed(() =>
  props.options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
)

onClickOutside(dropdownRef, () => {
  isOpen.value = false
})
</script>
