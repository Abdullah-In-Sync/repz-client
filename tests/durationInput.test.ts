import { describe, expect, it } from 'vitest'
import {
  appendDurationDigit,
  backspaceDurationDigit,
  formatDurationMmSs,
} from '../app/utils/durationInput'

function typeDigits(start: number | null, keys: string): number | null {
  let value = start
  for (const key of keys) {
    if (key === '⌫') {
      value = backspaceDurationDigit(value)
    } else {
      value = appendDurationDigit(value, Number(key))
    }
  }
  return value
}

describe('duration digit entry', () => {
  it('formats 14 minutes as 14:00', () => {
    const seconds = typeDigits(null, '1400')
    expect(seconds).toBe(14 * 60)
    expect(formatDurationMmSs(seconds)).toBe('14:00')
  })

  it('formats 15 seconds as 00:15', () => {
    const seconds = typeDigits(null, '0015')
    expect(seconds).toBe(15)
    expect(formatDurationMmSs(seconds)).toBe('00:15')
  })

  it('backspace removes digits from the right', () => {
    let value = typeDigits(null, '1400')
    value = backspaceDurationDigit(value)
    expect(formatDurationMmSs(value)).toBe('01:40')
    value = backspaceDurationDigit(value)
    expect(formatDurationMmSs(value)).toBe('00:14')
  })
})
