import type { Workout } from '~/types/api'

/** API datetimes are UTC but often serialized without a Z suffix. */
export function parseApiDateTime(iso: string): Date {
  const hasOffset = /([Zz]|[+-]\d{2}(:\d{2})?)$/.test(iso.trim())
  return new Date(hasOffset ? iso : `${iso}Z`)
}

export function displayTimeZone(): string {
  try {
    const auth = useAuthStore()
    const tz = auth.profile?.timezone?.trim()
    if (tz && tz !== 'UTC') return tz
  } catch {
    /* not in Nuxt context */
  }
  return 'Asia/Kolkata'
}

export function formatWorkoutDateTime(iso: string | undefined, timeZone?: string): string {
  if (!iso) return '—'
  const date = parseApiDateTime(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    timeZone: timeZone ?? displayTimeZone(),
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function sessionDurationSeconds(w: Workout): number | null {
  if (w.duration_seconds != null && w.duration_seconds > 0) return w.duration_seconds
  if (w.started_at && w.ended_at) {
    const sec = Math.floor(
      (parseApiDateTime(w.ended_at).getTime() - parseApiDateTime(w.started_at).getTime()) / 1000,
    )
    return sec > 0 ? sec : null
  }
  return null
}

export function formatSessionDuration(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const parts: string[] = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  if (s > 0 || !parts.length) parts.push(`${s}s`)
  return parts.join(' ')
}
