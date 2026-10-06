import type { CalendarDetailDay } from '~/types/api'

export const CALENDAR_WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export function formatCalendarMonthTitle(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) return monthKey
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** ISO weekday: Monday = 1 … Sunday = 7 */
function isoWeekdayFromIsoDate(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number)
  const day = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()
  return day === 0 ? 7 : day
}

export function buildMonthWeeks(days: CalendarDetailDay[]): (CalendarDetailDay | null)[][] {
  if (!days.length) return []
  const cells: (CalendarDetailDay | null)[] = []
  const pad = isoWeekdayFromIsoDate(days[0]!.date) - 1
  for (let i = 0; i < pad; i++) cells.push(null)
  for (const day of days) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (CalendarDetailDay | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}

export function dayNumber(isoDate: string): number {
  return Number(isoDate.slice(-2))
}

/** Short labels under active days: session / workout names. */
export function dayActivityLines(day: CalendarDetailDay): string[] {
  return day.workouts.map((w) => w.name).slice(0, 2)
}
