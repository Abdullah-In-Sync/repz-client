import type { DraftSet } from '~/types/api'

const KEY = 'repz-offline-sets'

export interface QueuedSet {
  workoutId: string
  payload: Omit<DraftSet, 'localId' | 'serverId' | 'exercise_name' | 'is_time_based' | 'is_distance_based'>
}

export const useOfflineQueue = () => {
  function read(): QueuedSet[] {
    if (!import.meta.client) return []
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]') as QueuedSet[]
    } catch {
      return []
    }
  }

  function write(items: QueuedSet[]) {
    localStorage.setItem(KEY, JSON.stringify(items))
  }

  function enqueue(item: QueuedSet) {
    write([...read(), item])
  }

  async function flush() {
    const api = useApi()
    const items = read()
    const leftover: QueuedSet[] = []
    for (const item of items) {
      try {
        await api.post(`/workouts/${item.workoutId}/sets`, item.payload)
      } catch {
        leftover.push(item)
      }
    }
    write(leftover)
  }

  return { read, enqueue, flush }
}
