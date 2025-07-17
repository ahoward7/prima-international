<template>
  <div class="flex flex-col gap-4 w-full">
    <div class="text-prima-red font-bold text-4xl mb-4">Add Archived Machine</div>
    <FormContact v-model="machine.contact" title="Contact Information" />
    <DividerLine class="my-4" />

    <div class="text-prima-red font-bold text-2xl">Machine Information</div>
    <FormMachine v-model="machine" />
  </div>
</template>

<script setup lang="ts">
const machine = defineModel<MachineForm>({ required: true })
</script>