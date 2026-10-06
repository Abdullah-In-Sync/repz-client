const RECORD_TYPE_LABELS: Record<string, string> = {
  max_weight: 'Max weight',
  max_reps: 'Max reps',
  max_volume: 'Max volume',
  best_1rm: 'Best 1RM',
  longest_duration: 'Longest duration',
  longest_distance: 'Longest distance',
}

export function formatRecordType(value: string): string {
  return RECORD_TYPE_LABELS[value] ?? value.replace(/_/g, ' ')
}
