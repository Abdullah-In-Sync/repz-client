import { markRaw } from 'vue'
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

let initPromise: Promise<void> | null = null

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
      if (initPromise) return initPromise

      const { $firebaseAuth } = useNuxtApp()
      initPromise = new Promise<void>((resolve) => {
        onAuthStateChanged($firebaseAuth, async (user) => {
          this.firebaseUser = user ? markRaw(user) : null
          this.ready = true
          resolve()
          if (!user) {
            this.profile = null
            return
          }
          try {
            const api = useApi()
            await api.syncProfile()
            this.profile = await api.get<User>('/users/me')
          } catch {
            this.profile = null
          }
        })
      })
      return initPromise
    },
    async login(email: string, password: string) {
      const { $firebaseAuth } = useNuxtApp()
      await signInWithEmailAndPassword($firebaseAuth, email, password)
      this.firebaseUser = markRaw($firebaseAuth.currentUser as FirebaseUser)
    },
    async register(email: string, password: string, name: string) {
      const { $firebaseAuth } = useNuxtApp()
      const cred = await createUserWithEmailAndPassword($firebaseAuth, email, password)
      if (name) await updateProfile(cred.user, { displayName: name })
      this.firebaseUser = markRaw(cred.user)
    },
    async google() {
      const { $firebaseAuth } = useNuxtApp()
      const cred = await signInWithPopup($firebaseAuth, new GoogleAuthProvider())
      this.firebaseUser = markRaw(cred.user)
    },
    async logout() {
      this.firebaseUser = null
      this.profile = null
      try {
        const { $firebaseAuth } = useNuxtApp()
        await signOut($firebaseAuth)
      } catch {
        // still leave the signed-out UI
      }
      await navigateTo('/login', { replace: true })
    },
    async refreshProfile() {
      const api = useApi()
      this.profile = await api.get<User>('/users/me')
    },
  },
})
