<script setup lang="ts">
const email = ref('')
const password = ref('')
const name = ref('')
const error = ref('')
const auth = useAuthStore()

async function submit() {
  error.value = ''
  try {
    await auth.register(email.value, password.value, name.value)
    await navigateTo('/')
  } catch (e: unknown) {
    error.value = (e as Error).message || 'Could not register'
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-[80dvh] max-w-md flex-col justify-center gap-6 py-10">
    <h1 class="display text-5xl">Join Repz</h1>
    <form class="card grid gap-3 p-5" @submit.prevent="submit">
      <input v-model="name" class="input" placeholder="Display name" />
      <input v-model="email" class="input" type="email" required placeholder="Email" />
      <input v-model="password" class="input" type="password" required minlength="6" placeholder="Password" />
      <p v-if="error" class="text-sm text-[var(--warn)]">{{ error }}</p>
      <button class="btn-primary" type="submit">Create account</button>
      <NuxtLink to="/login" class="text-center text-sm text-[var(--muted)]">Back to sign in</NuxtLink>
    </form>
  </div>
</template>
