<template>
  <div class="h-screen flex justify-center">
    <div class="w-full flex flex-col gap-16 p-8 max-w-[1200px]">
      <HeaderPrimary>{{ machine.serialNumber}}</HeaderPrimary>
      <div class="grid grid-cols-2 gap-16">
        <div class="flex flex-col gap-2 bg-gray-200 px-4 py-3 border border-prima-red">
          <HeaderSecondary class="mb-2">Machine Information</HeaderSecondary>
          <div class="flex justify-between font-bold">
            <label class="w-32">Model</label>
            <span class="text-prima-red">{{ machine.model }}</span>
          </div>
          <div class="flex justify-between font-bold">
            <label class="w-32">Price</label>
            <span class="text-prima-red">${{ formatPrice(machine.price) }}</span>
          </div>
          <div class="flex justify-between font-bold">
            <label class="w-32">Type</label>
            <span class="text-prima-red">{{ machine.type }}</span>
          </div>
          <div class="flex justify-between font-bold">
            <label class="w-32">Year</label>
            <span class="text-prima-red">{{ machine.year }}</span>
          </div>
          <div class="flex justify-between font-bold">
            <label class="w-32">Hours</label>
            <span class="text-prima-red">{{ machine.hours }}</span>
          </div>
          <div class="flex justify-between font-bold">
            <label class="w-32">Location</label>
            <span class="text-prima-red">{{ machine.location }}</span>
          </div>
        </div>
        <div class="flex flex-col gap-2 bg-prima-red/10 px-4 py-3 border border-prima-red">
          <HeaderSecondary class="mb-2">User Information</HeaderSecondary>
          <div class="flex justify-between font-bold">
            <label class="w-40">Contact Company</label>
            <span class="text-prima-red">{{ machine.contact?.company }}</span>
          </div>
          <div class="flex justify-between font-bold">
            <label class="w-40">Contact Name</label>
            <span class="text-prima-red">{{ machine.contact?.name}}</span>
          </div>
          <div class="flex justify-between font-bold">
            <label class="w-40">Date Created</label>
            <span class="text-prima-red">{{ formatDate(machine.createDate) }}</span>
          </div>
          <div class="flex justify-between font-bold">
            <label class="w-40">Date Last Modified</label>
            <span class="text-prima-red">{{ formatDate(machine.lastModDate) }}</span>
          </div>
          <div class="flex justify-between font-bold">
            <label class="w-40">User Last Modified</label>
            <span class="text-prima-red">{{ machine.salesman }}</span>
          </div>
        </div>
      </div>
      <DividerLine />
      <div class="flex flex-col gap-4">
        <HeaderSecondary>Other Information</HeaderSecondary>
        <div class="flex flex-col gap-2">
          <div class="flex justify-between font-bold">
            <label class="shrink-0 w-32">Description</label>
            <span class="text-prima-red">{{ machine.description }}</span>
          </div>
          <div class="flex justify-between font-bold">
            <label class="shrink-0 w-32">Notes</label>
            <span class="text-prima-red">{{ machine.notes }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { machine } = useMachineStore()

function formatPrice(price: number = 0): string {
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