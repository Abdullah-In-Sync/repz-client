<script setup lang="ts">
import type { Workout } from '~/types/api'
import {
  formatSessionDuration,
  formatWorkoutDateTime,
  sessionDurationSeconds,
} from '~/utils/workoutSessionDisplay'

const props = defineProps<{ workout: Workout }>()

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
