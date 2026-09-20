<script setup lang="ts">
const reports = useReportStore()
const units = useUnits()
await reports.loadDashboard().catch(() => {})

const volumeOptions = computed(() => ({
  chart: { background: 'transparent', toolbar: { show: false } },
  theme: { mode: 'dark' },
  stroke: { curve: 'smooth', colors: ['#F5C518'] },
  dataLabels: { enabled: false },
  xaxis: { categories: reports.volume.map((p) => p.date.slice(5)) },
  colors: ['#F5C518'],
  grid: { borderColor: '#232326' },
}))
const bodyOptions = computed(() => ({
  chart: { background: 'transparent', toolbar: { show: false } },
  theme: { mode: 'dark' },
  stroke: { curve: 'smooth', colors: ['#7DD3FC'] },
  dataLabels: { enabled: false },
  xaxis: { categories: reports.bodyGraph.map((p) => p.date.slice(5)) },
  colors: ['#7DD3FC'],
  grid: { borderColor: '#232326' },
}))
const muscleOptions = computed(() => ({
  chart: { background: 'transparent' },
  labels: reports.muscle.map((m) => m.body_part),
  colors: ['#F5C518', '#7DD3FC', '#4ade80', '#fb7185', '#a78bfa', '#f97316'],
  legend: { labels: { colors: '#9B9BA1' } },
}))
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
      <ClientOnly>
        <ApexChart type="line" height="220" :options="volumeOptions" :series="[{ name: 'Volume', data: reports.volume.map((p) => p.volume) }]" />
      </ClientOnly>
    </section>
    <section class="card p-4">
      <h2 class="mb-3 font-semibold">Body weight ({{ units.label }})</h2>
      <ClientOnly>
        <ApexChart
          type="line"
          height="220"
          :options="bodyOptions"
          :series="[{ name: 'Weight', data: reports.bodyGraph.map((p) => units.toDisplay(p.value) || 0) }]"
        />
      </ClientOnly>
    </section>
    <div class="grid gap-4 lg:grid-cols-2">
      <section class="card p-4">
        <h2 class="mb-3 font-semibold">Muscle distribution</h2>
        <ClientOnly>
          <ApexChart type="donut" height="260" :options="muscleOptions" :series="reports.muscle.map((m) => m.volume || 0)" />
        </ClientOnly>
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
