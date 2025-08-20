import { defineNuxtRouteMiddleware } from '#app'

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  const { user, ready, fetch } = useUserSession()

  if (!ready.value) {
    try {
      await fetch()
    }
    catch {}
  }

  if (!user.value) {
    const redirect = to.fullPath && to.fullPath !== '/'
      ? `?redirect=${encodeURIComponent(to.fullPath)}`
      : ''
    return navigateTo(`/login${redirect}`)
  }
})
