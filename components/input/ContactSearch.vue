<template>
  <InputSelect label="Contact Search" :options="mappedContacts" @select="selectContact" />
</template>

<script setup lang="ts">
const emit = defineEmits(['select'])

const search = ref('')

const { data: contacts } = await useFetch('/contact', {
  query: { search, pageSize: 50 },
  lazy: true
})

const mappedContacts = computed(() => {
  if (!contacts.value?.data) {
    return []
  }

  const mcs = contacts.value.data.map(c => ({
    label: `${c.name || 'NO NAME'} | ${c.company || 'NO COMPANY'}`,
    data: c.c_id
  }))

  const defaultContact = { label: 'Choose contact', data: ''}

  return [defaultContact, ...mcs]
})

function selectContact(c_id: string) {
  const contact = contacts.value?.data.find(c => c.c_id === c_id)
  emit('select', contact)
}
</script>