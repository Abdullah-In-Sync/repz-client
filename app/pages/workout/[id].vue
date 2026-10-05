<script setup lang="ts">
import type { DraftSet, Exercise } from '~/types/api'
import { exerciseGifSrc } from '~/utils/exerciseMedia'
import { formatPreviousPerformance } from '~/utils/workoutPrefill'

definePageMeta({ layout: 'default' })

const route = useRoute()
const workout = useWorkoutStore()
const exercises = useExerciseStore()
const units = useUnits()
const rest = useRestTimer()
const elapsed = ref(0)
const failedImages = ref<Set<string>>(new Set())
const exerciseCache = ref<Record<string, Exercise>>({})
const rpePickerSetId = ref<string | null>(null)

const rpeChoices = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]

type WorkoutBlock = (typeof workout.blocks)[number]

onMounted(async () => {
  if (!workout.session || workout.session.id !== route.params.id) {
    await navigateTo('/workout')
    return
  }
  await exercises.load()
  for (const ex of exercises.items) {
    exerciseCache.value[ex.id] = ex
  }
  for (const block of workout.blocks) {
    if (block.rest_timer_enabled == null) block.rest_timer_enabled = false
    if (!exerciseCache.value[block.exercise_id]) {
      try {
        const ex = await exercises.getOne(block.exercise_id)
        exerciseCache.value[ex.id] = ex
      } catch {
        /* optional metadata */
      }
    }
  }
  const tick = () => {
    elapsed.value = workout.startedAt ? Math.floor((Date.now() - workout.startedAt) / 1000) : 0
  }
  tick()
  const id = setInterval(tick, 1000)
  onUnmounted(() => clearInterval(id))
})

const headerTimer = computed(() => {
  if (rest.remaining.value > 0) return `${rest.remaining.value}s`
  return fmt(elapsed.value)
})

function fmt(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

function exerciseFor(id: string): Exercise | undefined {
  return exerciseCache.value[id] ?? exercises.items.find((e) => e.id === id)
}

function isCardioBlock(block: WorkoutBlock) {
  return block.is_time_based || block.is_distance_based
}

function thumbFor(id: string): string | null {
  const ex = exerciseFor(id)
  if (!ex?.gif_url) return null
  if (failedImages.value.has(id)) return null
  return exerciseGifSrc(ex.gif_url, ex.updated_at)
}

function formatWeightLabel(kg: number | null | undefined): string {
  if (kg == null) return ''
  const n = units.toDisplay(kg)
  return n == null ? '' : `${n}${units.label.value.toLowerCase()}`
}

function previousLabel(set: DraftSet, block: WorkoutBlock): string {
  return formatPreviousPerformance({
    weight_kg: set.previous_weight_kg,
    reps: set.previous_reps,
    duration_seconds: set.previous_duration_seconds,
    distance_km: set.previous_distance_km,
    is_load_based: block.is_load_based,
    is_reps_based: block.is_reps_based,
    is_time_based: block.is_time_based,
    is_distance_based: block.is_distance_based,
    formatWeight: formatWeightLabel,
  })
}

function setDisplayWeight(set: DraftSet): string | number {
  return units.toDisplay(set.weight_kg) ?? ''
}

function updateSetWeight(set: DraftSet, event: Event) {
  const value = (event.target as HTMLInputElement).value
  set.weight_kg = value === '' ? null : units.toKg(Number(value))
}

function setInputClass(done: boolean) {
  return done
    ? 'log-input log-input--done'
    : 'log-input'
}

async function toggleSetDone(set: DraftSet) {
  await workout.toggleSetDone(set.localId, !set.is_completed)
}

function openRpePicker(set: DraftSet) {
  rpePickerSetId.value = set.localId
}

function pickRpe(set: DraftSet, value: number) {
  set.rpe = value
  rpePickerSetId.value = null
}

function rpePickerSet(): DraftSet | null {
  if (!rpePickerSetId.value) return null
  for (const block of workout.blocks) {
    const found = block.sets.find((s) => s.localId === rpePickerSetId.value)
    if (found) return found
  }
  return null
}

function toggleRestTimer(block: WorkoutBlock) {
  block.rest_timer_enabled = !block.rest_timer_enabled
}

function strengthGridStyle(block: WorkoutBlock): string {
  const cols = ['2rem', 'minmax(4.5rem, 1.15fr)']
  if (block.is_load_based) cols.push('minmax(3.25rem, 0.85fr)')
  if (block.is_reps_based) cols.push('minmax(3.25rem, 0.85fr)')
  cols.push('2.5rem', '2.75rem')
  return cols.join(' ')
}

function cardioGridStyle(block: WorkoutBlock): string {
  const cols = ['2rem', 'minmax(4.5rem, 1.2fr)']
  if (block.is_distance_based) cols.push('minmax(3.5rem, 1fr)')
  if (block.is_time_based) cols.push('minmax(3.5rem, 1fr)')
  cols.push('2.75rem')
  return cols.join(' ')
}

function imageFailed(id: string) {
  failedImages.value = new Set([...failedImages.value, id])
}

async function finish() {
  await workout.finish()
  await navigateTo('/history')
}
</script>

<template>
  <div v-if="workout.session" class="log-workout min-h-dvh bg-[var(--bg)] pb-8">
    <header
      class="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-[var(--bg)] px-3 py-3"
    >
      <button
        type="button"
        class="grid h-10 w-10 place-items-center rounded-lg text-xl text-[var(--muted)] hover:bg-white/5"
        aria-label="Back"
        @click="navigateTo('/routines')"
      >
        ⌄
      </button>
      <div class="flex items-center gap-3">
        <span class="text-lg font-semibold tabular-nums text-[var(--accent-2)]">{{ headerTimer }}</span>
        <button
          type="button"
          class="grid h-9 w-9 place-items-center rounded-lg text-[var(--accent-2)] hover:bg-white/5"
          aria-label="Rest timer"
          @click="rest.remaining ? rest.stop() : undefined"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
            <path
              d="M12 2a10 10 0 1 0 10 10h-2A8 8 0 1 1 12 4V2zm1 4v5.3l3.3 1.9-.9 1.6L11 13V6h2z"
            />
          </svg>
        </button>
      </div>
      <button
        type="button"
        class="rounded-lg bg-[var(--accent-2)] px-4 py-2 text-sm font-bold text-black"
        @click="finish"
      >
        Finish
      </button>
    </header>

    <div v-if="rest.remaining" class="border-b border-white/5 bg-[var(--surface)] px-4 py-2">
      <div class="h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div
          class="h-full bg-[var(--accent-2)] transition-all"
          :style="{ width: `${Number(rest.progress) * 100}%` }"
        />
      </div>
    </div>

    <section v-for="block in workout.blocks" :key="block.exercise_id" class="border-b border-white/5 px-3 py-4">
      <div class="flex items-start gap-3">
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-2)]"
        >
          <img
            v-if="thumbFor(block.exercise_id)"
            :src="thumbFor(block.exercise_id)!"
            :alt="block.exercise_name"
            class="h-full w-full object-cover"
            loading="lazy"
            @error="imageFailed(block.exercise_id)"
          />
          <span v-else class="text-base">💪</span>
        </div>
        <p class="min-w-0 flex-1 pt-1 text-base font-semibold leading-snug text-[var(--accent-2)]">
          {{ block.exercise_name }}
        </p>
        <button
          type="button"
          class="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg text-[var(--muted)] hover:bg-white/5"
          aria-label="Exercise options"
        >
          ⋮
        </button>
      </div>

      <input
        v-model="block.notes"
        type="text"
        class="mt-3 w-full border-0 bg-transparent px-0 text-sm text-[var(--muted)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-0"
        placeholder="Add notes here..."
      />

      <button
        type="button"
        class="mt-2 flex items-center gap-2 text-sm text-[var(--accent-2)]"
        @click="toggleRestTimer(block)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
          <path
            d="M12 2a10 10 0 1 0 10 10h-2A8 8 0 1 1 12 4V2zm1 4v5.3l3.3 1.9-.9 1.6L11 13V6h2z"
          />
        </svg>
        Rest Timer:
        {{ block.rest_timer_enabled ? `${block.rest_seconds}s` : 'OFF' }}
      </button>

      <!-- Strength table -->
      <template v-if="!isCardioBlock(block)">
        <div class="log-table-head mt-4" :style="{ gridTemplateColumns: strengthGridStyle(block) }">
          <span>Set</span>
          <span>Previous</span>
          <span v-if="block.is_load_based">{{ units.label }}</span>
          <span v-if="block.is_reps_based">Reps</span>
          <span class="text-center">RPE</span>
          <span aria-hidden="true" />
        </div>

        <div
          v-for="set in block.sets"
          :key="set.localId"
          class="log-table-row"
          :style="{ gridTemplateColumns: strengthGridStyle(block) }"
          :class="{ 'log-table-row--done': set.is_completed }"
        >
          <div class="log-set-badge">{{ set.set_number }}</div>
          <p class="truncate text-xs text-[var(--muted)]">{{ previousLabel(set, block) }}</p>
          <input
            v-if="block.is_load_based"
            class="text-center tabular-nums"
            :class="setInputClass(set.is_completed)"
            type="number"
            min="0"
            step="0.5"
            placeholder="0"
            :value="setDisplayWeight(set)"
            @input="updateSetWeight(set, $event)"
          />
          <input
            v-if="block.is_reps_based"
            v-model.number="set.reps"
            class="text-center tabular-nums"
            :class="setInputClass(set.is_completed)"
            type="number"
            min="0"
            placeholder="0"
          />
          <button
            type="button"
            class="log-rpe-btn"
            :class="set.is_completed ? 'log-rpe-btn--done' : ''"
            @click="openRpePicker(set)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5 opacity-70">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"
              />
            </svg>
            <span v-if="set.rpe != null" class="text-xs font-semibold">{{ set.rpe }}</span>
          </button>
          <button
            type="button"
            class="log-check-btn"
            :class="set.is_completed ? 'log-check-btn--done' : ''"
            :aria-label="set.is_completed ? 'Mark set incomplete' : 'Complete set'"
            @click="toggleSetDone(set)"
          >
            ✓
          </button>
        </div>

        <button type="button" class="log-add-set mt-3" @click="workout.addSet(block.exercise_id)">
          + Add Set
        </button>
      </template>

      <!-- Cardio table -->
      <template v-else>
        <div class="log-table-head mt-4" :style="{ gridTemplateColumns: cardioGridStyle(block) }">
          <span>Set</span>
          <span>Previous</span>
          <span v-if="block.is_distance_based">Km</span>
          <span v-if="block.is_time_based">Time</span>
          <span aria-hidden="true" />
        </div>

        <div
          v-for="set in block.sets"
          :key="set.localId"
          class="log-table-row"
          :style="{ gridTemplateColumns: cardioGridStyle(block) }"
          :class="{ 'log-table-row--done': set.is_completed }"
        >
          <div class="log-set-badge">{{ set.set_number }}</div>
          <p class="truncate text-xs text-[var(--muted)]">{{ previousLabel(set, block) }}</p>
          <input
            v-if="block.is_distance_based"
            v-model.number="set.distance_km"
            class="text-center tabular-nums"
            :class="setInputClass(set.is_completed)"
            type="number"
            step="0.1"
            min="0"
            placeholder="0"
          />
          <DurationInput
            v-if="block.is_time_based"
            v-model="set.duration_seconds"
            :input-class="`${setInputClass(set.is_completed)} text-center tabular-nums`"
          />
          <button
            type="button"
            class="log-check-btn"
            :class="set.is_completed ? 'log-check-btn--done' : ''"
            @click="toggleSetDone(set)"
          >
            ✓
          </button>
        </div>

        <button type="button" class="log-add-set mt-3" @click="workout.addSet(block.exercise_id)">
          + Add Set
        </button>
      </template>
    </section>

    <p v-if="!workout.blocks.length" class="px-4 py-16 text-center text-sm text-[var(--muted)]">
      Empty session. Start from a routine to load exercises.
    </p>

    <!-- RPE picker sheet -->
    <Teleport to="body">
      <div
        v-if="rpePickerSetId && rpePickerSet()"
        class="fixed inset-0 z-50 flex items-end bg-black/60"
        @click.self="rpePickerSetId = null"
      >
        <div class="w-full rounded-t-2xl bg-[var(--surface)] p-4 pb-8">
          <p class="mb-3 text-center text-sm font-semibold text-[var(--muted)]">Rate perceived exertion</p>
          <div class="grid grid-cols-5 gap-2">
            <button
              v-for="value in rpeChoices"
              :key="value"
              type="button"
              class="rounded-xl py-3 text-sm font-semibold"
              :class="
                rpePickerSet()?.rpe === value
                  ? 'bg-[var(--accent-2)] text-black'
                  : 'bg-[var(--surface-2)] text-[var(--text)]'
              "
              @click="pickRpe(rpePickerSet()!, value)"
            >
              {{ value }}
            </button>
          </div>
          <button
            type="button"
            class="mt-3 w-full py-2 text-sm text-[var(--muted)]"
            @click="rpePickerSet()!.rpe = null; rpePickerSetId = null"
          >
            Clear RPE
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.log-table-head,
.log-table-row {
  display: grid;
  align-items: center;
  gap: 0.35rem;
}

.log-table-head span {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}

.log-table-row {
  margin-top: 0.35rem;
  padding: 0.35rem 0.15rem;
  border-radius: 0.5rem;
  transition: background-color 0.15s ease;
}

.log-table-row--done {
  background: rgba(34, 120, 70, 0.55);
}

.log-set-badge {
  display: grid;
  height: 2rem;
  width: 2rem;
  place-items: center;
  border-radius: 0.375rem;
  background: var(--surface-2);
  font-size: 0.875rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.log-table-row--done .log-set-badge {
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
}

.log-input {
  height: 2.5rem;
  width: 100%;
  border-radius: 0.375rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--surface-2);
  padding: 0 0.25rem;
  font-size: 0.95rem;
  color: var(--text);
  outline: none;
}

.log-input:focus {
  border-color: var(--accent-2);
}

.log-input--done {
  border-color: transparent;
  background: transparent;
  color: #fff;
  font-weight: 600;
}

.log-rpe-btn {
  display: flex;
  height: 2.5rem;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
  border-radius: 0.375rem;
  background: var(--surface-2);
  color: var(--muted);
}

.log-rpe-btn--done {
  background: transparent;
  color: #fff;
}

.log-check-btn {
  display: grid;
  height: 2.75rem;
  width: 2.75rem;
  place-items: center;
  border-radius: 0.5rem;
  background: var(--surface-2);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--muted);
}

.log-check-btn--done {
  background: var(--success);
  color: #000;
}

.log-add-set {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  border-radius: 0.5rem;
  background: var(--surface-2);
  padding: 0.85rem 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
}

.log-add-set:active {
  transform: scale(0.99);
}
</style>
