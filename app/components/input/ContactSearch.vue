<template>
  <InputSelect :model-value="''" label="Contact Search" :options="mappedContacts" @select="selectContact" @search="debouncedSearch" @clear="clearContact"/>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const emit = defineEmits(['select', 'clear'])

const filters = ref({
  search: '',
  pageSize: 50
})

const { data: contacts } = await useFetch('/contact', {
  query: filters,
  lazy: true
})

const debouncedSearch = useDebounceFn((value: string) => {
  filters.value.search = value
}, 300)

const mappedContacts = computed(() => {
  if (!contacts.value?.data) {
    return []
  }

  const mcs = contacts.value.data.map(c => ({
    label: `${c.name || 'NO NAME'} | ${c.company || 'NO COMPANY'}`,
    data: c.c_id
  }))

  const defaultContact = { label: 'Choose contact', data: '' }
  const newContact = { label: 'Create New Contact', data: 'new' }

  return [defaultContact, newContact, ...mcs]
})

function selectContact(c_id: string) {
  if (c_id === 'new') {
    emit('select', {
      c_id,
      name: '',
      company: '',
      createDate: '',
      lastModDate: ''
    })
    return
  }

  const contact = contacts.value?.data.find(c => c.c_id === c_id)
  emit('select', contact)
}

function clearContact() {
  filters.value.search = ''
  emit('clear')
}
</script>
