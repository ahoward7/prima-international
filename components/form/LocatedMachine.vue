<template>
  <div class="flex flex-col gap-4 w-full">
    <div class="text-prima-red font-bold text-4xl mb-4">Add Located Machine</div>
    <FormContact v-model="machine.contact" />
    <DividerLine class="my-4" />

    <div class="text-prima-red font-bold text-2xl">Machine Information</div>
    <FormMachine v-model="machine" />
  </div>
</template>

<script setup lang="ts">
const machine = defineModel<LocatedMachineForm>({ required: true })
</script>