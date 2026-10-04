<script setup lang="ts">
const workout = useWorkoutStore()
const units = useUnits()
const rest = useRestTimer()
const elapsed = ref(0)

onMounted(() => {
  const tick = () => {
    elapsed.value = workout.startedAt ? Math.floor((Date.now() - workout.startedAt) / 1000) : 0
  }
  tick()
  const id = setInterval(tick, 1000)
  onUnmounted(() => clearInterval(id))
})

function fmt(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

function isCardioBlock(block: (typeof workout.blocks)[number]) {
  return block.is_time_based || block.is_distance_based
}

async function finish() {
  await workout.finish()
  await navigateTo('/history')
}
</script>

<template>
  <div class="grid gap-4 pb-28">
    <div class="card sticky top-0 z-10 flex items-center justify-between p-4">
      <div>
        <p class="text-xs text-[var(--muted)]">Live session</p>
        <p class="display text-2xl tabular">{{ fmt(elapsed) }}</p>
      </div>
      <div class="text-right">
        <p class="text-xs text-[var(--muted)]">Volume</p>
        <p class="display text-2xl tabular text-[var(--accent)]">{{ Math.round(workout.volumeKg) }} kg</p>
      </div>
    </div>
    <div v-if="rest.remaining" class="card p-4">
      <p class="text-sm">Rest {{ rest.remaining }}s</p>
      <div class="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div class="h-full bg-[var(--accent)]" :style="{ width: `${Number(rest.progress) * 100}%` }" />
      </div>
    </div>
    <article v-for="block in workout.blocks" :key="block.exercise_id" class="card p-4">
      <h2 class="font-semibold">{{ block.exercise_name }}</h2>

      <template v-if="isCardioBlock(block)">
        <div
          class="mt-3 grid gap-2 px-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]"
          :class="block.is_distance_based && block.is_time_based ? 'grid-cols-[48px_1fr_1fr]' : 'grid-cols-2'"
        >
          <span>Set</span>
          <span v-if="block.is_distance_based">Km</span>
          <span v-if="block.is_time_based">Time</span>
        </div>
        <div
          v-for="set in block.sets"
          :key="set.localId"
          class="mt-2 grid gap-2 rounded-xl bg-[var(--surface-2)] p-3"
          :class="block.is_distance_based && block.is_time_based ? 'grid-cols-[48px_1fr_1fr]' : 'grid-cols-2'"
        >
          <div class="grid h-11 place-items-center rounded-lg bg-[var(--surface)] font-semibold tabular-nums">
            {{ set.set_number }}
          </div>
          <input
            v-if="block.is_distance_based"
            v-model.number="set.distance_km"
            class="input h-11 text-center"
            type="number"
            step="0.1"
            min="0"
            placeholder="0.0"
          />
          <DurationInput
            v-if="block.is_time_based"
            v-model="set.duration_seconds"
            input-class="input h-11 text-center tabular-nums"
          />
          <div
            class="col-span-full flex gap-2"
            :class="block.is_distance_based && block.is_time_based ? '' : 'col-span-2'"
          >
            <button class="btn-primary flex-1" :disabled="set.is_completed" @click="workout.completeSet(set.localId)">
              {{ set.is_completed ? 'Done' : 'Complete' }}
            </button>
            <button class="btn-ghost" @click="workout.deleteSet(set.localId)">Delete</button>
          </div>
        </div>
      </template>

      <template v-else>
        <div v-for="set in block.sets" :key="set.localId" class="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-[var(--surface-2)] p-3 lg:grid-cols-5">
          <label v-if="block.is_load_based" class="text-xs">
            Weight ({{ units.label }})
            <input
              class="input mt-1"
              type="number"
              :value="units.toDisplay(set.weight_kg) ?? ''"
              @input="set.weight_kg = units.toKg(Number(($event.target as HTMLInputElement).value))"
            />
          </label>
          <label v-if="block.is_reps_based" class="text-xs">
            Reps
            <input v-model.number="set.reps" class="input mt-1" type="number" />
          </label>
          <label v-if="block.is_load_based" class="text-xs">
            RPE
            <input v-model.number="set.rpe" class="input mt-1" type="number" step="0.5" min="1" max="10" />
          </label>
          <div class="col-span-2 flex gap-2 lg:col-span-5">
            <button class="btn-primary flex-1" :disabled="set.is_completed" @click="workout.completeSet(set.localId)">
              {{ set.is_completed ? 'Done' : 'Complete' }}
            </button>
            <button class="btn-ghost" @click="workout.deleteSet(set.localId)">Delete</button>
          </div>
        </div>
      </template>

      <button class="btn-ghost mt-3" @click="workout.addSet(block.exercise_id)">+ Add Set</button>
    </article>
    <p v-if="!workout.blocks.length" class="text-[var(--muted)]">
      Empty session. Add exercises from a routine next time, or finish when ready.
    </p>
    <button class="btn-primary" @click="finish">Finish workout</button>
  </div>
</template>
