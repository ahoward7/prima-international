<template>
  <div class="flex flex-col gap-1">
    <label class="text-prima-red font-semibold">{{ label || 'No Label' }}</label>
    <div class="relative w-full">
      <span
        v-if="price"
        class="absolute left-2 top-1/2 -translate-y-1/2 text-prima-red"
      >$</span>
      <input
        :value="displayValue"
        type="text"
        inputmode="decimal"
        class="bg-gray-100 px-2 py-1 border border-prima-red text-prima-red w-full" :class="[
          price ? 'pl-4' : ''
        ]"
        :placeholder="placeholder"
        @input="handleInput"
        @keypress="validateKey"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label?: string
  placeholder?: string
  commas?: boolean
  price?: boolean
}>()
const model = defineModel<number | undefined>()
const rawValue = ref('')

function handleInput(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value
  const parsed = props.commas ? unformatNumber(value) : Number(value)
  model.value = value === '' || Number.isNaN(parsed) ? undefined : parsed
  rawValue.value = value
}

const displayValue = computed(() => {
  if (props.commas) {
    return formatNumber(model.value)
  }
  return rawValue.value ?? ''
})

watch(model, (val) => {
  rawValue.value = props.commas ? formatNumber(val) : val?.toString() ?? ''
}, { immediate: true })

function validateKey(event: KeyboardEvent) {
  const allowedKeys = props.commas ? ['0','1','2','3','4','5','6','7','8','9','.', ','] : ['0','1','2','3','4','5','6','7','8','9','.']
  if (!allowedKeys.includes(event.key)) {
    event.preventDefault()
  }
}

</script>
