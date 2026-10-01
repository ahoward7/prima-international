<template>
  <div class="flex justify-center py-16 px-8">
    <div class="w-230 flex flex-col items-center gap-4">
      <div class="w-full">
        <div class="flex">
          <NuxtLink v-if="!hasUnsavedChanges" to="/" class="flex items-center text-prima-red dark:text-prima-dark-accent">
            <Icon name="carbon:chevron-left" size="28" />
            <span class="text-xl">Inventory</span>
          </NuxtLink>
          <ButtonConfirmation
            v-else
            class="bg-transparent! text-prima-red! dark:text-prima-dark-accent! min-w-0! h-auto! px-0! my-0! font-normal! hover:scale-100! hover:brightness-100!"
            @confirm="leaveConfirmed = true; navigateTo('/')"
          >
            <span class="flex items-center">
              <Icon name="carbon:chevron-left" size="28" />
              <span class="text-xl">Inventory</span>
            </span>
          </ButtonConfirmation>
        </div>
        <HeaderPrimary>Contact Detail</HeaderPrimary>
      </div>

      <div class="flex flex-col w-full">
        <div class="grid grid-cols-2 gap-4">
          <InputContactSearch :contact="contact" class="w-full col-span-2" @select="fillContact" @clear="clearContact" />
          <InputText v-model="contact.name" label="Contact Name" placeholder="First Last" />
          <InputText v-model="contact.company" label="Company Name" placeholder="Company Inc." />
          <div v-if="editingContact" class="col-span-2 flex items-center gap-2 indent-2 -mt-2">
            <span class="text-xs opacity-70">Contact has been edited</span>
            <button type="button" class="text-xs text-prima-red dark:text-prima-dark-accent hover:underline cursor-pointer" @click="undoContactEdit">
              Undo
            </button>
          </div>
        </div>
      </div>

      <DividerLine class="w-full" />
      <div class="w-full flex justify-end gap-4">
        <ButtonConfirmation v-if="isExistingContact" class="bg-prima-yellow!" @confirm="saveContact(contact, true)">
          Update Contact
        </ButtonConfirmation>
        <ButtonConfirmation v-else class="bg-green-600!" @confirm="saveContact(contact, false)">
          Create Contact
        </ButtonConfirmation>
        <ButtonConfirmation v-if="isExistingContact" class="bg-red-600!" @confirm="deleteContact(contact.c_id)">
          Delete Contact
        </ButtonConfirmation>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emptyContact: ContactForm = {
  c_id: 'new',
  name: '',
  company: '',
  createDate: '',
  lastModDate: ''
}

const contact = ref<ContactForm>({ ...emptyContact })
const originalContact = ref<Pick<Contact, 'name' | 'company' | 'c_id'> | undefined>()
const originalContactSnapshot = ref(JSON.stringify(emptyContact))
const leaveConfirmed = ref(false)

const isExistingContact = computed(() => !!contact.value.c_id && contact.value.c_id !== 'new')

const hasUnsavedChanges = computed(() => JSON.stringify(contact.value) !== originalContactSnapshot.value)

const editingContact = computed(() => {
  const current = contact.value
  if (!current) return false
  if (current.c_id === 'new') return false
  const original = originalContact.value
  if (!original) return false
  const nameChanged = (current.name ?? '') !== (original.name ?? '')
  const companyChanged = (current.company ?? '') !== (original.company ?? '')
  return nameChanged || companyChanged
})

onBeforeRouteLeave(() => {
  if (leaveConfirmed.value) {
    return true
  }
  else if (hasUnsavedChanges.value) {
    // eslint-disable-next-line no-alert
    return window.confirm('You have unsaved changes. Leave without saving?')
  }
  else {
    return true
  }
})

function fillContact(c: Contact) {
  contact.value = c
  originalContact.value = { name: c.name, company: c.company, c_id: c.c_id }
  originalContactSnapshot.value = JSON.stringify(c)
}

function clearContact() {
  contact.value = { ...emptyContact }
  originalContact.value = undefined
  originalContactSnapshot.value = JSON.stringify(emptyContact)
}

function undoContactEdit() {
  if (!originalContact.value) return
  const oc = originalContact.value

  contact.value = {
    ...contact.value,
    name: oc.name,
    company: oc.company,
    c_id: oc.c_id
  }
}
</script>
