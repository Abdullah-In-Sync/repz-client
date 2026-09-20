<script setup lang="ts">
const auth = useAuthStore()
const ui = useUiStore()
const name = ref(auth.profile?.display_name || '')
const unit = ref(auth.profile?.unit_preference || 'kg')

watch(
  () => auth.profile,
  (p) => {
    if (!p) return
    name.value = p.display_name || ''
    unit.value = p.unit_preference
  },
)

async function save() {
  const api = useApi()
  await api.patch('/users/me', { display_name: name.value, unit_preference: unit.value })
  await auth.refreshProfile()
  useUiStore().pushToast('Saved')
}

async function exportData() {
  const api = useApi()
  const [me, workouts] = await Promise.all([api.get('/users/me'), api.get('/workouts', { limit: 100, offset: 0 })])
  const blob = new Blob([JSON.stringify({ me, workouts }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'repz-export.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="mx-auto grid max-w-lg gap-4 pb-10">
    <h1 class="display text-4xl">Profile</h1>
    <form class="card grid gap-3 p-4" @submit.prevent="save">
      <label class="text-sm">Display name<input v-model="name" class="input mt-1" /></label>
      <label class="text-sm">
        Units
        <select v-model="unit" class="input mt-1">
          <option value="kg">Kilograms</option>
          <option value="lb">Pounds</option>
        </select>
      </label>
      <button class="btn-primary" type="submit">Save</button>
    </form>
    <button class="btn-ghost" @click="ui.toggleTheme">Theme: {{ ui.theme }}</button>
    <button class="btn-ghost" @click="exportData">Export data</button>
    <button class="btn-ghost text-[var(--warn)]" @click="auth.logout()">Sign out</button>
  </div>
</template>
