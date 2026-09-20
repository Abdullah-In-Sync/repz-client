import type { DraftSet, Exercise, LastLoggedSet, Workout } from '~/types/api'

export const useWorkoutStore = defineStore('workout', {
  state: () => ({
    session: null as Workout | null,
    blocks: [] as {
      exercise_id: string
      exercise_name: string
      is_time_based: boolean
      is_distance_based: boolean
      rest_seconds: number
      sets: DraftSet[]
    }[],
    startedAt: 0,
  }),
  persist: {
    pick: ['session', 'blocks', 'startedAt'],
  },
  getters: {
    volumeKg: (s) =>
      s.blocks
        .flatMap((b) => b.sets)
        .filter((set) => set.is_completed && !set.is_warmup)
        .reduce((sum, set) => sum + (set.weight_kg || 0) * (set.reps || 0), 0),
  },
  actions: {
    async start(opts: { name?: string; routineId?: string; lastLogged?: LastLoggedSet[]; exercises?: Exercise[] }) {
      const api = useApi()
      this.session = await api.post<Workout>('/workouts', {
        name: opts.name,
        routine_id: opts.routineId,
      })
      this.startedAt = Date.now()
      this.blocks = (opts.exercises || []).map((ex) => {
        const last = opts.lastLogged?.find((l) => l.exercise_id === ex.id)
        return {
          exercise_id: ex.id,
          exercise_name: ex.name,
          is_time_based: ex.is_time_based,
          is_distance_based: ex.is_distance_based,
          rest_seconds: 90,
          sets: [
            {
              localId: crypto.randomUUID(),
              exercise_id: ex.id,
              exercise_name: ex.name,
              is_time_based: ex.is_time_based,
              is_distance_based: ex.is_distance_based,
              set_number: 1,
              weight_kg: last?.weight_kg ?? null,
              reps: last?.reps ?? null,
              rpe: last?.rpe ?? null,
              duration_seconds: last?.duration_seconds ?? null,
              distance_km: last?.distance_km ?? null,
              is_warmup: false,
              is_completed: false,
            },
          ],
        }
      })
    },
    addSet(exerciseId: string) {
      const block = this.blocks.find((b) => b.exercise_id === exerciseId)
      if (!block) return
      const prev = block.sets[block.sets.length - 1]
      block.sets.push({
        localId: crypto.randomUUID(),
        exercise_id: exerciseId,
        exercise_name: block.exercise_name,
        is_time_based: block.is_time_based,
        is_distance_based: block.is_distance_based,
        set_number: block.sets.length + 1,
        weight_kg: prev?.weight_kg ?? null,
        reps: prev?.reps ?? null,
        rpe: prev?.rpe ?? null,
        duration_seconds: prev?.duration_seconds ?? null,
        distance_km: prev?.distance_km ?? null,
        is_warmup: false,
        is_completed: false,
      })
    },
    async completeSet(localId: string) {
      const api = useApi()
      const queue = useOfflineQueue()
      const rest = useRestTimer()
      if (!this.session) return
      for (const block of this.blocks) {
        const set = block.sets.find((s) => s.localId === localId)
        if (!set) continue
        set.is_completed = true
        const payload = {
          exercise_id: set.exercise_id,
          set_number: set.set_number,
          weight_kg: set.weight_kg,
          reps: set.reps,
          rpe: set.rpe,
          duration_seconds: set.duration_seconds,
          distance_km: set.distance_km,
          is_warmup: set.is_warmup,
          is_completed: true,
        }
        if (!navigator.onLine) {
          queue.enqueue({ workoutId: this.session.id, payload })
        } else {
          try {
            const saved = await api.post<{ id: string }>(`/workouts/${this.session.id}/sets`, payload)
            set.serverId = saved.id
          } catch {
            queue.enqueue({ workoutId: this.session.id, payload })
          }
        }
        rest.start(block.rest_seconds || 90)
      }
    },
    async deleteSet(localId: string) {
      const api = useApi()
      if (!this.session) return
      for (const block of this.blocks) {
        const idx = block.sets.findIndex((s) => s.localId === localId)
        if (idx < 0) continue
        const set = block.sets[idx]
        if (set?.serverId) {
          await api.del(`/workouts/${this.session.id}/sets/${set.serverId}`)
        }
        block.sets.splice(idx, 1)
      }
    },
    async finish() {
      const api = useApi()
      if (!this.session) return
      await useOfflineQueue().flush()
      await api.patch(`/workouts/${this.session.id}`, { finish: true })
      this.session = null
      this.blocks = []
      this.startedAt = 0
    },
    clear() {
      this.session = null
      this.blocks = []
      this.startedAt = 0
    },
  },
})
