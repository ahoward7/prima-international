<template>
  <div class="h-screen flex justify-center px-4 py-12">
    <div class="flex flex-col gap-16 w-full max-w-[1200px]">
      <HeaderPrimary>Prima International Trading</HeaderPrimary>
      <div class="text-center font-bold text-2xl bg-prima-yellow py-4">Temporary navigation - Let me know if you want a home page or if you want the inventory to be the home page.</div>
      <div class="flex justify-around">
        <NuxtLink to="/inventory" class="text-4xl text-white bg-prima-red px-4 py-3 cursor-pointer hover:bg-prima-red/90 duration-300">
          Search Inventory
        </NuxtLink>
        <NuxtLink to="/manage" class="text-4xl text-white bg-prima-red px-4 py-3 cursor-pointer hover:bg-prima-red/90 duration-300">
          Manage Machines
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

</script>
