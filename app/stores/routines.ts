import type { LastLoggedSet, Routine, RoutineExercise } from '~/types/api'

export const useRoutineStore = defineStore('routines', {
  state: () => ({
    items: [] as Routine[],
    draft: null as null | {
      id?: string
      name: string
      description: string
      folder: string
      exercises: RoutineExercise[]
    },
  }),
  actions: {
    async load() {
      const api = useApi()
      this.items = await api.get<Routine[]>('/routines')
    },
    async getOne(id: string) {
      const api = useApi()
      return api.get<Routine>(`/routines/${id}`)
    },
    startDraft(routine?: Routine) {
      this.draft = routine
        ? {
            id: routine.id,
            name: routine.name,
            description: routine.description || '',
            folder: routine.folder || '',
            exercises: [...routine.exercises],
          }
        : { name: '', description: '', folder: '', exercises: [] }
    },
    async saveDraft() {
      if (!this.draft) return
      const api = useApi()
      const name = this.draft.name.trim()
      if (!name) return

      const exercises = this.draft.exercises.map((e, i) => {
        const setTargets = e.set_targets?.length
          ? e.set_targets.map((set) => ({
              reps_range: set.reps_range ?? null,
              weight_kg: set.weight_kg ?? null,
              rest_seconds: set.rest_seconds ?? null,
            }))
          : null
        const firstSet = setTargets?.[0]
        const targetSets = Math.max(1, setTargets?.length || e.target_sets || 1)

        return {
          exercise_id: e.exercise_id,
          order_index: i,
          target_sets: targetSets,
          target_reps_range: firstSet?.reps_range ?? e.target_reps_range,
          target_duration_seconds: e.target_duration_seconds,
          target_distance_km: e.target_distance_km,
          target_weight_kg: firstSet?.weight_kg ?? e.target_weight_kg,
          rest_seconds: firstSet?.rest_seconds ?? e.rest_seconds,
          notes: e.notes,
          set_targets: setTargets,
        }
      })

      const body = {
        name,
        description: this.draft.description || null,
        folder: this.draft.folder || null,
        exercises,
      }

      if (this.draft.id) {
        await api.patch(`/routines/${this.draft.id}`, body)
      } else {
        const created = await api.post<Routine>('/routines', body)
        this.draft.id = created.id
      }
      try {
        await this.load()
      } catch {
        /* routine saved; list refresh can fail independently */
      }
    },
    async remove(id: string) {
      const api = useApi()
      await api.del(`/routines/${id}`)
      await this.load()
    },
    async lastLogged(id: string) {
      const api = useApi()
      return api.get<LastLoggedSet[]>(`/routines/${id}/last-logged`)
    },
  },
})
