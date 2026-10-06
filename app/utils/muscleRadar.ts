import type { MuscleShare } from '~/types/api'

export const RADAR_CATEGORIES = [
  'Back',
  'Chest',
  'Core',
  'Shoulders',
  'Arms',
  'Legs',
] as const

export type RadarCategory = (typeof RADAR_CATEGORIES)[number]

function mapBodyPartToGroup(part: string): RadarCategory | null {
  const p = part.toLowerCase().trim()
  if (p.includes('back')) return 'Back'
  if (p.includes('chest')) return 'Chest'
  if (p.includes('shoulder')) return 'Shoulders'
  if (p.includes('waist') || p.includes('core') || p.includes('abs')) return 'Core'
  if (
    p.includes('arm') ||
    p.includes('bicep') ||
    p.includes('tricep') ||
    p.includes('forearm') ||
    p.includes('upper arms') ||
    p.includes('lower arms')
  ) {
    return 'Arms'
  }
  if (
    p.includes('leg') ||
    p.includes('quad') ||
    p.includes('hamstring') ||
    p.includes('glute') ||
    p.includes('calf') ||
    p.includes('upper legs') ||
    p.includes('lower legs')
  ) {
    return 'Legs'
  }
  return null
}

/** Volume share per radar axis (0–100, sums to ~100 when all volume is mapped). */
export function muscleSharesToRadarValues(shares: MuscleShare[]): number[] {
  const totals = Object.fromEntries(RADAR_CATEGORIES.map((c) => [c, 0])) as Record<
    RadarCategory,
    number
  >
  for (const row of shares) {
    const group = mapBodyPartToGroup(row.body_part)
    if (group) totals[group] += row.volume || 0
  }
  const total = RADAR_CATEGORIES.reduce((sum, c) => sum + totals[c], 0) || 1
  return RADAR_CATEGORIES.map((c) => Math.round((100 * totals[c]) / total * 10) / 10)
}
