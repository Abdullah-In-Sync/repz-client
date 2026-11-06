import { formatCompactKg } from '~/utils/reportFormat'

const ACHIEVEMENT_TYPE_LABELS: Record<string, string> = {
  streak_7: '7-day streak',
  streak_30: '30-day streak',
  pr_broken: 'PR broken',
  volume_milestone: 'Volume milestone',
  consistency_badge: 'Consistency badge',
}

export function formatAchievementType(value: string): string {
  return ACHIEVEMENT_TYPE_LABELS[value] ?? value.replace(/_/g, ' ')
}

export function formatAchievementHint(
  type: string,
  metadata: Record<string, unknown> | null,
): string | null {
  if (!metadata) return null

  switch (type) {
    case 'volume_milestone': {
      const milestone = metadata.milestone
      if (typeof milestone === 'number') {
        return `${formatCompactKg(milestone)} lifetime`
      }
      break
    }
    case 'streak_7':
    case 'streak_30': {
      const streak = metadata.streak
      if (typeof streak === 'number') {
        return `${streak} days in a row`
      }
      break
    }
    case 'pr_broken':
      return 'New personal best'
    case 'consistency_badge': {
      const days = metadata.workout_days
      if (typeof days === 'number') {
        return `${days} workout days`
      }
      break
    }
  }

  return null
}
