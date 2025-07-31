<template>
  <div class="flex justify-center items-center text-white bg-prima-red h-12 mb-8">
    <div class="w-full max-w-[1200px] grid grid-cols-4">
      <NuxtLink to="/" class="font-extrabold cursor-pointer">
        Prima International Trading
      </NuxtLink>
      <div class="flex justify-center gap-12 col-span-2">
        <NuxtLink to="/" class="flex items-center gap-1 font-bold cursor-pointer">
          <Icon name="carbon:table" size="20" />
          Inventory
        </NuxtLink>
        <NuxtLink to="/manage" class="flex items-center gap-1 font-bold cursor-pointer">
          <Icon name="carbon:settings-edit" size="20" />
          Management
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
