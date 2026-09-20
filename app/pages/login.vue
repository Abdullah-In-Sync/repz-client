<script setup lang="ts">
definePageMeta({ layout: 'default' })
const email = ref('')
const password = ref('')
const error = ref('')
const auth = useAuthStore()

async function submit() {
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    await navigateTo('/')
  } catch (e: unknown) {
    error.value = (e as Error).message || 'Login failed'
  }
}

async function google() {
  try {
    await auth.google()
    await navigateTo('/')
  } catch (e: unknown) {
    error.value = (e as Error).message || 'Google sign-in failed'
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-[80dvh] max-w-md flex-col justify-center gap-6 py-10">
    <div>
      <p class="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">Train louder</p>
      <h1 class="display mt-2 text-6xl">REPZ</h1>
      <p class="mt-2 text-[var(--muted)]">Log every set. Own every PR.</p>
    </div>
    <AppHeroMark />
    <form class="card grid gap-3 p-5" @submit.prevent="submit">
      <input v-model="email" class="input" type="email" required placeholder="Email" />
      <input v-model="password" class="input" type="password" required placeholder="Password" />
      <p v-if="error" class="text-sm text-[var(--warn)]">{{ error }}</p>
      <button class="btn-primary" type="submit">Sign in</button>
      <button class="btn-ghost" type="button" @click="google">Continue with Google</button>
      <NuxtLink to="/register" class="text-center text-sm text-[var(--muted)]">Create an account</NuxtLink>
    </form>
  </div>
</template>
