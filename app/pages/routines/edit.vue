<script setup lang="ts">
const route = useRoute()
const store = useRoutineStore()
const exercises = useExerciseStore()
const addId = computed(() => String(route.query.add || ''))
const showPicker = ref(false)
const failedImages = ref<Set<string>>(new Set())

onMounted(async () => {
  await exercises.load()
  if (route.query.id) {
    const r = await store.getOne(String(route.query.id))
    store.startDraft(r)
  } else if (!store.draft) {
    store.startDraft()
  }
  if (addId.value && store.draft) {
    const ex = exercises.items.find((e) => e.id === addId.value)
    store.draft.exercises.push({
      exercise_id: addId.value,
      order_index: store.draft.exercises.length,
      target_sets: 3,
      target_reps_range: '8-12',
      rest_seconds: 90,
      notes: null,
      exercise_name: ex?.name,
    })
  }
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

function handleSelect(payload: { id: string; name: string }) {
  if (!store.draft) return
  store.draft.exercises.push({
    exercise_id: payload.id,
    order_index: store.draft.exercises.length,
    target_sets: 3,
    target_reps_range: '8-12',
    rest_seconds: 90,
    notes: null,
    exercise_name: payload.name,
  })
}

function thumbFor(id: string): string | null {
  const ex = exercises.items.find((e) => e.id === id)
  if (!ex?.gif_url) return null
  if (failedImages.value.has(id)) return null
  return ex.gif_url
}

function muscleFor(id: string): string | null {
  const ex = exercises.items.find((e) => e.id === id)
  return ex?.target || ex?.body_part || null
}

function equipmentFor(id: string): string | null {
  const ex = exercises.items.find((e) => e.id === id)
  return ex?.equipment || null
}

function imageFailed(id: string) {
  failedImages.value = new Set([...failedImages.value, id])
}

async function save() {
  if (!store.draft?.name?.trim()) return
  await store.saveDraft()
  await navigateTo('/routines')
}
</script>

<template>
  <div v-if="store.draft" class="mx-auto grid max-w-2xl gap-4 pb-24">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <button class="btn-ghost -ml-2" @click="navigateTo('/routines')">← Cancel</button>
      <h1 class="text-lg font-semibold">
        {{ store.draft.id ? 'Edit Routine' : 'New Routine' }}
      </h1>
      <button class="btn-primary" @click="save">Save</button>
    </div>

    <!-- Routine title -->
    <input
      v-model="store.draft.name"
      class="input text-xl font-semibold"
      placeholder="Routine title"
    />

    <!-- Exercise cards -->
    <div class="grid gap-4">
      <article
        v-for="(item, i) in store.draft.exercises"
        :key="item.exercise_id + i"
        class="card p-4"
      >
        <!-- Card header: thumb + name + menu -->
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
            <p class="truncate text-base font-semibold text-[var(--accent)]">
              {{ item.exercise_name || item.exercise_id }}
            </p>
            <p class="truncate text-xs text-[var(--muted)]">
              <span v-if="muscleFor(item.exercise_id)">{{ muscleFor(item.exercise_id) }}</span>
              <span v-if="muscleFor(item.exercise_id) && equipmentFor(item.exercise_id)"> · </span>
              <span v-if="equipmentFor(item.exercise_id)">{{ equipmentFor(item.exercise_id) }}</span>
            </p>
          </div>

          <!-- Reorder / remove menu -->
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

        <!-- Notes -->
        <input
          v-model="item.notes"
          class="input mt-3 w-full"
          placeholder="Add routine notes here"
        />

        <!-- Rest timer pill -->
        <div class="mt-3 flex items-center gap-2 text-sm text-[var(--accent)]">
          <span>⏱</span>
          <span>Rest Timer:</span>
          <input
            v-model.number="item.rest_seconds"
            type="number"
            min="0"
            class="w-16 bg-transparent text-sm font-semibold outline-none"
          />
          <span>s</span>
        </div>

        <!-- Column headers -->
        <div class="mt-4 grid grid-cols-[56px_1fr_1fr] gap-2 px-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          <span>Sets</span>
          <span>Reps</span>
          <span>Rest (s)</span>
        </div>

        <!-- Row -->
        <div class="mt-2 grid grid-cols-[56px_1fr_1fr] gap-2">
          <div class="grid h-11 place-items-center rounded-lg bg-[var(--surface)] font-semibold">
            {{ item.target_sets || 1 }}
          </div>
          <input
            v-model="item.target_reps_range"
            class="input h-11 text-center"
            placeholder="8-12"
          />
          <input
            v-model.number="item.rest_seconds"
            type="number"
            min="0"
            class="input h-11 text-center"
            placeholder="90"
          />
        </div>

        <!-- Sets stepper -->
        <div class="mt-3 flex items-center gap-2">
          <button
            class="grid h-9 w-9 place-items-center rounded-lg bg-[var(--surface)] text-lg"
            @click="item.target_sets = Math.max(1, (item.target_sets || 1) - 1)"
          >−</button>
          <span class="text-sm text-[var(--muted)]">{{ item.target_sets }} sets</span>
          <button
            class="grid h-9 w-9 place-items-center rounded-lg bg-[var(--surface)] text-lg"
            @click="item.target_sets = (item.target_sets || 0) + 1"
          >+</button>
        </div>
      </article>
    </div>

    <!-- Empty state -->
    <div v-if="!store.draft.exercises.length" class="card py-10 text-center text-[var(--muted)]">
      No exercises yet. Tap "Add exercise" below.
    </div>

    <!-- Bottom actions -->
    <div class="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--bg)]/95 p-4 backdrop-blur md:static md:rounded-xl md:border md:bg-[var(--surface)]">
      <div class="mx-auto grid max-w-2xl gap-2">
        <button class="btn-primary w-full" @click="showPicker = true">
          + Add exercise
        </button>
        <button class="btn-ghost w-full" @click="save">
          Save routine
        </button>
      </div>
    </div>

    <ExercisePickerModal
      :open="showPicker"
      @close="showPicker = false"
      @select="handleSelect"
    />
  </div>
</template>