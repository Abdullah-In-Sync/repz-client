<script setup lang="ts">
const workout = useWorkoutStore()
onMounted(async () => {
  if (workout.session) {
    await navigateTo(`/workout/${workout.session.id}`)
    return
  }
})

async function empty() {
  await workout.start({ name: 'Quick session', exercises: [] })
  if (workout.session) await navigateTo(`/workout/${workout.session.id}`)
}
</script>

<template>
  <div class="grid gap-4 pb-10">
    <h1 class="display text-4xl">Start a session</h1>
    <p class="text-[var(--muted)]">Pick a routine, or empty log.</p>
    <NuxtLink to="/routines" class="btn-primary">Choose routine</NuxtLink>
    <button class="btn-ghost" @click="empty">Empty workout</button>
  </div>
</template>
