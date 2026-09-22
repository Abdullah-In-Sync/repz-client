import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

export default defineNuxtPlugin(() => {
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
  return { provide: { firebaseApp: app, firebaseAuth: auth } }
})
