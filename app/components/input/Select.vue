<template>
  <div class="flex flex-col gap-1" :class="width">
    <label class="text-prima-red font-semibold">{{ label }}</label>

    <div ref="dropdownRef" class="relative">
      <div class="bg-gray-100 border border-prima-red px-2 py-1 flex justify-between items-center cursor-pointer" @click="toggleDropdown">
        <span class="select-none text-prima-red font-semibold">{{ selectedLabel || 'Select...' }}</span>
        <Icon name="carbon:chevron-down" class="text-prima-red" size="20" />
      </div>

      <!-- Dropdown Panel -->
      <div v-if="isOpen" class="absolute z-10 bg-white border border-prima-red mt-1 w-full max-h-80 overflow-auto shadow-md">
        <!-- Search Input -->
        <input v-model="search" type="text" placeholder="Search..." class="w-full px-2 py-1 border-b border-gray-200 outline-none" @input="emit('search', search)">

        <!-- Options -->
        <div v-for="(option, index) in filteredOptions" :key="index" class="px-2 py-1 cursor-pointer hover:bg-gray-100" @click="selectOption(option)">
          {{ option.label }}
        </div>

        <!-- No Results -->
        <div v-if="filteredOptions.length === 0" class="px-2 py-2 text-center">
          <div class="text-gray-400 mb-2">
            No results found.
          </div>
          <button v-if="createable" class="w-full bg-prima-red text-white px-2 py-1 cursor-pointer" @click="createNewOption">
            Add <span class="uppercase">"{{ search }}"</span>
          </button>
        </div>
      </div>

      <!-- Clear Button -->
      <Icon v-if="clearable && selectedOption !== options[0]?.data" name="carbon:close" class="absolute right-7 top-2 text-prima-red cursor-pointer" size="20" @click="resetSelection" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

const props = withDefaults(defineProps<{
  label: string
  options?: FilterOption[]
  clearable?: boolean
  width?: string
  createable?: boolean
}>(), {
  options: () => [] as FilterOption[],
  clearable: true,
  width: 'w-48',
  createable: false
})
const emit = defineEmits(['search', 'select', 'create', 'clear'])
const selectedOption = defineModel<string | number>()
const dropdownRef = ref(null)
const isOpen = ref(false)
const search = ref('')
const createdOption = ref()

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function selectOption(option: FilterOption) {
  selectedOption.value = option.data
  isOpen.value = false
  search.value = ''
  emit('select', option.data)
}

function resetSelection() {
  selectedOption.value = props.options[0]?.data
  search.value = ''
  emit('clear')
}

const allOptions = computed(() => createdOption.value ? [createdOption.value, ...props.options] : props.options)

const selectedLabel = computed(() => allOptions.value.find(o => o.data === selectedOption.value)?.label || '')

const filteredOptions = computed(() => allOptions.value.filter(option =>
  option.label.toLowerCase().includes(search.value.toLowerCase())
))

function createNewOption() {
  if (!search.value.trim()) return

  const newOption = search.value.trim().toUpperCase()

  createdOption.value = {
    label: newOption,
    data: newOption
  }

  selectedOption.value = createdOption.value.data

  isOpen.value = false
  search.value = ''
}

onClickOutside(dropdownRef, () => {
  isOpen.value = false
})
</script>
