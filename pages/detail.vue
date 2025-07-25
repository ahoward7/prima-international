<template>
  <div v-if="machine " class="h-screen flex justify-center">
    <div class="w-full flex flex-col p-8 mt-4 max-w-[750px]">
      <div class="bg-prima-red py-4">
        <HeaderPrimary class="!text-white !text-4xl flex justify-between px-8">
          <span>{{ machine.model }}</span>
          <span class="text-prima-yellow">{{ machine.serialNumber }}</span>
        </HeaderPrimary>
      </div>
      <div class="flex flex-col gap-8 bg-gray-100 border-x border-b border-prima-red p-8">
        <div class="flex gap-8">
          <div class="max-h-80 w-80 flex justify-center items-center bg-gray-200 border border-prima-red">
            <img src="/images/Excavator.jpg" />
          </div>
          <div class="grow h-fit grid grid-cols-2 gap-4 font-semibold">
            <div class="flex flex-col px-2 py-1 border-l-2 border-prima-red">
              <label class="text-sm text-prima-red"l>Type</label>
              <span class="">{{ machine.type || 'NONE'  }}</span>
            </div>
            <div class="flex flex-col px-2 py-1 border-l-2 border-prima-red">
              <label class="text-sm text-prima-red">Price</label>
              <span class="">{{ machine.price ? `$${formatCommas(machine.price)}` : 'NONE' }}</span>
            </div>
            <div class="flex flex-col px-2 py-1 border-l-2 border-prima-red">
              <label class="text-sm text-prima-red">Year</label>
              <span class="">{{ machine.year || 'NONE'  }}</span>
            </div>
            <div class="flex flex-col px-2 py-1 border-l-2 border-prima-red">
              <label class="text-sm text-prima-red">Hours</label>
              <span class="">{{ machine.hours || 'NONE' }}</span>
            </div>
            <div class="col-span-2 flex flex-col px-2 py-1 border-l-2 border-prima-red">
              <label class="text-sm text-prima-red">Location</label>
              <span class=" whitespace-nowrap overflow-hidden">{{ machine.location || 'NONE' }}</span>
            </div>
          </div>
        </div>
        <div>
          <HeaderSecondary>Description</HeaderSecondary>
          <div>{{ machine.description }}</div>
        </div>
        <div class="flex flex-col gap-4">
          <div>
            <HeaderSecondary>Notes</HeaderSecondary>
            <div>{{ machine.notes || 'NONE' }}</div>
          </div>
        </div>
        <DividerLine />
        <div class="flex flex-col gap-4">
          <HeaderSecondary>Contact Information</HeaderSecondary>
          <div class="grow h-fit grid grid-cols-2 gap-4 font-semibold">
            <div class="flex flex-col px-2 py-1 border-l-2 border-prima-red">
              <label class="text-sm text-prima-red">Company</label>
              <span class="">{{ machine.contact.company }}</span>
            </div>
            <div class="flex flex-col px-2 py-1 border-l-2 border-prima-red">
              <label class="text-sm text-prima-red">Name</label>
              <span class="">{{ machine.contact.name ? `$${formatCommas(machine.price)}` : 'NONE' }}</span>
            </div>
          </div>
        </div>
        <div class="flex justify-between bg-prima-red font-semibold text-white px-4 py-3">
          <div class="flex items-center gap-2">
            <label class="text-sm">Created:</label>
            <span>{{ isoToMMDDYYYY(machine.createDate) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-sm">Last Modified:</label>
            <span>{{ isoToMMDDYYYY(machine.lastModDate) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { id } = useRoute().query
const { data: machine } = await useFetch<Machine>(`/machine/${id}`)

function formatCommas(num: number = 0): string {
  if (!num) {
    return ''
  }

  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

function isoToMMDDYYYY(isoString: string): string {
  const date = new Date(isoString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}
</script>