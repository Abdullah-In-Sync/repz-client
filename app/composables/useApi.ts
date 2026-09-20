import type { User as FirebaseUser } from 'firebase/auth'
import type { User } from '~/types/api'

export const useApi = () => {
  const config = useRuntimeConfig()
  const toast = useUiStore()
  const auth = useAuthStore()

  async function token(): Promise<string | null> {
    const user = auth.firebaseUser as FirebaseUser | null
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
      if (err.status === 401 && auth.firebaseUser) {
        const fresh = await (auth.firebaseUser as FirebaseUser).getIdToken(true)
        headers.Authorization = `Bearer ${fresh}`
        try {
          return await $fetch<T>(`${config.public.apiBase}/api/v1${path}`, {
            ...options,
            headers,
          })
        } catch {
          await auth.logout()
          throw error
        }
      }
      toast.pushToast(err.data?.detail || 'Request failed')
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
