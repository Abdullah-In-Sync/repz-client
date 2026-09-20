<script setup lang="ts">
const route = useRoute()
const store = useRoutineStore()
const exercises = useExerciseStore()
const addId = computed(() => String(route.query.add || ''))

onMounted(async () => {
  await exercises.load()
  if (route.query.id) {
    const r = await store.getOne(String(route.query.id))
    store.startDraft(r)
  } else if (!store.draft) {
    store.startDraft()
  }
  if (addId.value && store.draft) {
    store.draft.exercises.push({
      exercise_id: addId.value,
      order_index: store.draft.exercises.length,
      target_sets: 3,
      target_reps_range: '8-12',
      rest_seconds: 90,
      notes: null,
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

function add(id: string) {
  const ex = exercises.items.find((e) => e.id === id)
  store.draft?.exercises.push({
    exercise_id: id,
    order_index: store.draft.exercises.length,
    target_sets: 3,
    target_reps_range: '8-12',
    rest_seconds: 90,
    notes: null,
    exercise_name: ex?.name,
  })
}

async function save() {
  await store.saveDraft()
  await navigateTo('/routines')
}
</script>

<template>
  <div v-if="store.draft" class="grid gap-4 pb-10">
    <h1 class="display text-4xl">{{ store.draft.id ? 'Edit routine' : 'New routine' }}</h1>
    <input v-model="store.draft.name" class="input" placeholder="Routine name" />
    <textarea v-model="store.draft.description" class="input" placeholder="Description" />
    <div class="grid gap-2">
      <article v-for="(item, i) in store.draft.exercises" :key="item.exercise_id + i" class="card flex items-center gap-3 p-3">
        <div class="flex-1">
          <p class="font-semibold">{{ item.exercise_name || item.exercise_id }}</p>
          <div class="mt-2 grid grid-cols-3 gap-2">
            <input v-model.number="item.target_sets" class="input" type="number" placeholder="Sets" />
            <input v-model="item.target_reps_range" class="input" placeholder="Reps" />
            <input v-model.number="item.rest_seconds" class="input" type="number" placeholder="Rest s" />
          </div>
        </div>
        <div class="grid gap-1">
          <button class="btn-ghost" @click="move(i, -1)">↑</button>
          <button class="btn-ghost" @click="move(i, 1)">↓</button>
          <button class="btn-ghost text-[var(--warn)]" @click="store.draft?.exercises.splice(i, 1)">✕</button>
        </div>
      </article>
    </div>
    <details class="card p-4">
      <summary>Add exercise</summary>
      <input v-model="exercises.query.search" class="input my-2" placeholder="Search" @keyup.enter="exercises.load()" />
      <button v-for="ex in exercises.items" :key="ex.id" class="block w-full py-2 text-left text-sm" @click="add(ex.id)">
        {{ ex.name }}
      </button>
    </details>
    <button class="btn-primary" @click="save">Save routine</button>
  </div>
</template>
