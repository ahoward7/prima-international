<template>
  <div class="flex justify-center items-center text-white bg-prima-red h-12 mb-8">
    <div class="w-full max-w-[1200px] grid grid-cols-4">
      <NuxtLink to="/" class="font-extrabold font-prima cursor-pointer">
        Prima International Trading
      </NuxtLink>
      <div class="flex justify-center gap-12 col-span-2">
        <NuxtLink to="/inventory" class="font-bold cursor-pointer">Inventory Search</NuxtLink>
        <NuxtLink to="/manage" class="font-bold cursor-pointer">Manage Machines</NuxtLink>
      </div>
    </div>
  </div>
</template>