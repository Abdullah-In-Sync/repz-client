<script setup lang="ts">
import type { Exercise, Paginated, Workout, WorkoutSet } from '~/types/api'
import {
  buildWorkoutReportText,
  formatLoggedSetLine,
  groupSetsByExercise,
} from '~/utils/workoutReport'

const reports = useReportStore()
const exercises = useExerciseStore()
const units = useUnits()
const ui = useUiStore()
const route = useRoute()
const deleting = ref(false)
const tab = ref<'workouts' | 'weekly' | 'monthly'>('workouts')
const selected = ref<string | null>(null)
const filterDate = computed(() => {
  const raw = route.query.date
  return typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null
})
const exerciseById = ref<Record<string, Exercise>>({})
const exerciseNames = ref<Record<string, string>>({})

async function loadWorkoutList() {
  const api = useApi()
  const params: Record<string, string | number> = { limit: 20, offset: 0 }
  if (filterDate.value) {
    params.start = `${filterDate.value}T00:00:00`
    params.end = `${filterDate.value}T23:59:59`
  }
  const data = await api.get<Paginated<Workout>>('/workouts', params)
  reports.workouts = data.items
  reports.workoutTotal = data.total
}

watch(filterDate, () => loadWorkoutList())

onMounted(async () => {
  await loadWorkoutList()
  await reports.loadDashboard().catch(() => {})
  await exercises.load().catch(() => {})
  for (const ex of exercises.items) {
    exerciseById.value[ex.id] = ex
    exerciseNames.value[ex.id] = ex.name
  }
})

const detail = computed(() => reports.workouts.find((w) => w.id === selected.value))

watch(
  detail,
  async (workout) => {
    if (!workout) return
    const ids = [...new Set(workout.sets.map((s) => s.exercise_id))]
    await Promise.all(
      ids.map(async (id) => {
        if (exerciseById.value[id]) return
        try {
          const ex = await exercises.getOne(id)
          exerciseById.value[id] = ex
          exerciseNames.value[id] = ex.name
        } catch {
          exerciseNames.value[id] = 'Unknown exercise'
        }
      }),
    )
  },
  { immediate: true },
)

const detailGroups = computed(() => {
  if (!detail.value) return []
  return groupSetsByExercise(detail.value.sets).map((group) => ({
    ...group,
    name: exerciseNames.value[group.exerciseId] || exerciseById.value[group.exerciseId]?.name || 'Exercise',
  }))
})

function formatWeightLabel(kg: number | null | undefined): string {
  if (kg == null) return ''
  const n = units.toDisplay(kg)
  return n == null ? '' : `${n}${units.label.value.toLowerCase()}`
}

function setLine(set: WorkoutSet): string {
  const exercise = exerciseById.value[set.exercise_id]
  return formatLoggedSetLine(set, exercise, formatWeightLabel)
}

async function copyReport() {
  if (!detail.value) return
  const text = buildWorkoutReportText(detail.value, exerciseById.value, formatWeightLabel, exerciseNames.value)
  try {
    await navigator.clipboard.writeText(text)
    ui.pushToast('Report copied')
  } catch {
    ui.pushToast('Could not copy report')
  }
}

async function deleteSession(workout: Workout) {
  const label = workout.name || 'Workout'
  if (!confirm(`Delete "${label}"? This removes its sets, volume, and calendar entry. This cannot be undone.`)) {
    return
  }
  deleting.value = true
  try {
    await reports.deleteWorkout(workout.id)
    if (selected.value === workout.id) selected.value = null
    ui.pushToast('Session deleted')
  } catch {
    ui.pushToast('Could not delete session')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="grid gap-4 pb-10">
    <h1 class="display text-4xl">History</h1>
    <div class="flex gap-2">
      <button class="btn-ghost" :class="{ 'text-[var(--accent)]': tab === 'workouts' }" @click="tab = 'workouts'">Sessions</button>
      <button class="btn-ghost" :class="{ 'text-[var(--accent)]': tab === 'weekly' }" @click="tab = 'weekly'">Weekly</button>
      <button class="btn-ghost" :class="{ 'text-[var(--accent)]': tab === 'monthly' }" @click="tab = 'monthly'">Monthly</button>
    </div>
    <p v-if="filterDate" class="text-sm text-[var(--muted)]">
      Showing sessions on {{ filterDate }}.
      <NuxtLink to="/history" class="text-[var(--accent)]">Clear</NuxtLink>
    </p>
    <div v-if="tab === 'workouts'" class="grid gap-2">
      <p v-if="filterDate && !reports.workouts.length" class="text-sm text-[var(--muted)]">
        No sessions on this day.
      </p>
      <div v-for="w in reports.workouts" :key="w.id" class="card flex items-start gap-2 p-4">
        <button type="button" class="min-w-0 flex-1 text-left" @click="selected = w.id">
          <p class="font-semibold">{{ w.name || 'Workout' }}</p>
          <WorkoutSessionMeta :workout="w" />
        </button>
        <button
          type="button"
          class="btn-ghost shrink-0 text-red-400"
          :disabled="deleting"
          aria-label="Delete session"
          @click="deleteSession(w)"
        >
          <Icon name="lucide:trash-2" class="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
    <div v-else class="card p-4">
      <p>Volume: {{ Math.round((tab === 'weekly' ? reports.weekly?.total_volume : reports.monthly?.total_volume) || 0) }} kg</p>
      <p>Sets: {{ (tab === 'weekly' ? reports.weekly?.total_sets : reports.monthly?.total_sets) || 0 }}</p>
    </div>
    <div v-if="detail" class="fixed inset-0 z-30 bg-black/70 p-4" @click.self="selected = null">
      <div class="card mx-auto max-h-[min(90vh,720px)] max-w-lg overflow-y-auto p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <h2 class="display text-3xl">{{ detail.name || 'Workout' }}</h2>
          <div class="flex shrink-0 flex-wrap items-center gap-1">
            <button type="button" class="btn-ghost text-sm" @click="copyReport">
              <span class="inline-flex items-center gap-1.5">
                <Icon name="lucide:copy" class="size-4" aria-hidden="true" />
                Copy report
              </span>
            </button>
            <button
              type="button"
              class="btn-ghost text-sm text-red-400"
              :disabled="deleting"
              @click="detail && deleteSession(detail)"
            >
              <span class="inline-flex items-center gap-1.5">
                <Icon name="lucide:trash-2" class="size-4" aria-hidden="true" />
                Delete
              </span>
            </button>
          </div>
        </div>
        <WorkoutSessionMeta :workout="detail" />
        <div class="mt-5 space-y-5">
          <section v-for="group in detailGroups" :key="group.exerciseId">
            <h3 class="font-semibold">{{ group.name }}</h3>
            <ul class="mt-2 space-y-1.5 text-sm text-[var(--muted)]">
              <li v-for="s in group.sets" :key="s.id">
                {{ setLine(s) }}
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
