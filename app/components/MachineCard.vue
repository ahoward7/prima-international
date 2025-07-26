<template>
  <div class="flex flex-col gap-4 bg-gray-100 px-8 py-6 border-t-4 border border-prima-yellow">
    <div class="flex justify-between">
      <div>
        <span class="text-prima-yellow text-xl font-extrabold font-prima">
          {{ machine.model }}
        </span>
        <span class="text-xl">
          |
        </span>
        <span class="text-xl text-prima-red font-semibold">
          {{ machine.serialNumber }}
        </span>
      </div>
      <div class="text-xl font-semibold">
        {{ machine.type }}
      </div>
    </div>
    <div class="grid grid-cols-2 gap-2">
      <div class="flex gap-2 text-xl font-bold">
        <span class="text-prima-red">Price:</span>
        <span>${{ machine.price }}</span>
      </div>
      <div class="flex gap-2 text-lg">
        <span>Year:</span>
        <span class="font-semibold">{{ machine.year }}</span>
      </div>
      <div class="flex gap-2 text-lg">
        <span>Hours:</span>
        <span class="font-semibold">{{ machine.hours }}</span>
      </div>
      <div class="flex gap-2 text-lg">
        <span>Location:</span>
        <span class="font-semibold">{{ machine.location }}</span>
      </div>

      <div class="border border-prima-red/50 col-span-2 my-1"></div>

      <div class="flex gap-2 text-lg">
        <span>Salesman:</span>
        <span class="font-semibold">{{ machine.salesman }}</span>
      </div>
      <div class="flex gap-2 text-lg">
        <span>Contact:</span>
        <span class="font-semibold">{{ machine.contact.name || "NONE" }}</span>
      </div>
      <div class="flex gap-2 text-lg col-span-2">
        <span>Owner:</span>
        <span class="font-semibold">{{ machine.contact.company }}</span>
      </div>
      <div class="flex gap-2 col-span-2 text-lg">
        <span>Description:</span>
        <span class="font-semibold">{{ machine.description }}</span>
      </div>
      <div class="flex gap-2 text-lg">
        <span>Date Created:</span>
        <span class="font-semibold">{{ formatDate(machine.createDate) }}</span>
      </div>
      <div class="flex gap-2 text-lg">
        <span>Last Modified:</span>
        <span class="font-semibold">{{ formatDate(machine.lastModDate) }}</span>
      </div>

      <div class="border border-prima-red/50 col-span-2 my-1"></div>
      
      <div class="flex gap-2 col-span-2 text-lg">
        <span>Notes:</span>
        <span class="font-semibold">{{ machine.notes || 'NONE' }}</span>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
const formatDate = (isoString: string) => {
  const date = new Date(isoString)
  return [
    date.getDate().toString().padStart(2, '0'),
    (date.getMonth() + 1).toString().padStart(2, '0'),
    date.getFullYear()
  ].join('-')
}

defineProps<{
  machine: Machine
}>()
</script>