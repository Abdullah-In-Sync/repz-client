<script setup lang="ts">
import type { Workout } from '~/types/api'

const props = defineProps<{ workout: Workout }>()

function formatWorkoutDateTime(iso: string | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function sessionDurationSeconds(w: Workout): number | null {
  if (w.duration_seconds != null && w.duration_seconds > 0) return w.duration_seconds
  if (w.started_at && w.ended_at) {
    const sec = Math.floor(
      (new Date(w.ended_at).getTime() - new Date(w.started_at).getTime()) / 1000,
    )
    return sec > 0 ? sec : null
  }
  return null
}

function formatSessionDuration(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}:${String(s).padStart(2, '0')}`
}

const dateLabel = computed(() => formatWorkoutDateTime(props.workout.started_at))
const durationLabel = computed(() => formatSessionDuration(sessionDurationSeconds(props.workout)))
const volumeLabel = computed(() => `${Math.round(props.workout.total_volume_kg)} kg`)
</script>

<template>
  <div class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[var(--muted)]">
    <span class="inline-flex items-center gap-1.5">
      <Icon name="lucide:calendar-clock" class="size-3.5 shrink-0 text-[var(--accent)]/80" aria-hidden="true" />
      <span>{{ dateLabel }}</span>
    </span>
    <span class="inline-flex items-center gap-1.5">
      <Icon name="lucide:timer" class="size-3.5 shrink-0 text-[var(--accent)]/80" aria-hidden="true" />
      <span>{{ durationLabel }}</span>
    </span>
    <span class="inline-flex items-center gap-1.5">
      <Icon name="lucide:dumbbell" class="size-3.5 shrink-0 text-[var(--accent)]/80" aria-hidden="true" />
      <span>{{ volumeLabel }}</span>
    </span>
  </div>
</template>
