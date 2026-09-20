import { createPersistedState } from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin((nuxtApp) => {
  const pinia = nuxtApp.$pinia
  pinia.use(
    createPersistedState({
      storage: import.meta.client ? localStorage : undefined,
    }),
  )
})
