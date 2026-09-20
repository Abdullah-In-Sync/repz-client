import type { User as FirebaseUser } from 'firebase/auth'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import type { User } from '~/types/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    ready: false,
    firebaseUser: null as FirebaseUser | null,
    profile: null as User | null,
  }),
  getters: {
    isLoggedIn: (s) => !!s.firebaseUser,
  },
  actions: {
    async init() {
      if (!import.meta.client) return
      const { $firebaseAuth } = useNuxtApp()
      await new Promise<void>((resolve) => {
        onAuthStateChanged($firebaseAuth, async (user) => {
          this.firebaseUser = user
          if (user) {
            try {
              const api = useApi()
              await api.syncProfile()
              this.profile = await api.get<User>('/users/me')
            } catch {
              this.profile = null
            }
          } else {
            this.profile = null
          }
          this.ready = true
          resolve()
        })
      })
    },
    async login(email: string, password: string) {
      const { $firebaseAuth } = useNuxtApp()
      await signInWithEmailAndPassword($firebaseAuth, email, password)
    },
    async register(email: string, password: string, name: string) {
      const { $firebaseAuth } = useNuxtApp()
      const cred = await createUserWithEmailAndPassword($firebaseAuth, email, password)
      if (name) await updateProfile(cred.user, { displayName: name })
    },
    async google() {
      const { $firebaseAuth } = useNuxtApp()
      await signInWithPopup($firebaseAuth, new GoogleAuthProvider())
    },
    async logout() {
      const { $firebaseAuth } = useNuxtApp()
      await signOut($firebaseAuth)
      this.profile = null
      await navigateTo('/login')
    },
    async refreshProfile() {
      const api = useApi()
      this.profile = await api.get<User>('/users/me')
    },
  },
})
