<template>
  <InputTextSelect
    :model-value="selectedContact"
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

const props = defineProps<{ contact?: Partial<Contact> }>()
const emit = defineEmits(['select', 'clear'])
const selectedContact = ref('')

const filters = ref({
  search: '',
  pageSize: 50
})

const { data: contactsEnvelope } = await useFetch<FetchResponse<ApiData<Contact>>>(
  '/api/contact',
  {
    query: filters,
    lazy: true
  }
)
const contacts = computed(() => contactsEnvelope.value?.data)

const debouncedSearch = useDebounceFn((value: string) => {
  filters.value.search = value
}, 200)

const mappedContacts = computed(() => {
  const newContactOption = [{ label: 'NEW CONTACT', data: 'new' }]

  if (!contacts.value?.data) {
    return newContactOption
  }

  const mcs = contacts.value.data.map(c => {
    const label = formatContact(c)

    return {
      label,
      data: c.c_id
    }
  })

  return [...newContactOption, ...mcs]
})

function formatContact(c: Partial<Contact>) {
  if (!c) return ''
  return c.name && c.company ? `${c.name} | ${c.company}` : (c.name || c.company || '')
}

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

watch(() => props.contact, () => {
  if (props.contact?.c_id === 'new') return

  selectedContact.value = formatContact(props.contact as Contact)
}, { deep: true, immediate: true })
</script>
