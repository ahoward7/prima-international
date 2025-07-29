<template>
  <div class="flex flex-col gap-4 w-full">
    <FormContact v-if="machine.machine?.contact" v-model="machine.machine.contact" title="Contact Information" />

    <DividerLine class="my-4" />

    <HeaderSecondary>Machine Information</HeaderSecondary>
    <FormMachine v-model="machine.machine" />
    
    <DividerLine class="my-4" />

    <HeaderSecondary>Sale Information</HeaderSecondary>
    <InputText v-model="machine.buyer" placeholder="Buyer Company" class="mb-4" />
    <FormSale v-model="machine" />
  </div>
</template>

<script setup lang="ts">
const machine = defineModel<SoldMachineForm>({ required: true })
</script>