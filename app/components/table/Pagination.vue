<template>
  <div class="flex items-center text-prima-red">
    <div class="flex" @click="page = 1">
      <Icon name="carbon:chevron-left" size="24" class="-mr-2 cursor-pointer" />
      <Icon name="carbon:chevron-left" size="24" class="-ml-2 cursor-pointer" />
    </div>

    <Icon name="carbon:chevron-left" size="24" class="cursor-pointer" @click="decPage" />

    <div class="w-60 flex justify-center gap-2 text-lg">
      <template v-for="dp in displayPages" :key="dp">
        <span
          v-if="typeof dp === 'number'"
          class="w-8 h-8 flex justify-center items-center cursor-pointer rounded-md"
          :class="page === dp ? 'bg-prima-red text-white' : 'hover:bg-prima-red hover:text-white'"
          @click="page = dp"
        >
          {{ dp }}
        </span>
        <span v-else>
          ...
        </span>
      </template>
    </div>

    <Icon name="carbon:chevron-right" size="24" class="cursor-pointer" @click="incPage" />
    
    <div class="flex" @click="page = pageCount">
      <Icon name="carbon:chevron-right" size="24" class="-mr-2 cursor-pointer" />
      <Icon name="carbon:chevron-right" size="24" class="-ml-2 cursor-pointer" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  pageSize: number
  total: number
}>()

const page = defineModel<number>('page', { required: true})

const pageCount = computed(() => Math.ceil(props.total / props.pageSize))
const computedPageSize = computed(() => props.pageSize)
const computedTotal = computed(() => props.total)

function getDisplayPages() {
  const pages = []
  const pc = Math.ceil(props.total / props.pageSize)
  const p = page.value
  
  pages.push(1)
  
  if (p > 4) {
    pages.push('e')
  }
  
  const start = Math.max(2, p - 1)
  const end = Math.min(pc - 1, p + 1)

  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) {
      pages.push(i)
    }
  }
  
  if (p < pc - 3) {
    pages.push('e')
  }
  
  if (pc > 1 && !pages.includes(pc)) {
    pages.push(pc)
  }

  return pages
}

const displayPages = ref(getDisplayPages())

watch([page, computedPageSize, computedTotal], () => {
  displayPages.value = getDisplayPages()
})

function decPage() {
  if (page.value > 1) {
    page.value = page.value - 1
  }
}

function incPage() {
  if (page.value < pageCount.value) {
    page.value = page.value + 1
  }
}
</script>