<script setup lang="ts">
import type { CalendarDetail } from '~/types/api'

const api = useApi()
const router = useRouter()

const loading = ref(true)
const detail = ref<CalendarDetail | null>(null)

async function load() {
  loading.value = true
  try {
    detail.value = await api.get<CalendarDetail>('/reports/calendar/detail')
  } catch {
    detail.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => load())

function openDay(date: string) {
  navigateTo(`/history?date=${date}`)
}
</script>

<template>
  <div class="mx-auto grid max-w-lg gap-5 pb-10">
    <header class="flex items-center gap-2">
      <button
        type="button"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-lg"
        aria-label="Back"
        @click="router.back()"
      >
        ←
      </button>
      <h1 class="display min-w-0 flex-1 truncate text-xl">Workout calendar</h1>
    </header>

    <div v-if="detail && !loading" class="grid grid-cols-2 gap-3">
      <article class="card p-4">
        <p class="text-xs text-[var(--muted)]">Current streak</p>
        <p class="display mt-1 text-2xl tabular">{{ detail.workout_streak_days }} days</p>
      </article>
      <article class="card p-4">
        <p class="text-xs text-[var(--muted)]">Rest days (logged span)</p>
        <p class="display mt-1 text-2xl tabular">{{ detail.rest_days }}</p>
      </article>
    </div>

    <section class="card min-w-0 p-4">
      <p v-if="loading" class="py-16 text-center text-sm text-[var(--muted)]">Loading…</p>
      <p
        v-else-if="!detail?.months.length"
        class="py-16 text-center text-sm text-[var(--muted)]"
      >
        No workouts logged yet. Finish a session with completed sets to see your calendar here.
      </p>
      <div v-else class="grid gap-8">
        <CalendarDetailMonth
          v-for="m in detail.months"
          :key="m.month"
          :month="m"
          @select="openDay"
        />
      </div>
    </section>
  </div>
</template>
