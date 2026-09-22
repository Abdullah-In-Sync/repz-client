export default defineNuxtPlugin(async () => {
  if (!import.meta.client || !('serviceWorker' in navigator)) return
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((registration) => registration.unregister()))
})
