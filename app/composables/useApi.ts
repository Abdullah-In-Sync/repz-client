import type { User as FirebaseUser } from 'firebase/auth'
import type { User } from '~/types/api'

export const useApi = () => {
  const config = useRuntimeConfig()
  const toast = useUiStore()
  const auth = useAuthStore()

  async function currentUser(): Promise<FirebaseUser | null> {
    if (import.meta.client) {
      try {
        const { $firebaseAuth } = useNuxtApp()
        if ($firebaseAuth.currentUser) return $firebaseAuth.currentUser
      } catch {
        // plugin may not be ready yet
      }
    }
    return auth.firebaseUser as FirebaseUser | null
  }

  async function token(): Promise<string | null> {
    const user = await currentUser()
    if (!user) return null
    return user.getIdToken()
  }

  async function request<T>(path: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    const idToken = await token()
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined),
    }
    if (idToken) headers.Authorization = `Bearer ${idToken}`

    try {
      return await $fetch<T>(`${config.public.apiBase}/api/v1${path}`, {
        ...options,
        headers,
      })
    } catch (error: unknown) {
      const err = error as { status?: number; data?: { detail?: string } }
      const user = await currentUser()
      if (err.status === 401 && user) {
        const fresh = await user.getIdToken(true)
        headers.Authorization = `Bearer ${fresh}`
        try {
          return await $fetch<T>(`${config.public.apiBase}/api/v1${path}`, {
            ...options,
            headers,
          })
        } catch {
          auth.firebaseUser = null
          auth.profile = null
          await navigateTo('/login', { replace: true })
          throw error
        }
      }
      const missingAuth = err.status === 401 && !auth.firebaseUser
      if (!import.meta.server && !missingAuth) {
        toast.pushToast(err.data?.detail || 'Request failed')
      }
      throw error
    }
  }

  return {
    get: <T>(path: string, query?: Record<string, unknown>) =>
      request<T>(path, { method: 'GET', query }),
    post: <T>(path: string, body?: Record<string, unknown> | object) => request<T>(path, { method: 'POST', body }),
    patch: <T>(path: string, body?: Record<string, unknown> | object) => request<T>(path, { method: 'PATCH', body }),
    del: (path: string) => request<void>(path, { method: 'DELETE' }),
    syncProfile: () => request<User>('/users/sync', { method: 'POST', body: {} }),
  }
}
