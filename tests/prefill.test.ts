import { describe, expect, it } from 'vitest'
import type { LastLoggedSet, RoutineExercise } from '../app/types/api'
import {
  hasRoutineWorkoutHistory,
  lastLoggedForSet,
  parseRepsFromRange,
  prefillSetFields,
} from '../app/utils/workoutPrefill'

describe('parseRepsFromRange', () => {
  it('parses single values and ranges', () => {
    expect(parseRepsFromRange('8')).toBe(8)
    expect(parseRepsFromRange('8-12')).toBe(10)
    expect(parseRepsFromRange(null)).toBeNull()
  })
})

describe('last-logged prefill', () => {
  const plan: RoutineExercise = {
    exercise_id: 'a',
    order_index: 0,
    target_sets: 2,
    target_reps_range: '8-12',
    target_duration_seconds: null,
    target_distance_km: null,
    target_weight_kg: 60,
    rest_seconds: 90,
    notes: null,
    set_targets: [
      { reps_range: '5', weight_kg: 80, rest_seconds: 120 },
      { reps_range: '8-12', weight_kg: 70, rest_seconds: 90 },
    ],
  }

  it('uses routine targets when there is no finished routine history', () => {
    expect(hasRoutineWorkoutHistory([])).toBe(false)
    const first = prefillSetFields({
      exerciseId: 'a',
      setNumber: 1,
      plan,
      setTarget: plan.set_targets![0],
      lastLogged: [],
      isTimeBased: false,
      isDistanceBased: false,
      defaultDurationSeconds: null,
    })
    expect(first).toEqual({ weight_kg: 80, reps: 5, rpe: null, duration_seconds: null, distance_km: null })
  })

  it('uses per-set history from the last routine workout', () => {
    const rows: LastLoggedSet[] = [
      {
        exercise_id: 'a',
        exercise_name: 'Bench',
        set_number: 1,
        weight_kg: 82.5,
        reps: 5,
        rpe: 8,
        duration_seconds: null,
        distance_km: null,
        logged_at: '2026-01-01',
      },
      {
        exercise_id: 'a',
        exercise_name: 'Bench',
        set_number: 2,
        weight_kg: 77.5,
        reps: 10,
        rpe: 9,
        duration_seconds: null,
        distance_km: null,
        logged_at: '2026-01-01',
      },
    ]
    expect(hasRoutineWorkoutHistory(rows)).toBe(true)
    expect(lastLoggedForSet(rows, 'a', 2)?.weight_kg).toBe(77.5)
    const second = prefillSetFields({
      exerciseId: 'a',
      setNumber: 2,
      plan,
      setTarget: plan.set_targets![1],
      lastLogged: rows,
      isTimeBased: false,
      isDistanceBased: false,
      defaultDurationSeconds: null,
    })
    expect(second).toEqual({
      weight_kg: 77.5,
      reps: 10,
      rpe: 9,
      duration_seconds: null,
      distance_km: null,
    })
  })
})
