<template>
  <div ref="dropdownRef" class="relative flex flex-col gap-1" :class="width">
    <label class="text-prima-red dark:text-prima-dark-accent font-semibold">
      {{ label }}
      {{ createdOption && createdOption.label === selectedOption ? '(new)' : '' }}
    </label>
    
    <InputText
      v-model="search"
      :placeholder="placeholder"
      :uppercase="uppercase"
      @focus="openDropdown"
      @keydown.down.prevent="navigate(1)"
      @keydown.up.prevent="navigate(-1)"
      @keydown.enter.exact.prevent="selectHighlighted"
      @keydown.shift.enter.exact.prevent="handleShiftEnter"
      @keydown.tab="selectHighlighted"
      @input="emitSearch"
    />

    <template v-if="createable">
      <span class="h-0 indent-2 text-xs opacity-70">Create = Shift + Enter</span>
    </template>
    
    <div v-if="isOpen" tabindex="-1" class="absolute top-[58px] z-10 bg-white dark:bg-gray-800 border border-prima-red dark:border-prima-dark-accent mt-1 w-full max-h-80 overflow-auto shadow-md">
      <div
        v-for="(option, index) in filteredOptions"
        :key="index"
        class="px-2 py-1 cursor-pointer"
        :class="{
          'bg-gray-100 dark:bg-gray-700 ': index === highlightedIndex,
          'hover:bg-gray-100 hover:dark:bg-gray-700 ': index !== highlightedIndex
        }"
        @click="selectOption(option)"
      >
        {{ option.label }}
      </div>
      
      <div v-if="filteredOptions.length === 0" class="px-2 py-2 text-center">
        <div class="text-gray-400 mb-2">
          No results found.
        </div>
      </div>
    </div>
    
    <Icon
      v-if="clearable && selectedOption && search"
      name="carbon:close"
      class="absolute right-2 top-9 text-prima-red dark:text-prima-dark-accent cursor-pointer"
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
    uppercase?: boolean
  }>(),
  {
    options: () => [],
    clearable: true,
    width: 'w-48',
    createable: false,
    placeholder: 'Search...',
    uppercase: false
  }
)

const emit = defineEmits(['search', 'select', 'clear'])
const selectedOption = defineModel<string | number>()
const search = ref(selectedOption.value as string)
const isOpen = ref(false)
const createdOption = ref<FilterOption>()
const highlightedIndex = ref(0)

const dropdownRef = ref(null)
onClickOutside(dropdownRef, () => (isOpen.value = false))

const allOptions = computed(() => {
  return createdOption.value ? [createdOption.value, ...props.options] : props.options
})

const filteredOptions = computed(() => {
  return allOptions.value.filter(option =>
    option.label.toLowerCase().includes(search.value?.toLowerCase())
  )
})

function openDropdown() {
  isOpen.value = true
  highlightedIndex.value = 0
}

function emitSearch() {
  isOpen.value = true
  emit('search', search.value)
}

function selectOption(option: FilterOption) {
  selectedOption.value = option.data
  search.value = option.label
  isOpen.value = false
  emit('select', option.data)
}

function resetSelection() {
  selectedOption.value = ''
  search.value = ''
  emit('clear')
}

function navigate(direction: 1 | -1) {
  if (!isOpen.value || filteredOptions.value.length === 0) return
  const newIndex = highlightedIndex.value + direction
  if (newIndex < 0) highlightedIndex.value = filteredOptions.value.length - 1
  else if (newIndex >= filteredOptions.value.length) highlightedIndex.value = 0
  else highlightedIndex.value = newIndex
}

function selectHighlighted() {
  if (!isOpen.value || filteredOptions.value.length === 0) return
  selectOption(filteredOptions.value[highlightedIndex.value] as FilterOption)
}

function handleShiftEnter() {
  if (!props.createable) return

  const val = search.value?.trim()
  if (!val) return

  const newOption = {
    label: val,
    data: val
  } as FilterOption

  createdOption.value = newOption

  selectOption(newOption)
}

watch(
  () => selectedOption.value,
  (val) => {
    const selected = allOptions.value.find(o => o.data === val)
    if (selected) search.value = selected.label
    if (!selectedOption.value) search.value = ''

    if (selectedOption.value !== 'new') {
      search.value = selectedOption.value as string
    }
  },
  { immediate: true }
)
</script>
