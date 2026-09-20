export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  const publicRoutes = ['/login', '/register']
  const auth = useAuthStore()
  if (!auth.ready) await auth.init()
  if (publicRoutes.includes(to.path)) {
    if (auth.isLoggedIn) return navigateTo('/')
    return
  }
  if (!auth.isLoggedIn) return navigateTo('/login')
})
