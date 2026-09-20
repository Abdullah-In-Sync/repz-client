import type { Exercise, ExerciseFilters, Paginated } from '~/types/api'

export const useExerciseStore = defineStore('exercises', {
  state: () => ({
    items: [] as Exercise[],
    total: 0,
    filters: { body_parts: [], targets: [], equipment: [] } as ExerciseFilters,
    query: {
      search: '',
      bodyPart: '',
      target: '',
      equipment: '',
      offset: 0,
      limit: 40,
    },
    loading: false,
  }),
  actions: {
    async loadFilters() {
      const api = useApi()
      this.filters = await api.get<ExerciseFilters>('/exercises/filters')
    },
    async load() {
      this.loading = true
      const api = useApi()
      const data = await api.get<Paginated<Exercise>>('/exercises', {
        search: this.query.search || undefined,
        bodyPart: this.query.bodyPart || undefined,
        target: this.query.target || undefined,
        equipment: this.query.equipment || undefined,
        limit: this.query.limit,
        offset: this.query.offset,
      })
      this.items = data.items
      this.total = data.total
      this.loading = false
    },
    async getOne(id: string) {
      const api = useApi()
      return api.get<Exercise>(`/exercises/${id}`)
    },
    async createCustom(payload: Partial<Exercise> & { name: string }) {
      const api = useApi()
      return api.post<Exercise>('/exercises/custom', payload)
    },
  },
})
