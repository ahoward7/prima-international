<template>
  <div class="flex flex-col gap-4 w-full">
    <HeaderSecondary v-if="title">
      {{ title }}
    </HeaderSecondary>
    <div class="grid grid-cols-2 gap-8">
      <InputContactSearch class="w-full" @select="fillContact" @clear="clearContact" />
      <div />
      <InputText v-model="contact.name" :label="labels?.name || 'Contact Name'" placeholder="First Last" />
      <InputText v-model="contact.company" :label="labels?.company || 'Company Name'" placeholder="Company Inc." />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string | 'Contact Information'
  labels?: ContactLabels
}>()

const contact = defineModel<ContactForm>({ default: { company: '', name: ''}})

interface ContactLabels {
  company: string,
  name: string
}

function fillContact(c: Contact) {
  contact.value = c
}

function clearContact() {
  contact.value = { company: '', name: ''}
}
</script>
