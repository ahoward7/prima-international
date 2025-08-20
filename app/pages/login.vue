<template>
  <div class="h-[75vh] flex items-center justify-center">
    <div class="w-full max-w-md p-6 rounded shadow-md bg-gray-50 dark:bg-gray-800">
      <h1 class="text-2xl font-bold text-center text-prima-red dark:text-prima-dark-accent mb-4">
        Sign in
      </h1>

      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <InputText v-model="username" label="Username" placeholder="Username" />

        <div class="relative flex flex-col gap-1">
          <label class="text-prima-red dark:text-prima-dark-accent font-semibold">Password</label>
          <input
            v-model="password"
            type="password"
            class="text-prima-red dark:text-prima-dark-accent bg-gray-100 dark:bg-gray-800 px-2 py-1 border border-prima-red dark:border-prima-dark-accent"
            placeholder="Password"
          >
        </div>

        <div v-if="showReset" class="mt-2 p-3 border border-amber-400 bg-amber-50 dark:bg-yellow-900/20 dark:border-yellow-700 rounded">
          <p class="text-sm mb-2 text-amber-800 dark:text-yellow-300">
            You logged in with the default password. Please set a new password before continuing.
          </p>

          <div class="relative flex flex-col gap-1">
            <label class="text-prima-red dark:text-prima-dark-accent font-semibold">New password</label>
            <input
              v-model="newPassword"
              type="password"
              class="text-prima-red dark:text-prima-dark-accent bg-gray-100 dark:bg-gray-800 px-2 py-1 border border-prima-red dark:border-prima-dark-accent"
              placeholder="New password"
            >
          </div>

          <div class="relative flex flex-col gap-1 mt-2">
            <label class="text-prima-red dark:text-prima-dark-accent font-semibold">Confirm new password</label>
            <input
              v-model="confirmPassword"
              type="password"
              class="text-prima-red dark:text-prima-dark-accent bg-gray-100 dark:bg-gray-800 px-2 py-1 border border-prima-red dark:border-prima-dark-accent"
              placeholder="Confirm new password"
            >
          </div>
        </div>

        <div v-if="error" class="text-sm text-red-600">
          {{ error }}
        </div>

        <div class="flex justify-end">
          <Button @click.prevent="onSubmit">
            {{ showReset ? 'Reset and Login' : 'Login' }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const username = ref('')
const password = ref('')
const error = ref<string | null>(null)
const showReset = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const { fetch: fetchUserSession } = useUserSession()

const route = useRoute()

async function onSubmit() {
  error.value = null
  try {
    if (!showReset.value && password.value === 'password') {
      showReset.value = true
      return
    }

    if (showReset.value) {
      if (newPassword.value !== confirmPassword.value) {
        error.value = 'New password and confirmation do not match.'
        return
      }

      await $fetch('/api/auth/password', {
        method: 'PUT',
        body: {
          username: username.value,
          currentPassword: password.value,
          newPassword: newPassword.value
        }
      })

      password.value = newPassword.value
    }

    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        username: username.value,
        password: password.value
      }
    })

    await fetchUserSession()
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    return navigateTo(redirect)
  }
  catch (err: any) {
    const apiError = err?.data?.error
    error.value = apiError?.detail || apiError?.title || err?.message || 'Login failed'
  }
}
</script>
