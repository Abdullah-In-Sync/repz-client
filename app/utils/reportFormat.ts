export function formatCompactKg(kg: number): string {
  const n = Math.round(kg)
  if (Math.abs(n) >= 1000) {
    const k = n / 1000
    const rounded = k >= 10 ? Math.round(k) : Math.round(k * 10) / 10
    return `${rounded}k kg`
  }
  return `${n.toLocaleString()} kg`
}

export function formatDurationHoursMinutes(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}min`
  if (h > 0) return `${h}h`
  if (m > 0) return `${m}min`
  return `${seconds}s`
}

export function formatPeriodDelta(
  current: number,
  previous: number,
  formatValue: (n: number) => string,
): { arrow: '↑' | '↓'; text: string; improved: boolean } {
  const diff = current - previous
  if (diff === 0) {
    return { arrow: '↓', text: formatValue(0), improved: true }
  }
  const down = diff < 0
  return {
    arrow: down ? '↓' : '↑',
    text: formatValue(Math.abs(diff)),
    improved: diff > 0,
  }
}

export const REPORT_RANGE_LABELS: Record<string, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '1y': 'Last year',
}
