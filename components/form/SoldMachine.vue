<template>
  <div class="flex flex-col gap-4 w-full">
    <FormContact v-if="machine.machine?.contact" v-model="machine.machine.contact" title="Contact Information" />

    <DividerLine class="my-4" />

    <HeaderSecondary>Machine Information</HeaderSecondary>
    <FormMachine v-model="machine.machine" />
    
    <DividerLine class="my-4" />

    <HeaderSecondary>Sale Information</HeaderSecondary>
    <FormContact v-model="machine.buyer" :labels="{ company: 'Buyer Company Name', name: 'Buyer Contact Name'}" class="mb-4" />
    <FormSale v-model="machine" />
  </div>
</template>

<script setup lang="ts">
const machine = defineModel<SoldMachineForm>({ required: true })
</script>