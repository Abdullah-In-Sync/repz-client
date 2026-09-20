export const useRestTimer = () => {
  const remaining = useState('rest-remaining', () => 0)
  const total = useState('rest-total', () => 90)
  let handle: ReturnType<typeof setInterval> | null = null

  function stop() {
    if (handle) clearInterval(handle)
    handle = null
  }

  function start(seconds = 90) {
    stop()
    total.value = seconds
    remaining.value = seconds
    handle = setInterval(() => {
      remaining.value = Math.max(0, remaining.value - 1)
      if (remaining.value === 0) {
        stop()
        if (import.meta.client && navigator.vibrate) navigator.vibrate([120, 60, 120])
        if (import.meta.client && Notification.permission === 'granted') {
          new Notification('Rest over', { body: 'Time for the next set.' })
        }
      }
    }, 1000)
  }

  const progress = computed(() => (total.value ? remaining.value / total.value : 0))

  return { remaining, total, progress, start, stop }
}
