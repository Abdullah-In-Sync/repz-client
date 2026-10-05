<script setup lang="ts">
import type { Exercise, RoutineExercise, RoutineSetTarget } from '~/types/api'

const route = useRoute()
const routineReturnTo = computed(() => encodeURIComponent(route.fullPath))
const store = useRoutineStore()
const exercises = useExerciseStore()
const units = useUnits()
const ui = useUiStore()
const saving = ref(false)
const titleInput = ref<HTMLInputElement | null>(null)
const addId = computed(() => String(route.query.add || ''))
const showPicker = ref(false)
const failedImages = ref<Set<string>>(new Set())
/** Full exercise rows keyed by id (list API is paginated — treadmill may not be on page 1). */
const exerciseCache = ref<Record<string, Exercise>>({})
const draftReady = ref(false)

function exerciseFor(id: string): Exercise | undefined {
  return exerciseCache.value[id] ?? exercises.items.find((e) => e.id === id)
}

function displayName(item: RoutineExercise): string {
  return item.exercise_name || exerciseFor(item.exercise_id)?.name || item.exercise_id
}

function isCardio(id: string): boolean {
  const ex = exerciseFor(id)
  if (!ex) return false
  return ex.is_time_based || ex.is_distance_based
}

async function ensureExercise(id: string): Promise<Exercise | undefined> {
  try {
    const ex = await exercises.getOne(id)
    exerciseCache.value = { ...exerciseCache.value, [id]: ex }
    const listIdx = exercises.items.findIndex((e) => e.id === id)
    if (listIdx >= 0) exercises.items[listIdx] = ex
    return ex
  } catch {
    return exerciseFor(id)
  }
}

function newLine(exerciseId: string, orderIndex: number, ex?: Exercise): RoutineExercise {
  const resolved = ex ?? exerciseFor(exerciseId)
  const cardio = resolved && (resolved.is_time_based || resolved.is_distance_based)
  return {
    exercise_id: exerciseId,
    order_index: orderIndex,
    target_sets: 1,
    target_reps_range: cardio ? null : '8-12',
    target_duration_seconds: resolved?.is_time_based ? 1200 : null,
    target_distance_km: resolved?.is_distance_based ? 3 : null,
    target_weight_kg: null,
    rest_seconds: cardio ? 60 : 90,
    notes: null,
    set_targets: cardio
      ? null
      : [{ reps_range: '8-12', weight_kg: null, rest_seconds: 90 }],
    exercise_name: resolved?.name,
  }
}

function ensureSetTargets(item: RoutineExercise) {
  if (isCardio(item.exercise_id)) return
  if (!item.set_targets?.length) {
    const count = Math.max(1, item.target_sets || 1)
    item.set_targets = Array.from({ length: count }, () => ({
      reps_range: item.target_reps_range,
      weight_kg: item.target_weight_kg,
      rest_seconds: item.rest_seconds,
    }))
  }
  item.target_sets = item.set_targets.length
}

function addSet(item: RoutineExercise) {
  ensureSetTargets(item)
  const previous = item.set_targets?.at(-1)
  item.set_targets?.push({
    reps_range: previous?.reps_range ?? '8-12',
    weight_kg: previous?.weight_kg ?? null,
    rest_seconds: previous?.rest_seconds ?? 90,
  })
  item.target_sets = item.set_targets?.length || 1
}

function removeSet(item: RoutineExercise, index: number) {
  if (!item.set_targets || item.set_targets.length <= 1) return
  item.set_targets.splice(index, 1)
  item.target_sets = item.set_targets.length
}

function setDisplayWeight(set: RoutineSetTarget): string | number {
  return units.toDisplay(set.weight_kg) ?? ''
}

function updateSetWeight(set: RoutineSetTarget, event: Event) {
  const value = (event.target as HTMLInputElement).value
  set.weight_kg = value === '' ? null : units.toKg(Number(value))
}

function fixStrengthDefaultsOnCardio(item: RoutineExercise, ex: Exercise) {
  if (!ex.is_time_based && !ex.is_distance_based) return
  if (item.target_reps_range !== '8-12' && item.target_reps_range != null) return
  item.target_sets = 1
  item.target_reps_range = null
  if (ex.is_time_based && !item.target_duration_seconds) item.target_duration_seconds = 1200
  if (ex.is_distance_based && item.target_distance_km == null) item.target_distance_km = 3
}

async function hydrateDraftExercises() {
  if (!store.draft) return
  for (const item of store.draft.exercises) {
    const ex = await ensureExercise(item.exercise_id)
    if (!ex) continue
    if (!item.exercise_name) item.exercise_name = ex.name
    fixStrengthDefaultsOnCardio(item, ex)
    ensureSetTargets(item)
  }
}

onMounted(async () => {
  await exercises.load()
  for (const ex of exercises.items) {
    exerciseCache.value[ex.id] = ex
  }
  if (route.query.id) {
    const r = await store.getOne(String(route.query.id))
    store.startDraft(r)
  } else {
    store.startDraft()
  }
  if (addId.value && store.draft) {
    const ex = await ensureExercise(addId.value)
    store.draft.exercises.push(newLine(addId.value, store.draft.exercises.length, ex))
  }
  await hydrateDraftExercises()
  draftReady.value = true
})

onActivated(async () => {
  if (!store.draft) return
  await hydrateDraftExercises()
})

function move(i: number, dir: number) {
  if (!store.draft) return
  const j = i + dir
  if (j < 0 || j >= store.draft.exercises.length) return
  const copy = [...store.draft.exercises]
  const a = copy[i]
  const b = copy[j]
  if (!a || !b) return
  copy[i] = b
  copy[j] = a
  store.draft.exercises = copy
}

async function handleSelect(payload: { id: string; name: string }) {
  if (!store.draft) return
  const ex = await ensureExercise(payload.id)
  store.draft.exercises.push(newLine(payload.id, store.draft.exercises.length, ex))
}

function thumbFor(id: string): string | null {
  const ex = exerciseFor(id)
  if (!ex?.gif_url) return null
  if (failedImages.value.has(id)) return null
  return exerciseGifSrc(ex.gif_url, ex.updated_at)
}

function muscleFor(id: string): string | null {
  const ex = exerciseFor(id)
  return ex?.target || ex?.body_part || null
}

function equipmentFor(id: string): string | null {
  const ex = exerciseFor(id)
  return ex?.equipment || null
}

function trackingLabel(id: string): string {
  const ex = exerciseFor(id)
  if (!ex) return ''
  const parts: string[] = []
  if (ex.is_time_based) parts.push('time')
  if (ex.is_distance_based) parts.push('distance')
  if (ex.is_load_based) parts.push('load')
  if (ex.is_reps_based) parts.push('reps')
  return parts.join(' · ')
}

function showReps(id: string): boolean {
  const ex = exerciseFor(id)
  if (!ex) return true
  return ex.is_reps_based
}

function showLoad(id: string): boolean {
  return !!exerciseFor(id)?.is_load_based
}

function imageFailed(id: string) {
  failedImages.value = new Set([...failedImages.value, id])
}

function prepareDraftForSave(): boolean {
  if (!store.draft) return false
  for (const item of store.draft.exercises) {
    ensureSetTargets(item)
  }
  const name = store.draft.name.trim()
  if (!name) {
    ui.pushToast('Enter a routine title before saving')
    titleInput.value?.focus()
    return false
  }
  store.draft.name = name
  return true
}

async function save() {
  if (saving.value || !store.draft) return
  if (!prepareDraftForSave()) return
  saving.value = true
  try {
    await store.saveDraft()
    await navigateTo('/routines')
  } catch {
    /* toast handled by useApi */
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="store.draft && draftReady" class="mx-auto grid max-w-2xl gap-4 pb-24">
    <div class="flex items-center justify-between">
      <button class="btn-ghost -ml-2" @click="navigateTo('/routines')">← Cancel</button>
      <h1 class="text-lg font-semibold">
        {{ store.draft.id ? 'Edit Routine' : 'New Routine' }}
      </h1>
      <button type="button" class="btn-primary" :disabled="saving" @click="save">
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
    </div>

    <input
      ref="titleInput"
      v-model="store.draft.name"
      class="input text-xl font-semibold"
      placeholder="Routine title"
      required
      @keydown.enter.prevent="save"
    />

    <div class="grid gap-4">
      <article
        v-for="(item, i) in store.draft.exercises"
        :key="item.exercise_id + i"
        class="card p-4"
      >
        <div class="flex items-start gap-3">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface)]">
            <img
              v-if="thumbFor(item.exercise_id)"
              :src="thumbFor(item.exercise_id)!"
              :alt="item.exercise_name || ''"
              class="h-full w-full object-cover"
              loading="lazy"
              @error="imageFailed(item.exercise_id)"
            />
            <span v-else class="text-lg">💪</span>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex min-w-0 items-center gap-2">
              <p class="truncate text-base font-semibold text-[var(--accent)]">
                {{ displayName(item) }}
              </p>
              <NuxtLink
                :to="`/exercises?id=${item.exercise_id}&edit=1&returnTo=${routineReturnTo}`"
                class="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--accent)]"
              >
                Edit
              </NuxtLink>
            </div>
            <p class="truncate text-xs text-[var(--muted)]">
              <span v-if="muscleFor(item.exercise_id)">{{ muscleFor(item.exercise_id) }}</span>
              <span v-if="muscleFor(item.exercise_id) && equipmentFor(item.exercise_id)"> · </span>
              <span v-if="equipmentFor(item.exercise_id)">{{ equipmentFor(item.exercise_id) }}</span>
            </p>
            <p v-if="trackingLabel(item.exercise_id)" class="mt-0.5 text-xs text-[var(--muted)]">
              Track: {{ trackingLabel(item.exercise_id) }}
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-1">
            <button
              class="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface)] disabled:opacity-30"
              :disabled="i === 0"
              @click="move(i, -1)"
            >↑</button>
            <button
              class="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface)] disabled:opacity-30"
              :disabled="i === store.draft.exercises.length - 1"
              @click="move(i, 1)"
            >↓</button>
            <button
              class="grid h-8 w-8 place-items-center rounded-lg text-[var(--warn)] hover:bg-[var(--surface)]"
              @click="store.draft?.exercises.splice(i, 1)"
            >✕</button>
          </div>
        </div>

        <input
          v-model="item.notes"
          class="input mt-3 w-full"
          placeholder="Add routine notes here"
        />

        <!-- Cardio targets -->
        <template v-if="isCardio(item.exercise_id)">
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <label v-if="exerciseFor(item.exercise_id)?.is_time_based" class="text-xs">
              Target time (mm:ss)
              <DurationInput v-model="item.target_duration_seconds" placeholder="20:00" />
            </label>
            <label v-if="exerciseFor(item.exercise_id)?.is_distance_based" class="text-xs">
              Target distance (km)
              <input
                v-model.number="item.target_distance_km"
                class="input mt-1"
                type="number"
                min="0"
                step="0.1"
                placeholder="3"
              />
            </label>
          </div>
          <p class="mt-2 text-xs text-[var(--muted)]">
            Live workouts will show time and distance fields instead of reps and weight.
          </p>
        </template>

        <!-- Strength targets -->
        <template v-else>
          <div
            class="mt-4 grid gap-2 px-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]"
            :class="
              showLoad(item.exercise_id) && showReps(item.exercise_id)
                ? 'grid-cols-[48px_1fr_1fr_1fr]'
                : showLoad(item.exercise_id)
                  ? 'grid-cols-[48px_1fr_1fr]'
                  : 'grid-cols-[48px_1fr_1fr]'
            "
          >
            <span>Set</span>
            <span v-if="showReps(item.exercise_id)">Reps</span>
            <span v-if="showLoad(item.exercise_id)">Load ({{ units.label }})</span>
            <span>Rest (s)</span>
          </div>

          <div
            v-for="(set, setIndex) in item.set_targets"
            :key="setIndex"
            class="mt-2 grid gap-2"
            :class="
              showLoad(item.exercise_id) && showReps(item.exercise_id)
                ? 'grid-cols-[48px_1fr_1fr_1fr]'
                : showLoad(item.exercise_id)
                  ? 'grid-cols-[48px_1fr_1fr]'
                  : 'grid-cols-[48px_1fr_1fr]'
            "
          >
            <div class="grid h-11 place-items-center rounded-lg bg-[var(--surface)] font-semibold">
              {{ setIndex + 1 }}
            </div>
            <input
              v-if="showReps(item.exercise_id)"
              v-model="set.reps_range"
              class="input h-11 text-center"
              placeholder="8-12"
            />
            <input
              v-if="showLoad(item.exercise_id)"
              class="input h-11 text-center"
              type="number"
              min="0"
              step="0.5"
              placeholder="0"
              :value="setDisplayWeight(set)"
              @input="updateSetWeight(set, $event)"
            />
            <div class="relative">
              <input
                v-model.number="set.rest_seconds"
                type="number"
                min="0"
                class="input h-11 text-center"
                placeholder="90"
              />
              <button
                v-if="(item.set_targets?.length || 0) > 1"
                type="button"
                class="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-[var(--warn)] text-xs text-black"
                aria-label="Remove set"
                @click="removeSet(item, setIndex)"
              >×</button>
            </div>
          </div>

          <button type="button" class="btn-ghost mt-3 w-full" @click="addSet(item)">
            + Add set
          </button>
        </template>
      </article>
    </div>

    <div v-if="!store.draft.exercises.length" class="card py-10 text-center text-[var(--muted)]">
      No exercises yet. Tap "Add exercise" below.
    </div>

    <div class="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--bg)]/95 p-4 backdrop-blur md:static md:rounded-xl md:border md:bg-[var(--surface)]">
      <div class="mx-auto grid max-w-2xl gap-2">
        <button class="btn-primary w-full" @click="showPicker = true">
          + Add exercise
        </button>
        <button type="button" class="btn-ghost w-full" :disabled="saving" @click="save">
          {{ saving ? 'Saving…' : 'Save routine' }}
        </button>
      </div>
    </div>

    <ExercisePickerModal
      :open="showPicker"
      @close="showPicker = false"
      @select="handleSelect"
    />
  </div>
  <p v-else-if="store.draft" class="py-12 text-center text-[var(--muted)]">Loading exercises…</p>
</template>
