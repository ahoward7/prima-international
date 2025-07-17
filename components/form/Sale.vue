<template>
  <div>
    <div class="grid grid-cols-4 gap-8 w-full">
      <InputText v-model="soldInformation.buyerLocation" label="Buyer Location" placeholder="City, Country" class="col-span-4" />
      <InputText v-model="soldInformation.truckingCompany" label="Trucking Comapny" placeholder="Company Name" class="col-span-1" />
      <InputNumber v-model="soldInformation.totalCost" label="Total Cost" placeholder="XXXXXX" class="col-span-1" />
      <InputNumber v-model="soldInformation.machineCost" label="Machine Cost" placeholder="XXXXXX" class="col-span-1 col-start-1" />
      <InputNumber v-model="soldInformation.freightCost" label="Freight Cost" placeholder="XXXXXX" class="col-span-1" />
      <InputNumber v-model="soldInformation.paintCost" label="Paint Cost" placeholder="XXXXXX" class="col-span-1" />
      <InputNumber v-model="soldInformation.profitFromSale" label="Profit From Sale" placeholder="XXXXXX" class="col-span-1" />
      <InputText v-model="soldInformation.purchaseFob" label="Purchase FOB" placeholder="City, Country" class="col-span-4" />
      <InputText v-model="soldInformation.saleFobPoint" label="Sale From FOB" placeholder="City, Country" class="col-span-1" />
    </div>
    <DividerLine class="col-span-4 my-8" />
  
    <InputTextarea v-model="soldInformation.notes" label="Notes On Sale" placeholder="Other information..." class="col-span-4" />
  </div>
</template>

<script setup lang="ts">
const soldInformation = defineModel<SoldMachineForm>({ required: true })
</script>
