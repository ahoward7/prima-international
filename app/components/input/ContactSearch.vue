<template>
  <InputTextSelect
    model-value=""
    label="Contact Search"
    :options="mappedContacts"
    placeholder="Search contacts..."
    @select="selectContact"
    @search="debouncedSearch"
    @clear="clearContact"
  />
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
// offline helpers auto-import (localQueryContacts)

const emit = defineEmits(['select', 'clear'])

const filters = ref({
  search: '',
  pageSize: 50
})

const { data: contactsEnvelope, error } = await useFetch<FetchResponse<ApiData<Contact>>>(
  '/api/contact',
  {
    query: filters,
    lazy: true
  }
)
const contacts = computed<ApiData<Contact> | null>(() => contactsEnvelope.value?.data || null)

// Local fallback when offline or network fails
const localContacts = ref<ApiData<Contact> | null>(null)
watch([filters, contacts, error], async () => {
  const hasNetwork = !!(contacts.value?.data && contacts.value.data.length)
  if (!navigator?.onLine || !hasNetwork || error.value) {
    try {
      localContacts.value = await localQueryContacts(filters.value)
    }
    catch {
      localContacts.value = null
    }
  }
  else {
    localContacts.value = null
  }
}, { immediate: true, deep: true })

const debouncedSearch = useDebounceFn((value: string) => {
  filters.value.search = value
}, 200)

const mappedContacts = computed(() => {
  const source = localContacts.value || contacts.value
  if (!source?.data) {
    return []
  }

  const mcs = source.data.map(c => ({
    label: `${c.name || 'NO NAME'} | ${c.company || 'NO COMPANY'}`,
    data: c.c_id
  }))

  return [...mcs]
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
