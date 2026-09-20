import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getAnalytics, isSupported } from 'firebase/analytics'

export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig().public
  const firebaseConfig = {
    apiKey: config.firebaseApiKey,
    authDomain: config.firebaseAuthDomain,
    projectId: config.firebaseProjectId,
    storageBucket: config.firebaseStorageBucket,
    messagingSenderId: config.firebaseMessagingSenderId,
    appId: config.firebaseAppId,
    measurementId: config.firebaseMeasurementId,
  }
  const app = getApps()[0] ?? initializeApp(firebaseConfig)
  const auth = getAuth(app)
  if (import.meta.client && (await isSupported())) {
    getAnalytics(app)
  }
  return { provide: { firebaseApp: app, firebaseAuth: auth } }
})
