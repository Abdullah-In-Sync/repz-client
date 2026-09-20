export type UnitPreference = 'kg' | 'lb'
export type Gender = 'male' | 'female' | 'other' | 'unspecified'

export interface User {
  id: string
  firebase_uid: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  unit_preference: UnitPreference
  timezone: string
  height_cm: number | null
  date_of_birth: string | null
  gender: Gender | null
  created_at: string
  updated_at: string
}

export interface Paginated<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface Exercise {
  id: string
  source: 'workoutx' | 'custom'
  external_id: string | null
  name: string
  body_part: string | null
  target: string | null
  equipment: string | null
  secondary_muscles: string[] | null
  instructions: string[] | null
  gif_url: string | null
  category: string | null
  difficulty: string | null
  mechanic: string | null
  force: string | null
  met: number | null
  calories_per_minute: number | null
  is_unilateral: boolean
  recommended_sets: string | null
  recommended_reps: string | null
  movement_tags: string[] | null
  created_by_user_id: string | null
  is_time_based: boolean
  is_distance_based: boolean
  description: string | null
  created_at: string
  updated_at: string
}

export interface ExerciseFilters {
  body_parts: string[]
  targets: string[]
  equipment: string[]
}

export interface RoutineExercise {
  id?: string
  exercise_id: string
  order_index: number
  target_sets: number | null
  target_reps_range: string | null
  rest_seconds: number | null
  notes: string | null
  exercise_name?: string | null
}

export interface Routine {
  id: string
  user_id: string
  name: string
  description: string | null
  folder: string | null
  created_at: string
  updated_at: string
  last_used_at: string | null
  exercises: RoutineExercise[]
}

export interface LastLoggedSet {
  exercise_id: string
  exercise_name: string
  weight_kg: number | null
  reps: number | null
  rpe: number | null
  duration_seconds: number | null
  distance_km: number | null
  logged_at: string | null
}

export interface WorkoutSet {
  id: string
  workout_session_id: string
  exercise_id: string
  set_number: number
  weight_kg: number | null
  reps: number | null
  rpe: number | null
  duration_seconds: number | null
  distance_km: number | null
  is_warmup: boolean
  is_completed: boolean
  created_at: string
}

export interface Workout {
  id: string
  user_id: string
  routine_id: string | null
  name: string | null
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  notes: string | null
  body_weight_kg: number | null
  total_volume_kg: number
  created_at: string
  sets: WorkoutSet[]
}

export interface BodyMetric {
  id: string
  user_id: string
  date: string
  weight_kg: number
  body_fat_pct: number | null
  notes: string | null
  created_at: string
}

export interface GraphPoint {
  date: string
  value: number
}

export interface DailyReport {
  date: string
  total_volume: number
  total_sets: number
  duration_seconds: number
  calories_est: number
  workout_count: number
}

export interface RangeReport {
  start: string
  end: string
  total_volume: number
  total_sets: number
  duration_seconds: number
  calories_est: number
  workout_days: number
  daily: DailyReport[]
}

export interface CalendarDay {
  date: string
  has_workout: boolean
  total_volume: number
}

export interface VolumePoint {
  date: string
  volume: number
}

export interface MuscleShare {
  body_part: string
  volume: number
  percent: number
}

export interface Achievement {
  id: string
  type: string
  metadata: Record<string, unknown> | null
  unlocked_at: string
}

export interface PersonalRecord {
  id: string
  exercise_id: string
  exercise_name: string | null
  record_type: string
  value: number
  achieved_at: string
}

export interface DraftSet {
  localId: string
  serverId?: string
  exercise_id: string
  exercise_name: string
  is_time_based: boolean
  is_distance_based: boolean
  set_number: number
  weight_kg: number | null
  reps: number | null
  rpe: number | null
  duration_seconds: number | null
  distance_km: number | null
  is_warmup: boolean
  is_completed: boolean
}
