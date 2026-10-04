/** Four-digit MMSS buffer used for gym-style duration entry (e.g. 1400 → 14:00). */

export function secondsToDigitString(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return '0000'
  const mm = Math.min(99, Math.floor(seconds / 60))
  const ss = seconds % 60
  return `${String(mm).padStart(2, '0')}${String(ss).padStart(2, '0')}`.slice(-4)
}

export function digitStringToSeconds(digits: string): number {
  const padded = digits.replace(/\D/g, '').padStart(4, '0').slice(-4)
  let mm = parseInt(padded.slice(0, 2), 10)
  let ss = parseInt(padded.slice(2, 4), 10)
  if (ss >= 60) {
    mm += Math.floor(ss / 60)
    ss = ss % 60
  }
  mm = Math.min(mm, 99)
  return mm * 60 + ss
}

export function formatDurationMmSs(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return ''
  const mm = Math.floor(seconds / 60)
  const ss = seconds % 60
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

export function appendDurationDigit(current: number | null | undefined, digit: number): number | null {
  const cur = secondsToDigitString(current)
  const next = (cur + String(digit)).slice(-4)
  const seconds = digitStringToSeconds(next)
  return seconds <= 0 ? null : seconds
}

export function backspaceDurationDigit(current: number | null | undefined): number | null {
  const cur = secondsToDigitString(current)
  if (cur === '0000') return null
  const next = (`0${cur.slice(0, 3)}`).slice(-4)
  const seconds = digitStringToSeconds(next)
  return seconds <= 0 ? null : seconds
}
