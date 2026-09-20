import type {
  Achievement,
  BodyMetric,
  CalendarDay,
  MuscleShare,
  Paginated,
  PersonalRecord,
  RangeReport,
  VolumePoint,
  Workout,
} from '~/types/api'

export const useReportStore = defineStore('reports', {
  state: () => ({
    weekly: null as RangeReport | null,
    monthly: null as RangeReport | null,
    volume: [] as VolumePoint[],
    muscle: [] as MuscleShare[],
    calendar: [] as CalendarDay[],
    achievements: [] as Achievement[],
    prs: [] as PersonalRecord[],
    bodyGraph: [] as { date: string; value: number }[],
    workouts: [] as Workout[],
    workoutTotal: 0,
  }),
  actions: {
    isoWeek(d = new Date()) {
      const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
      const day = date.getUTCDay() || 7
      date.setUTCDate(date.getUTCDate() + 4 - day)
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
      const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
      return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
    },
    async loadDashboard() {
      const api = useApi()
      const now = new Date()
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const [weekly, monthly, volume, muscle, calendar, achievements, prs, body] = await Promise.all([
        api.get<RangeReport>('/reports/weekly', { week: this.isoWeek() }),
        api.get<RangeReport>('/reports/monthly', { month }),
        api.get<VolumePoint[]>('/reports/volume-graph', { range: '30d' }),
        api.get<MuscleShare[]>('/reports/muscle-distribution', { range: '30d' }),
        api.get<CalendarDay[]>('/reports/calendar', { month }),
        api.get<Achievement[]>('/reports/achievements'),
        api.get<PersonalRecord[]>('/reports/personal-records'),
        api.get<{ date: string; value: number }[]>('/body-metrics/graph', { range: '90d' }),
      ])
      this.weekly = weekly
      this.monthly = monthly
      this.volume = volume
      this.muscle = muscle
      this.calendar = calendar
      this.achievements = achievements
      this.prs = prs
      this.bodyGraph = body
    },
    async loadHistory(offset = 0) {
      const api = useApi()
      const data = await api.get<Paginated<Workout>>('/workouts', { limit: 20, offset })
      this.workouts = data.items
      this.workoutTotal = data.total
    },
    async loadBody() {
      const api = useApi()
      const data = await api.get<Paginated<BodyMetric>>('/body-metrics', { limit: 30, offset: 0 })
      this.bodyGraph = await api.get('/body-metrics/graph', { range: '90d' })
      return data.items
    },
  },
})
