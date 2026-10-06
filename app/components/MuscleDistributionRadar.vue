<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import { RADAR_CATEGORIES, muscleSharesToRadarValues } from '~/utils/muscleRadar'
import type { MuscleShare } from '~/types/api'

const props = defineProps<{
  current: MuscleShare[]
  previous: MuscleShare[]
}>()

const currentValues = computed(() => muscleSharesToRadarValues(props.current))
const previousValues = computed(() => muscleSharesToRadarValues(props.previous))

const series = computed(() => [
  { name: 'Previous', data: previousValues.value },
  { name: 'Current', data: currentValues.value },
])

const chartOptions = computed<ApexOptions>(() => ({
  chart: {
    type: 'radar',
    toolbar: { show: false },
    background: 'transparent',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  theme: { mode: 'dark' },
  colors: ['#6b7280', '#7dd3fc'],
  stroke: { width: 2 },
  fill: { opacity: 0.22 },
  markers: { size: 3, strokeWidth: 0 },
  xaxis: {
    categories: [...RADAR_CATEGORIES],
    labels: {
      style: { colors: Array(RADAR_CATEGORIES.length).fill('#9b9ba1'), fontSize: '12px' },
    },
  },
  yaxis: {
    show: false,
    min: 0,
    max: Math.max(100, ...currentValues.value, ...previousValues.value, 1),
  },
  plotOptions: {
    radar: {
      polygons: {
        strokeColors: 'rgba(255,255,255,0.08)',
        connectorColors: 'rgba(255,255,255,0.08)',
        fill: { colors: ['transparent'] },
      },
    },
  },
  legend: { show: false },
  tooltip: {
    theme: 'dark',
    y: { formatter: (val: number) => `${val}%` },
  },
}))
</script>

<template>
  <ClientOnly>
    <VueApexChart type="radar" height="320" :options="chartOptions" :series="series" />
    <template #fallback>
      <div class="flex h-[320px] items-center justify-center text-sm text-[var(--muted)]">
        Loading chart…
      </div>
    </template>
  </ClientOnly>
</template>
