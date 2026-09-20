export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxt/fonts',
    '@vite-pwa/nuxt',
  ],
  css: ['~/assets/css/main.css'],
  fonts: {
    families: [
      { name: 'Inter', provider: 'google' },
      { name: 'Oswald', provider: 'google' },
    ],
  },
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:8000',
      firebaseApiKey: '',
      firebaseAuthDomain: '',
      firebaseProjectId: '',
      firebaseStorageBucket: '',
      firebaseMessagingSenderId: '',
      firebaseAppId: '',
      firebaseMeasurementId: '',
    },
  },
  app: {
    head: {
      title: 'Repz',
      meta: [
        { name: 'theme-color', content: '#0B0B0D' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' },
        { rel: 'apple-touch-icon', href: '/icon.svg' },
      ],
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Repz',
      short_name: 'Repz',
      description: 'Workout logging and analytics',
      theme_color: '#0B0B0D',
      background_color: '#0B0B0D',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      runtimeCaching: [
        {
          urlPattern: /\/media\/gifs\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'exercise-gifs',
            expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 30 },
          },
        },
        {
          urlPattern: /\/api\/v1\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'repz-api',
            networkTimeoutSeconds: 5,
            expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
    },
  },
})
