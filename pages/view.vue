<template>
  <div class="h-screen flex justify-center">
    <div class="w-full flex flex-col gap-8 p-8 mt-4 max-w-[1200px]">
      <HeaderPrimary class="mb-4">{{ machine.serialNumber || `${machine.model} (NO SERIAL#)` }}</HeaderPrimary>
      <div class="grid grid-cols-2 gap-16">
        <div class="flex flex-col gap-2 bg-gray-200 px-4 py-3 border border-prima-red">
          <HeaderSecondary class="mb-2">Machine Information</HeaderSecondary>
          <div class="flex justify-between">
            <label class="w-32 font-bold">Model</label>
            <span class="text-prima-red font-semibold">{{ machine.model }}</span>
          </div>
          <div class="flex justify-between">
            <label class="w-32 font-bold">Price</label>
            <span class="text-prima-red font-semibold">${{ formatPrice(machine.price) }}</span>
          </div>
          <div class="flex justify-between">
            <label class="w-32 font-bold">Type</label>
            <span class="text-prima-red font-semibold">{{ machine.type }}</span>
          </div>
          <div class="flex justify-between">
            <label class="w-32 font-bold">Year</label>
            <span class="text-prima-red font-semibold">{{ machine.year }}</span>
          </div>
          <div class="flex justify-between">
            <label class="w-32 font-bold">Hours</label>
            <span class="text-prima-red font-semibold">{{ machine.hours }}</span>
          </div>
          <div class="flex justify-between">
            <label class="w-32 font-bold">Location</label>
            <span class="text-prima-red font-semibold">{{ machine.location }}</span>
          </div>
        </div>
        <div class="flex flex-col gap-2 bg-prima-red/10 px-4 py-3 border border-prima-red">
          <HeaderSecondary class="mb-2">User Information</HeaderSecondary>
          <div class="flex justify-between">
            <label class="w-40 font-bold">Contact Company</label>
            <span class="text-prima-red font-semibold">{{ machine.contact?.company }}</span>
          </div>
          <div class="flex justify-between">
            <label class="w-40 font-bold">Contact Name</label>
            <span class="text-prima-red font-semibold">{{ machine.contact?.name}}</span>
          </div>
          <div class="flex justify-between">
            <label class="w-40 font-bold">Date Created</label>
            <span class="text-prima-red font-semibold">{{ formatDate(machine.createDate) }}</span>
          </div>
          <div class="flex justify-between">
            <label class="w-40 font-bold">Date Last Modified</label>
            <span class="text-prima-red font-semibold">{{ formatDate(machine.lastModDate) }}</span>
          </div>
          <div class="flex justify-between">
            <label class="w-40 font-bold">User Last Modified</label>
            <span class="text-prima-red font-semibold">{{ machine.salesman }}</span>
          </div>
        </div>
      </div>
      <DividerLine />
      <div class="flex flex-col gap-8 font-semibold">
        <div class="flex flex-col gap-1">
          <HeaderSecondary>Description</HeaderSecondary>
          <span>{{ machine.description || 'No description' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <HeaderSecondary>Notes</HeaderSecondary>
          <span>{{ machine.notes || 'No notes' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { machine } = useMachineStore()

function formatPrice(price: number = 0): string {
  if (!price) {
    return ''
  }

  return price.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

const formatDate = (isoString: string = '') => {
  const date = new Date(isoString)
  return [
    date.getDate().toString().padStart(2, '0'),
    (date.getMonth() + 1).toString().padStart(2, '0'),
    date.getFullYear()
  ].join('-')
}
</script>