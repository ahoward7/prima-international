<template>
  <div class="flex flex-col gap-4 w-full">
    <div class="text-prima-red font-bold text-2xl">Contact Information</div>
    <div class="grid grid-cols-4 gap-8">
      <InputText v-model="contact.company" label="Company Name" placeholder="Company Inc." class="col-span-2" />
      <InputText v-model="contact.name" label="Contact Name" placeholder="First Last" class="col-span-2" />
    </div>
  </div>
</template>

<script setup lang="ts">
const contact = defineModel<Contact>({ default: {}})
</script>
