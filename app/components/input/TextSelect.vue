<template>
  <div ref="dropdownRef" class="relative flex flex-col gap-1" :class="width">
    <label class="text-prima-red font-semibold">{{ label }}</label>

    <!-- InputText replaces the trigger div -->
    <InputText
      v-model="search"
      :placeholder="placeholder"
      @focus="openDropdown"
      @keydown.down.prevent="navigate(1)"
      @keydown.up.prevent="navigate(-1)"
      @keydown.enter.prevent="selectHighlighted"
      @keydown.tab="isOpen = false"
      @input="emit('search', search)"
    />

    <!-- Dropdown Panel -->
    <div v-if="isOpen" tabindex="-1" class="absolute top-[58px] z-10 bg-white border border-prima-red mt-1 w-full max-h-80 overflow-auto shadow-md">
      <!-- Options -->
      <div
        v-for="(option, index) in filteredOptions"
        :key="index"
        class="px-2 py-1 cursor-pointer"
        :class="{
          'bg-gray-100': index === highlightedIndex,
          'hover:bg-gray-100': index !== highlightedIndex
        }"
        @click="selectOption(option)"
      >
        {{ option.label }}
      </div>

      <!-- No Results -->
      <div v-if="filteredOptions.length === 0" class="px-2 py-2 text-center">
        <div class="text-gray-400 mb-2">
          No results found.
        </div>
      </div>
    </div>

    <!-- Clear Button -->
    <Icon
      v-if="clearable && selectedOption !== options[0]?.data && search"
      name="carbon:close"
      class="absolute right-2 top-9 text-prima-red cursor-pointer"
      size="20"
      @click="resetSelection"
    />
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

const props = withDefaults(
  defineProps<{
    label: string
    options?: FilterOption[]
    clearable?: boolean
    width?: string
    createable?: boolean
    placeholder?: string
  }>(),
  {
    options: () => [],
    clearable: true,
    width: 'w-48',
    createable: false,
    placeholder: 'Search...'
  }
)

const emit = defineEmits(['search', 'select', 'create', 'clear'])
const selectedOption = defineModel<string | number>()
const search = ref('')
const isOpen = ref(false)
const createdOption = ref<FilterOption>()
const highlightedIndex = ref(0)

const dropdownRef = ref(null)
onClickOutside(dropdownRef, () => (isOpen.value = false))

const allOptions = computed(() =>
  createdOption.value ? [createdOption.value, ...props.options] : props.options
)

const filteredOptions = computed(() =>
  allOptions.value.filter(option =>
    option.label.toLowerCase().includes(search.value.toLowerCase())
  )
)

const openDropdown = () => {
  isOpen.value = true
  highlightedIndex.value = 0
}

const selectOption = (option: FilterOption) => {
  selectedOption.value = option.data
  search.value = option.label
  isOpen.value = false
  emit('select', option.data)
}

const resetSelection = () => {
  selectedOption.value = ''
  search.value = ''
  emit('clear')
}

// Keyboard navigation
const navigate = (direction: 1 | -1) => {
  if (!isOpen.value || filteredOptions.value.length === 0) return
  const newIndex = highlightedIndex.value + direction
  if (newIndex < 0) highlightedIndex.value = filteredOptions.value.length - 1
  else if (newIndex >= filteredOptions.value.length) highlightedIndex.value = 0
  else highlightedIndex.value = newIndex
}

const selectHighlighted = () => {
  if (!isOpen.value || filteredOptions.value.length === 0) return
  selectOption(filteredOptions.value[highlightedIndex.value] as FilterOption)
}

// Watch for external model changes and update search label accordingly
watch(
  () => selectedOption.value,
  (val) => {
    const selected = allOptions.value.find(o => o.data === val)
    if (selected) search.value = selected.label
  },
  { immediate: true }
)
</script>
