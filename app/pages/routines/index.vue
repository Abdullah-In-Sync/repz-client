<script setup lang="ts">
const store = useRoutineStore()
const workout = useWorkoutStore()
onMounted(() => store.load())

async function startRoutine(id: string) {
  const routine = await store.getOne(id)
  const last = await store.lastLogged(id)
  const exStore = useExerciseStore()
  const exercises = []
  for (const item of routine.exercises) {
    try {
      exercises.push(await exStore.getOne(item.exercise_id))
    } catch {
      /* skip */
    }
  }
  await workout.start({ name: routine.name, routineId: routine.id, lastLogged: last, exercises })
  if (workout.session) await navigateTo(`/workout/${workout.session.id}`)
}
</script>

<template>
  <div class="grid gap-4 pb-10">
    <div class="flex items-center justify-between">
      <h1 class="display text-4xl">Routines</h1>
      <NuxtLink to="/routines/edit" class="btn-primary">New</NuxtLink>
    </div>
    <div class="grid gap-3 lg:grid-cols-2">
      <article v-for="r in store.items" :key="r.id" class="card p-4">
        <h2 class="text-xl font-semibold">{{ r.name }}</h2>
        <p class="text-sm text-[var(--muted)]">{{ r.exercises.length }} exercises</p>
        <div class="mt-4 flex gap-2">
          <button class="btn-primary" @click="startRoutine(r.id)">Start</button>
          <NuxtLink :to="`/routines/edit?id=${r.id}`" class="btn-ghost">Edit</NuxtLink>
          <button class="btn-ghost text-[var(--warn)]" @click="store.remove(r.id)">Delete</button>
        </div>
      </article>
    </div>
  </div>
</template>
