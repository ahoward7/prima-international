<template>
  <div class="flex flex-col gap-4 w-full">
    <div class="text-prima-red font-bold text-4xl mb-4">Add Sold Machine</div>
    <FormContact v-if="machine.machine?.contact" v-model="machine.machine.contact" title="Contact Information" />

    <DividerLine class="my-4" />

    <div class="text-prima-red font-bold text-2xl">Machine Information</div>
    <FormMachine v-model="machine.machine" />
    
    <DividerLine class="my-4" />

    <div class="text-prima-red font-bold text-2xl">Sale Information</div>
    <FormContact v-model="machine.buyer" :labels="{ company: 'Buyer Company Name', name: 'Buyer Contact Name'}" class="mb-4" />
    <FormSale v-model="machine" />
  </div>
</template>

<script setup lang="ts">
const machine = defineModel<SoldMachineForm>({ required: true })
</script>