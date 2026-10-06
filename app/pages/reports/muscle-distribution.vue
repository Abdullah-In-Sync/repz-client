<script setup lang="ts">
import type { MuscleDistributionDetail, ReportRange } from '~/types/api'
import {
  REPORT_RANGE_LABELS,
  formatCompactKg,
  formatDurationHoursMinutes,
  formatPeriodDelta,
} from '~/utils/reportFormat'

const api = useApi()
const ui = useUiStore()
const router = useRouter()

const ranges: ReportRange[] = ['7d', '30d', '90d', '1y']
const selectedRange = ref<ReportRange>('30d')
const loading = ref(true)
const detail = ref<MuscleDistributionDetail | null>(null)

async function load() {
  loading.value = true
  try {
    detail.value = await api.get<MuscleDistributionDetail>(
      '/reports/muscle-distribution/detail',
      { range: selectedRange.value },
    )
  } catch {
    detail.value = null
  } finally {
    loading.value = false
  }
}

watch(selectedRange, () => load())
onMounted(() => load())

const statCards = computed(() => {
  if (!detail.value) return []
  const cur = detail.value.current_summary
  const prev = detail.value.previous_summary
  return [
    {
      title: 'Workouts',
      value: String(cur.workout_days),
      delta: formatPeriodDelta(cur.workout_days, prev.workout_days, (n) => String(n)),
    },
    {
      title: 'Duration',
      value: formatDurationHoursMinutes(cur.duration_seconds),
      delta: formatPeriodDelta(cur.duration_seconds, prev.duration_seconds, (n) =>
        formatDurationHoursMinutes(n),
      ),
    },
    {
      title: 'Volume',
      value: formatCompactKg(cur.total_volume),
      delta: formatPeriodDelta(cur.total_volume, prev.total_volume, (n) => formatCompactKg(n)),
    },
    {
      title: 'Sets',
      value: String(cur.total_sets),
      delta: formatPeriodDelta(cur.total_sets, prev.total_sets, (n) => String(n)),
    },
  ]
})

function showHelp() {
  ui.pushToast(
    'Radar shows training volume share by muscle group. Gray is the prior period; blue is the selected range.',
  )
}

async function shareReport() {
  if (!detail.value || !navigator.share) {
    ui.pushToast('Sharing is not available on this device.')
    return
  }
  const s = detail.value.current_summary
  try {
    await navigator.share({
      title: 'Muscle distribution',
      text: `${REPORT_RANGE_LABELS[selectedRange.value]}: ${s.workout_days} workouts, ${formatCompactKg(s.total_volume)} volume, ${s.total_sets} sets.`,
    })
  } catch {
    /* user dismissed share sheet */
  }
}
</script>

<template>
  <div class="mx-auto grid max-w-lg gap-5 pb-10">
    <header class="flex items-center gap-2">
      <button
        type="button"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-lg"
        aria-label="Back"
        @click="router.back()"
      >
        ←
      </button>
      <h1 class="display min-w-0 flex-1 truncate text-xl">Muscle distribution</h1>
      <button
        type="button"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-sm font-semibold"
        aria-label="Help"
        @click="showHelp"
      >
        ?
      </button>
      <button
        type="button"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-lg"
        aria-label="Share"
        @click="shareReport"
      >
        ↗
      </button>
    </header>

    <label class="block">
      <span class="sr-only">Time range</span>
      <select v-model="selectedRange" class="input w-full appearance-none py-3">
        <option v-for="r in ranges" :key="r" :value="r">{{ REPORT_RANGE_LABELS[r] }}</option>
      </select>
    </label>

    <section class="card min-w-0 p-4">
      <p v-if="loading" class="py-16 text-center text-sm text-[var(--muted)]">Loading…</p>
      <template v-else-if="detail">
        <MuscleDistributionRadar :current="detail.current" :previous="detail.previous" />
        <div class="mt-2 flex justify-center gap-6 text-xs text-[var(--muted)]">
          <span class="inline-flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-[#7dd3fc]" /> Current
          </span>
          <span class="inline-flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-[#6b7280]" /> Previous
          </span>
        </div>
      </template>
      <p v-else class="py-16 text-center text-sm text-[var(--muted)]">Could not load report.</p>
    </section>

    <div v-if="detail && !loading" class="grid grid-cols-2 gap-3">
      <article v-for="card in statCards" :key="card.title" class="card p-4">
        <p class="text-xs text-[var(--muted)]">{{ card.title }}</p>
        <p class="display mt-1 text-2xl tabular">{{ card.value }}</p>
        <p
          class="mt-1 text-xs tabular"
          :class="card.delta.improved ? 'text-[var(--success)]' : 'text-[var(--warn)]'"
        >
          {{ card.delta.arrow }} {{ card.delta.text }}
        </p>
      </article>
    </div>
  </div>
</template>
