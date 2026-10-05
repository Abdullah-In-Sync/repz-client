import type { LastLoggedSet, RoutineExercise, RoutineSetTarget } from '~/types/api'

/** Parse "8", "8-12", or "8–12" into a numeric rep target for prefilling. */
export function parseRepsFromRange(range: string | null | undefined): number | null {
  if (!range?.trim()) return null
  const normalized = range.replace(/–/g, '-')
  const parts = normalized
    .split('-')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n))
  if (!parts.length) return null
  if (parts.length === 1) return parts[0]!
  return Math.round((parts[0]! + parts[parts.length - 1]!) / 2)
}

export function hasRoutineWorkoutHistory(lastLogged: LastLoggedSet[] | undefined): boolean {
  return !!lastLogged?.some((row) => row.logged_at != null)
}

export function lastLoggedForSet(
  lastLogged: LastLoggedSet[] | undefined,
  exerciseId: string,
  setNumber: number,
): LastLoggedSet | undefined {
  if (!lastLogged?.length) return undefined
  const exact = lastLogged.find(
    (row) => row.exercise_id === exerciseId && (row.set_number ?? 1) === setNumber,
  )
  if (exact) return exact
  return lastLogged.find((row) => row.exercise_id === exerciseId && row.set_number == null)
}

export function formatPreviousPerformance(opts: {
  weight_kg: number | null | undefined
  reps: number | null | undefined
  duration_seconds: number | null | undefined
  distance_km: number | null | undefined
  is_load_based: boolean
  is_reps_based: boolean
  is_time_based: boolean
  is_distance_based: boolean
  formatWeight: (kg: number | null | undefined) => string
}): string {
  const {
    weight_kg,
    reps,
    duration_seconds,
    distance_km,
    is_load_based,
    is_reps_based,
    is_time_based,
    is_distance_based,
    formatWeight,
  } = opts
  const parts: string[] = []
  if (is_load_based && weight_kg != null) {
    const w = formatWeight(weight_kg)
    parts.push(is_reps_based && reps != null ? `${w} × ${reps}` : w)
  } else if (is_reps_based && reps != null) {
    parts.push(`${reps} reps`)
  }
  if (is_distance_based && distance_km != null) {
    parts.push(`${distance_km} km`)
  }
  if (is_time_based && duration_seconds != null) {
    const m = Math.floor(duration_seconds / 60)
    const s = duration_seconds % 60
    parts.push(`${m}:${String(s).padStart(2, '0')}`)
  }
  return parts.length ? parts.join(' · ') : '—'
}

export function prefillSetFields(opts: {
  exerciseId: string
  setNumber: number
  plan?: RoutineExercise
  setTarget?: RoutineSetTarget | null
  lastLogged?: LastLoggedSet[]
  isTimeBased: boolean
  isDistanceBased: boolean
  defaultDurationSeconds: number | null
}) {
  const {
    exerciseId,
    setNumber,
    plan,
    setTarget,
    lastLogged,
    isTimeBased,
    isDistanceBased,
    defaultDurationSeconds,
  } = opts
  const useHistory = hasRoutineWorkoutHistory(lastLogged)
  const last = useHistory ? lastLoggedForSet(lastLogged, exerciseId, setNumber) : undefined

  if (last) {
    return {
      weight_kg: last.weight_kg ?? null,
      reps: last.reps ?? null,
      rpe: last.rpe ?? null,
      duration_seconds: last.duration_seconds ?? null,
      distance_km: last.distance_km ?? null,
    }
  }

  const repsRange = setTarget?.reps_range ?? plan?.target_reps_range
  return {
    weight_kg: setTarget?.weight_kg ?? plan?.target_weight_kg ?? null,
    reps: parseRepsFromRange(repsRange),
    rpe: null as number | null,
    duration_seconds: isTimeBased ? (plan?.target_duration_seconds ?? defaultDurationSeconds) : null,
    distance_km: isDistanceBased ? (plan?.target_distance_km ?? null) : null,
  }
}
