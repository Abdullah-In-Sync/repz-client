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
      const body = {
        name: this.draft.name,
        description: this.draft.description || null,
        folder: this.draft.folder || null,
        exercises: this.draft.exercises.map((e, i) => {
          const firstSet = e.set_targets?.[0]
          return {
            exercise_id: e.exercise_id,
            order_index: i,
            target_sets: e.set_targets?.length || e.target_sets,
            target_reps_range: firstSet?.reps_range ?? e.target_reps_range,
            target_duration_seconds: e.target_duration_seconds,
            target_distance_km: e.target_distance_km,
            target_weight_kg: firstSet?.weight_kg ?? e.target_weight_kg,
            rest_seconds: firstSet?.rest_seconds ?? e.rest_seconds,
            notes: e.notes,
            set_targets: e.set_targets,
          }
        }),
      }
      if (this.draft.id) {
        await api.patch(`/routines/${this.draft.id}`, body)
      } else {
        await api.post('/routines', body)
      }
      await this.load()
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
