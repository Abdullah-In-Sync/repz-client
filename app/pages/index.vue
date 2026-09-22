<script setup lang="ts">
const reports = useReportStore()
const units = useUnits()
const ready = ref(false)

onMounted(async () => {
  await reports.loadDashboard().catch(() => {})
  ready.value = true
})

const volumeValues = computed(() => reports.volume.map((p) => p.volume || 0))
const bodyValues = computed(() => reports.bodyGraph.map((p) => units.toDisplay(p.value) || 0))
const hasVolume = computed(() => volumeValues.value.some((v) => v > 0))
const muscleMax = computed(() => Math.max(...reports.muscle.map((m) => m.volume || 0), 1))
</script>

<template>
  <div class="grid gap-6 pb-8">
    <div>
      <h1 class="display text-4xl">Dashboard</h1>
      <p class="text-[var(--muted)]">This week’s work, visualized.</p>
    </div>
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <DashboardStatCard title="Week volume" :value="`${Math.round(reports.weekly?.total_volume || 0)} kg`" />
      <DashboardStatCard title="Workouts / month" :value="String(reports.monthly?.workout_days || 0)" />
      <DashboardStatCard title="Sets this week" :value="String(reports.weekly?.total_sets || 0)" />
      <DashboardStatCard title="PRs" :value="String(reports.prs.length)" hint="All-time" />
    </div>
    <section class="card p-4">
      <h2 class="mb-3 font-semibold">Volume (30d)</h2>
      <p v-if="!ready" class="text-sm text-[var(--muted)]">Loading…</p>
      <p v-else-if="!hasVolume" class="text-sm text-[var(--muted)]">No volume logged yet.</p>
      <AppSparkline v-else :values="volumeValues" />
    </section>
    <section class="card p-4">
      <h2 class="mb-3 font-semibold">Body weight ({{ units.label }})</h2>
      <p v-if="!ready" class="text-sm text-[var(--muted)]">Loading…</p>
      <p v-else-if="!bodyValues.length" class="text-sm text-[var(--muted)]">No body-weight entries yet.</p>
      <AppSparkline v-else :values="bodyValues" color="var(--accent-2)" />
    </section>
    <div class="grid gap-4 lg:grid-cols-2">
      <section class="card p-4">
        <h2 class="mb-3 font-semibold">Muscle distribution</h2>
        <p v-if="!ready" class="text-sm text-[var(--muted)]">Loading…</p>
        <p v-else-if="!reports.muscle.length" class="text-sm text-[var(--muted)]">No muscle data yet.</p>
        <ul v-else class="grid gap-2">
          <li v-for="m in reports.muscle" :key="m.body_part">
            <div class="mb-1 flex justify-between text-sm">
              <span>{{ m.body_part }}</span>
              <span class="text-[var(--muted)]">{{ Math.round(m.percent || 0) }}%</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div
                class="h-full rounded-full bg-[var(--accent)]"
                :style="{ width: `${Math.min(100, (m.volume / muscleMax) * 100)}%` }"
              />
            </div>
          </li>
        </ul>
      </section>
      <section class="card p-4">
        <h2 class="mb-3 font-semibold">Calendar</h2>
        <CalendarHeatmap :days="reports.calendar" @select="navigateTo(`/history?date=${$event}`)" />
      </section>
    </div>
    <section>
      <h2 class="mb-3 font-semibold">Achievements & PRs</h2>
      <div class="flex gap-3 overflow-x-auto pb-2">
        <article v-for="pr in reports.prs.slice(0, 8)" :key="pr.id" class="card min-w-[180px] p-4">
          <p class="text-xs text-[var(--accent)]">{{ pr.record_type }}</p>
          <p class="font-semibold">{{ pr.exercise_name }}</p>
          <p class="display text-2xl tabular">{{ pr.value }}</p>
        </article>
        <article v-for="a in reports.achievements" :key="a.id" class="card min-w-[180px] p-4">
          <p class="text-xs text-[var(--success)]">Unlocked</p>
          <p class="font-semibold">{{ a.type }}</p>
        </article>
      </div>
    </section>
  </div>
</template>
