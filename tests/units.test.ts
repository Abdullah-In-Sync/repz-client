import { describe, expect, it } from 'vitest'
import { displayToKg, kgToDisplay } from '../app/composables/useUnits'

describe('unit conversion', () => {
  it('round-trips pounds', () => {
    const kg = displayToKg(225, 'lb')
    expect(kg).toBeCloseTo(102.06, 1)
    expect(kgToDisplay(kg, 'lb')).toBeCloseTo(225, 0)
  })

  it('leaves kg unchanged', () => {
    expect(kgToDisplay(80, 'kg')).toBe(80)
    expect(displayToKg(80, 'kg')).toBe(80)
  })
})
