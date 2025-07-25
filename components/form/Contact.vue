<template>
  <div class="flex flex-col gap-4 w-full">
    <HeaderSecondary v-if="title">{{ title }}</HeaderSecondary>
    <div class="grid grid-cols-4 gap-8">
      <InputText v-model="contact.company" :label="labels?.company || 'Company Name'" placeholder="Company Inc." class="col-span-2" />
      <InputText v-model="contact.name" :label="labels?.name || 'Contact Name'" placeholder="First Last" class="col-span-2" />
    </div>
  </div>
</template>

<script setup lang="ts">
const contact = defineModel<ContactForm>({ default: { company: '', name: ''}})

interface ContactLabels {
  company: string,
  name: string
}

defineProps<{
  title?: string | 'Contact Information'
  labels?: ContactLabels
}>()
</script>
