<template>
  <div class="flex items-center text-prima-red">
    <div class="flex" @click="page = 1">
      <Icon name="carbon:chevron-left" size="28" class="-mr-2 cursor-pointer" />
      <Icon name="carbon:chevron-left" size="28" class="-ml-2 cursor-pointer" />
    </div>

    <Icon name="carbon:chevron-left" size="28" class="cursor-pointer" @click="decPage" />

    <div class="w-60 flex justify-center gap-2 text-xl pb-0.5">
      <template v-for="dp in displayPages" >
        <span
          v-if="typeof dp === 'number'"
          @click="page = dp"
          class="w-8 h-8 flex justify-center items-center pb-0.5 cursor-pointer rounded-md"
          :class="page === dp ? 'bg-prima-red text-white' : 'hover:bg-prima-red hover:text-white'"
        >
          {{ dp }}
        </span>
        <span v-else>
          ...
        </span>
      </template>
    </div>

    <Icon name="carbon:chevron-right" size="28" class="cursor-pointer" @click="incPage" />
    
    <div class="flex" @click="page = pageCount">
      <Icon name="carbon:chevron-right" size="28" class="-mr-2 cursor-pointer" />
      <Icon name="carbon:chevron-right" size="28" class="-ml-2 cursor-pointer" />
    </div>
  </div>
</template>

<script setup lang="ts">
const page = defineModel<number>('page')

const props = defineProps<{
  pageSize: number
  total: number
}>()

const pageCount = computed(() => Math.ceil(props.total / props.pageSize))
const computedPageSize = computed(() => props.pageSize)
const computedTotal = computed(() => props.total)

function getDisplayPages() {
  const pages = []
  const pc = Math.ceil(props.total / props.pageSize)
  const p = page.value

  // Always show first page
  pages.push(1)

  // If current page is far from start, add ellipsis
  if (p > 4) {
    pages.push('e')
  }

  // Add pages around current page
  const start = Math.max(2, p - 1)
  const end = Math.min(pc - 1, p + 1)

  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) {
      pages.push(i)
    }
  }

  // If current page is far from end, add ellipsis
  if (p < pc - 3) {
    pages.push('e')
  }

  // Always show last page (if it's not page 1)
  if (pc > 1 && !pages.includes(pc)) {
    pages.push(pc)
  }

  return pages
}


const displayPages = ref(getDisplayPages())

watch([page, computedPageSize, computedTotal], () => {
  displayPages.value = getDisplayPages()
})

watch([computedPageSize], () => { page.value = 1 })

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