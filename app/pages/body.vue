<script setup lang="ts">
import type { BodyMetric } from '~/types/api'

const reports = useReportStore()
const units = useUnits()
const items = ref<BodyMetric[]>([])
const weight = ref<number | null>(null)
const date = ref(new Date().toISOString().slice(0, 10))

onMounted(async () => {
  items.value = await reports.loadBody()
})

const options = computed(() => ({
  chart: { background: 'transparent', toolbar: { show: false } },
  theme: { mode: 'dark' },
  stroke: { colors: ['#7DD3FC'], curve: 'smooth' },
  dataLabels: { enabled: false },
  xaxis: { categories: reports.bodyGraph.map((p) => p.date.slice(5)) },
  colors: ['#7DD3FC'],
}))

async function save() {
  const api = useApi()
  await api.post('/body-metrics', {
    date: date.value,
    weight_kg: units.toKg(weight.value),
  })
  items.value = await reports.loadBody()
  weight.value = null
}
</script>

<template>
  <div class="grid gap-4 pb-10">
    <h1 class="display text-4xl">Body</h1>
    <section class="card p-4">
      <ClientOnly>
        <ApexChart type="line" height="220" :options="options" :series="[{ name: 'Weight', data: reports.bodyGraph.map((p) => units.toDisplay(p.value) || 0) }]" />
      </ClientOnly>
    </section>
    <form class="card grid gap-3 p-4" @submit.prevent="save">
      <input v-model="date" class="input" type="date" />
      <input v-model.number="weight" class="input" type="number" step="0.1" :placeholder="`Weight (${units.label})`" />
      <button class="btn-primary">Log weight</button>
    </form>
    <ul class="grid gap-2">
      <li v-for="m in items" :key="m.id" class="card p-3 text-sm">
        {{ m.date }} · {{ units.toDisplay(m.weight_kg) }} {{ units.label }}
      </li>
    </ul>
  </div>
</template>
