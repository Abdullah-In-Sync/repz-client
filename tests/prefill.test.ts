import { describe, expect, it } from 'vitest'
import type { LastLoggedSet } from '../app/types/api'

function prefill(exerciseId: string, lastLogged: LastLoggedSet[]) {
  const last = lastLogged.find((l) => l.exercise_id === exerciseId)
  return {
    weight_kg: last?.weight_kg ?? null,
    reps: last?.reps ?? null,
    rpe: last?.rpe ?? null,
  }
}

describe('last-logged prefill', () => {
  it('copies the most recent values for an exercise', () => {
    const rows: LastLoggedSet[] = [
      {
        exercise_id: 'a',
        exercise_name: 'Bench',
        weight_kg: 80,
        reps: 5,
        rpe: 8,
        duration_seconds: null,
        distance_km: null,
        logged_at: '2026-01-01',
      },
    ]
    expect(prefill('a', rows)).toEqual({ weight_kg: 80, reps: 5, rpe: 8 })
    expect(prefill('missing', rows)).toEqual({ weight_kg: null, reps: null, rpe: null })
  })
})
