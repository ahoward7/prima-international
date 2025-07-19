<template>
  <div class="flex flex-col border-t border-x border-prima-red min-w-[870px] font-[consolas]">
    <div class="w-full flex text-white font-extrabold text-sm bg-prima-red border-b border-white">
      <div class="w-24 shrink-0 flex justify-center items-center text-normal p-1">
        Model
      </div>
      <div class="w-28 shrink-0 text-center whitespace-nowrap border-l border-white p-1">
        Serial#
      </div>
      <div class="w-20 shrink-0 text-center whitespace-nowrap border-l border-white p-1">
        Year
      </div>
      <div class="w-20 shrink-0 text-center whitespace-nowrap border-l border-white p-1">
        Hours
      </div>
      <div class="w-24 shrink-0 text-center whitespace-nowrap border-l border-white p-1">
        Price
      </div>
      <div class="w-20 shrink-0 text-center whitespace-nowrap border-l border-white p-1">
        Date
      </div>
      <div class="w-48 shrink-0 text-center whitespace-nowrap border-l border-white p-1">
        Location
      </div>
      <div class="w-20 shrink-0 text-center whitespace-nowrap border-l border-white p-1">
        Salesman
      </div>
      <div class="w-48 shrink-0 text-center whitespace-nowrap border-l border-white p-1">
        Company
      </div>
      <div class="w-40 shrink-0 text-center whitespace-nowrap border-l border-white p-1">
        Contact
      </div>
    </div>
    <div v-if="machines" v-for="machine in machines" class="text-sm font-semibold even:bg-gray-200 odd:bg-gray-50">
      <div class="flex w-full border-b border-prima-red">
         <div class="w-24 shrink-0 flex justify-center items-center text-lg font-extrabold text-prima-red p-1">
          {{ machine.model }}
        </div>
        <div class="flex-1">
          <div class="flex w-full border-b border-gray-400 bg-prima-red/10">
            <div class="w-28 shrink-0 whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.serialNumber }}
            </div>
            <div class="w-20 shrink-0 whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.year ? machine.year.substring(0, 8) : 'NONE' }}
            </div>
            <div class="w-20 shrink-0 whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.hours }}
            </div>
            <div class="w-24 shrink-0 whitespace-nowrap border-l border-gray-400 p-1">
              ${{ machine.price }}
            </div>
            <div class="w-20 shrink-0 whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.lastModDate.substring(0, 8) }}
            </div>
            <div class="w-48 shrink-0 whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.location ? clampString(machine.location, 24) : 'NONE' }}
            </div>
            <div class="w-20 shrink-0 whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.salesman }}
            </div>
            <div class="w-48 shrink-0 whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.contact?.company || 'NONE' }}
            </div>
            <div class="w-40 shrink-0 whitespace-nowrap border-l border-gray-400 p-1">
              {{ machine.contact?.name || 'NONE' }}
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
function clampString(str: string, maxLength: number, suffix: string = '...') {
  if (typeof str !== 'string') {
    throw new Error('First argument must be a string');
  }
  
  if (typeof maxLength !== 'number' || maxLength < 0) {
    throw new Error('maxLength must be a non-negative number');
  }
  
  if (str.length <= maxLength) {
    return str;
  }
  
  const truncateLength = Math.max(0, maxLength - suffix.length);
  return str.substring(0, truncateLength) + suffix;
}

defineProps<{
  machines?: Machine[]
}>()
</script>