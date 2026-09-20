<script setup lang="ts">
const reports = useReportStore()
const tab = ref<'workouts' | 'weekly' | 'monthly'>('workouts')
const selected = ref<string | null>(null)
onMounted(async () => {
  await reports.loadHistory()
  await reports.loadDashboard().catch(() => {})
})

const detail = computed(() => reports.workouts.find((w) => w.id === selected.value))
</script>

<template>
  <div class="grid gap-4 pb-10">
    <h1 class="display text-4xl">History</h1>
    <div class="flex gap-2">
      <button class="btn-ghost" :class="{ 'text-[var(--accent)]': tab === 'workouts' }" @click="tab = 'workouts'">Sessions</button>
      <button class="btn-ghost" :class="{ 'text-[var(--accent)]': tab === 'weekly' }" @click="tab = 'weekly'">Weekly</button>
      <button class="btn-ghost" :class="{ 'text-[var(--accent)]': tab === 'monthly' }" @click="tab = 'monthly'">Monthly</button>
    </div>
    <div v-if="tab === 'workouts'" class="grid gap-2">
      <button v-for="w in reports.workouts" :key="w.id" class="card p-4 text-left" @click="selected = w.id">
        <p class="font-semibold">{{ w.name || 'Workout' }}</p>
        <p class="text-sm text-[var(--muted)]">{{ w.started_at?.slice(0, 16) }} · {{ Math.round(w.total_volume_kg) }} kg</p>
      </button>
    </div>
    <div v-else class="card p-4">
      <p>Volume: {{ Math.round((tab === 'weekly' ? reports.weekly?.total_volume : reports.monthly?.total_volume) || 0) }} kg</p>
      <p>Sets: {{ (tab === 'weekly' ? reports.weekly?.total_sets : reports.monthly?.total_sets) || 0 }}</p>
    </div>
    <div v-if="detail" class="fixed inset-0 z-30 bg-black/70 p-4" @click.self="selected = null">
      <div class="card mx-auto max-w-lg p-5">
        <h2 class="display text-3xl">{{ detail.name }}</h2>
        <p class="text-sm text-[var(--muted)]">{{ detail.sets.length }} sets · {{ Math.round(detail.total_volume_kg) }} kg</p>
        <ul class="mt-4 space-y-2 text-sm">
          <li v-for="s in detail.sets" :key="s.id">
            Set {{ s.set_number }} · {{ s.weight_kg }}kg x {{ s.reps }} @ {{ s.rpe }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
