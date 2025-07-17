<template>
  <div class="flex flex-col border-t border-x">
    <div v-for="machine in machines" class="text-sm font-semibold">
      <div class="flex w-full border-b">
         <div class="w-20 flex justify-center items-center text-normal font-extrabold text-prima-red bg-gray-100 p-1">
          {{ machine.model }}
        </div>
        <div class="w-full">
          <div class="flex w-full border-b">
            <div class="w-16 border-l p-1">
              {{ machine.serialNumber }}
            </div>
            <div class="w-12 border-l p-1">
              {{ machine.year }}
            </div>
            <div class="w-12 border-l p-1">
              {{ machine.hours }}
            </div>
            <div class="w-16 border-l p-1">
              {{ machine.price }}
            </div>
            <div class="w-24 border-l p-1">
              {{ formatDate(machine.dateCreated) }}
            </div>
            <div class="w-32 border-l p-1">
              {{ machine.location }}
            </div>
            <div class="w-10 border-l p-1">
              {{ machine.salesman }}
            </div>
            <div class="w-48 border-l p-1">
              {{ machine.contact.company }}
            </div>
            <div class="w-40 border-l p-1">
              {{ machine.contact.name }}
            </div>
          </div>
          <div>
            <div class="grid grid-cols-2">
              <div class="border-l p-1">
                <span class="font-bold">Description: </span>
                <span>{{ machine.description }}</span>
              </div>
              <div class="border-l p-1">
                <span class="font-bold">Notes: </span>
                <span>{{ machine.notes }}</span>
              </div>
            </div>
          </div>
        </div>
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
  machines: Machine[]
}>()
</script>