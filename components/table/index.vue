<template>
  <div class="flex flex-col border-t border-x border-prima-red min-w-[870px] font-[verdana]">
    <div class="w-full flex text-white font-extrabold text-xs bg-prima-red border-b border-white">
      <div class="w-20 shrink-0 flex justify-center items-center text-normal p-1">
        Model
      </div>
      <div class="min-w-14 max-w-28 w-full text-center whitespace-nowrap border-l border-white p-1">
        Serial#
      </div>
      <div class="min-w-12 max-w-20 w-full text-center whitespace-nowrap border-l border-white p-1">
        Year
      </div>
      <div class="min-w-12 max-w-24 w-full text-center whitespace-nowrap border-l border-white p-1">
        Hours
      </div>
      <div class="min-w-18 max-w-36 w-full text-center whitespace-nowrap border-l border-white p-1">
        Price
      </div>
      <div class="min-w-24 max-w-48 w-full text-center whitespace-nowrap border-l border-white p-1">
        Date
      </div>
      <div class="min-w-32 max-w-32 w-full text-center whitespace-nowrap border-l border-white p-1">
        Location
      </div>
      <div class="min-w-10 max-w-20 w-full text-center whitespace-nowrap border-l border-white p-1">
        Salesman
      </div>
      <div class="min-w-48 whitespace-nowrap border-l text-center border-white p-1">
        Company
      </div>
      <div class="min-w-40 whitespace-nowrap border-l text-center border-white p-1">
        Contact
      </div>
    </div>
    <div v-for="machine in machines" class="text-xs font-semibold even:bg-gray-200 odd:bg-gray-50">
      <div class="flex w-full border-b border-prima-red">
         <div class="w-20 shrink-0 flex justify-center items-center text-normal font-extrabold text-prima-red p-1 ">
          {{ machine.model }}
        </div>
        <div class="w-full">
          <div class="flex w-full border-b border-gray-400">
            <div class="min-w-14 max-w-28 w-full whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.serialNumber }}
            </div>
            <div class="min-w-12 max-w-20 w-full whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.year }}
            </div>
            <div class="min-w-12 max-w-24 w-full whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.hours }}
            </div>
            <div class="min-w-18 max-w-36 w-full whitespace-nowrap border-l border-gray-400 p-1">
              ${{ machine.price }}
            </div>
            <div class="min-w-24 max-w-48 w-full whitespace-nowrap border-l border-gray-400 p-1">
              {{ formatDate(machine.dateCreated) }}
            </div>
            <div class="min-w-[126px] max-w-32 w-full whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.location }}
            </div>
            <div class="min-w-10 max-w-20 w-full whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.salesman }}
            </div>
            <div class="min-w-48 whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.contact.company }}
            </div>
            <div class="min-w-40 whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.contact.name }}
            </div>
          </div>
          <div>
            <div class="grid grid-cols-2">
              <div class="border-l border-gray-400 p-1">
                <span class="font-bold">Description: </span>
                <span>{{ machine.description }}</span>
              </div>
              <div class="border-l border-gray-400 p-1">
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