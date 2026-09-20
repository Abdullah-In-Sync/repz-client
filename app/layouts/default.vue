<script setup lang="ts">
const auth = useAuthStore()
const ui = useUiStore()
const route = useRoute()
const workout = useWorkoutStore()

onMounted(async () => {
  ui.applyTheme()
  if (!auth.ready) await auth.init()
  window.addEventListener('online', () => useOfflineQueue().flush())
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    ui.installEvent = e as unknown as { prompt: () => Promise<void> }
  })
})

const tabs = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/routines', label: 'Routines', icon: '☰' },
  { to: '/workout', label: 'Log', icon: '+' },
  { to: '/history', label: 'History', icon: '▤' },
  { to: '/settings', label: 'Profile', icon: '●' },
]

const hideNav = computed(() => ['/login', '/register'].includes(route.path))
</script>

<template>
  <div class="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
    <div v-if="ui.installEvent && !hideNav" class="flex items-center justify-between bg-[var(--accent)] px-4 py-2 text-black">
      <span class="text-sm font-semibold">Install Repz on your home screen</span>
      <button class="font-bold" @click="ui.installEvent?.prompt()">Add</button>
    </div>
    <div class="lg:flex">
      <aside
        v-if="!hideNav"
        class="hidden min-h-dvh w-60 shrink-0 border-r border-white/5 bg-[var(--surface)] p-4 lg:block"
      >
        <NuxtLink to="/" class="display text-3xl text-[var(--accent)]">REPZ</NuxtLink>
        <nav class="mt-8 grid gap-1">
          <NuxtLink
            v-for="tab in tabs"
            :key="tab.to"
            :to="tab.to === '/workout' && workout.session ? `/workout/${workout.session.id}` : tab.to"
            class="rounded-xl px-3 py-2 text-sm hover:bg-white/5"
            active-class="bg-white/10 text-[var(--accent)]"
          >
            {{ tab.label }}
          </NuxtLink>
          <NuxtLink to="/exercises" class="rounded-xl px-3 py-2 text-sm hover:bg-white/5" active-class="bg-white/10 text-[var(--accent)]">
            Exercises
          </NuxtLink>
          <NuxtLink to="/body" class="rounded-xl px-3 py-2 text-sm hover:bg-white/5" active-class="bg-white/10 text-[var(--accent)]">
            Body
          </NuxtLink>
        </nav>
      </aside>
      <div class="min-h-dvh flex-1 pb-24 lg:pb-8">
        <header v-if="!hideNav" class="flex items-center justify-between px-4 py-4 lg:px-8">
          <NuxtLink to="/" class="display text-2xl text-[var(--accent)] lg:hidden">REPZ</NuxtLink>
          <div class="ml-auto text-sm text-[var(--muted)]">{{ auth.profile?.display_name || auth.firebaseUser?.email }}</div>
        </header>
        <main class="px-4 lg:px-8">
          <slot />
        </main>
      </div>
    </div>
    <nav
      v-if="!hideNav"
      class="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-white/10 bg-[var(--surface)]/95 backdrop-blur lg:hidden"
    >
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to === '/workout' && workout.session ? `/workout/${workout.session.id}` : tab.to"
        class="flex flex-col items-center py-3 text-xs text-[var(--muted)]"
        active-class="text-[var(--accent)]"
      >
        <span class="text-lg">{{ tab.icon }}</span>
        {{ tab.label }}
      </NuxtLink>
    </nav>
    <div class="fixed right-4 top-4 z-50 grid gap-2">
      <div v-for="t in ui.toasts" :key="t.id" class="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black">
        {{ t.message }}
      </div>
    </div>
  </div>
</template>
