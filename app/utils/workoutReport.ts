import type { Exercise, Workout, WorkoutSet } from '~/types/api'
import {
  formatSessionDuration,
  formatWorkoutDateTime,
  sessionDurationSeconds,
} from '~/utils/workoutSessionDisplay'
import { formatPreviousPerformance } from '~/utils/workoutPrefill'

export type ExerciseGroup = {
  exerciseId: string
  sets: WorkoutSet[]
}

export function groupSetsByExercise(sets: WorkoutSet[]): ExerciseGroup[] {
  const order: string[] = []
  const map = new Map<string, WorkoutSet[]>()
  for (const set of sets) {
    if (!map.has(set.exercise_id)) {
      order.push(set.exercise_id)
      map.set(set.exercise_id, [])
    }
    map.get(set.exercise_id)!.push(set)
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.set_number - b.set_number)
  }
  return order.map((exerciseId) => ({ exerciseId, sets: map.get(exerciseId)! }))
}

function exerciseFlags(exercise: Exercise | undefined) {
  return {
    is_load_based: exercise?.is_load_based ?? true,
    is_reps_based: exercise?.is_reps_based ?? true,
    is_time_based: exercise?.is_time_based ?? false,
    is_distance_based: exercise?.is_distance_based ?? false,
  }
}

export function formatLoggedSetLine(
  set: WorkoutSet,
  exercise: Exercise | undefined,
  formatWeight: (kg: number | null | undefined) => string,
): string {
  const flags = exerciseFlags(exercise)
  const performance = formatPreviousPerformance({
    weight_kg: set.weight_kg,
    reps: set.reps,
    duration_seconds: set.duration_seconds,
    distance_km: set.distance_km,
    formatWeight,
    ...flags,
  })
  const parts: string[] = [`Set ${set.set_number}`, performance]
  if (set.rpe != null) parts.push(`RPE ${set.rpe}`)
  if (set.is_warmup) parts.push('warmup')
  return parts.join(' · ')
}

export function buildWorkoutReportText(
  workout: Workout,
  exerciseById: Record<string, Exercise | undefined>,
  formatWeight: (kg: number | null | undefined) => string,
  exerciseNames: Record<string, string> = {},
): string {
  const lines: string[] = []
  lines.push(workout.name?.trim() || 'Workout')
  lines.push(
    `${formatWorkoutDateTime(workout.started_at)} · ${formatSessionDuration(sessionDurationSeconds(workout))} · ${Math.round(workout.total_volume_kg)} kg`,
  )
  if (workout.notes?.trim()) {
    lines.push('')
    lines.push(workout.notes.trim())
  }
  for (const group of groupSetsByExercise(workout.sets)) {
    const exercise = exerciseById[group.exerciseId]
    lines.push('')
    lines.push(exerciseNames[group.exerciseId] || exercise?.name || 'Exercise')
    for (const set of group.sets) {
      lines.push(`  ${formatLoggedSetLine(set, exercise, formatWeight)}`)
    }
  }
  return lines.join('\n').trim()
}
