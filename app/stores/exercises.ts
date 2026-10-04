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
    error: '' as string,
  }),
  actions: {
    async loadFilters() {
      const api = useApi()
      this.filters = await api.get<ExerciseFilters>('/exercises/filters')
    },
    async load() {
      this.loading = true
      this.error = ''
      try {
        const api = useApi()
        const data = await api.get<Paginated<Exercise>>('/exercises', {
          search: this.query.search || undefined,
          bodyPart: this.query.bodyPart || undefined,
          target: this.query.target || undefined,
          equipment: this.query.equipment || undefined,
          limit: this.query.limit,
          offset: this.query.offset,
        })
        this.items = data?.items ?? []
        this.total = data?.total ?? 0
        if (!this.items.length && this.total === 0) {
          this.error = 'No exercises in the catalog yet.'
        }
      } catch (error: unknown) {
        this.items = []
        this.total = 0
        const err = error as { data?: { detail?: string } }
        this.error = err.data?.detail || 'Could not load exercises.'
      } finally {
        this.loading = false
      }
    },
    async getOne(id: string) {
      const api = useApi()
      return api.get<Exercise>(`/exercises/${id}`)
    },
    async createCustom(payload: Partial<Exercise> & { name: string }) {
      const api = useApi()
      return api.post<Exercise>('/exercises/custom', payload)
    },
    async update(id: string, payload: Partial<Exercise>) {
      const api = useApi()
      return api.patch<Exercise>(`/exercises/${id}`, payload)
    },
    async remove(id: string) {
      const api = useApi()
      await api.del(`/exercises/${id}`)
    },
    async uploadGif(id: string, file: File) {
      const config = useRuntimeConfig()
      const auth = useAuthStore()
      const user = auth.firebaseUser
      if (!user) throw new Error('Not signed in')
      const token = await user.getIdToken()
      const body = new FormData()
      body.append('file', file)
      return $fetch<Exercise>(`${config.public.apiBase}/api/v1/exercises/${id}/gif`, {
        method: 'POST',
        body,
        headers: { Authorization: `Bearer ${token}` },
      })
    },
  },
})
