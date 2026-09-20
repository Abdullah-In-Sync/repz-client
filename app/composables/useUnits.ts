export const KG_PER_LB = 0.45359237

export function kgToDisplay(kg: number | null | undefined, unit: 'kg' | 'lb'): number | null {
  if (kg == null) return null
  if (unit === 'kg') return round1(kg)
  return round1(kg / KG_PER_LB)
}

export function displayToKg(value: number | null | undefined, unit: 'kg' | 'lb'): number | null {
  if (value == null) return null
  if (unit === 'kg') return value
  return round2(value * KG_PER_LB)
}

export function round1(n: number) {
  return Math.round(n * 10) / 10
}

export function round2(n: number) {
  return Math.round(n * 100) / 100
}

export const useUnits = () => {
  const auth = useAuthStore()
  const unit = computed(() => auth.profile?.unit_preference || 'kg')
  const label = computed(() => (unit.value === 'lb' ? 'lb' : 'kg'))

  return {
    unit,
    label,
    toDisplay: (kg: number | null | undefined) => kgToDisplay(kg, unit.value),
    toKg: (value: number | null | undefined) => displayToKg(value, unit.value),
  }
}
