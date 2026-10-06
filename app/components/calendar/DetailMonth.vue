<script setup lang="ts">
import type { CalendarDetailMonth } from '~/types/api'
import {
  CALENDAR_WEEKDAY_LABELS,
  buildMonthWeeks,
  dayActivityLines,
  dayNumber,
  formatCalendarMonthTitle,
} from '~/utils/calendarDetail'

const props = defineProps<{ month: CalendarDetailMonth }>()
const emit = defineEmits<{ select: [date: string] }>()

const weeks = computed(() => buildMonthWeeks(props.month.days))
const title = computed(() => formatCalendarMonthTitle(props.month.month))
</script>

<template>
  <section class="min-w-0">
    <h2 class="mb-3 text-sm font-semibold text-[var(--muted)]">{{ title }}</h2>
    <div class="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-[var(--muted)]">
      <span v-for="label in CALENDAR_WEEKDAY_LABELS" :key="label">{{ label }}</span>
    </div>
    <div class="grid gap-2">
      <div
        v-for="(week, wi) in weeks"
        :key="`${month.month}-w${wi}`"
        class="grid grid-cols-7 gap-x-1 gap-y-1 border-b border-[var(--surface-2)] pb-2 last:border-b-0"
      >
        <div
          v-for="(cell, di) in week"
          :key="cell?.date ?? `${month.month}-empty-${wi}-${di}`"
          class="min-h-[3.25rem] min-w-0 px-0.5 pt-1 text-center"
        >
          <template v-if="cell">
            <button
              type="button"
              class="mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm tabular transition-colors"
              :class="
                cell.has_workout
                  ? 'bg-[var(--accent)] font-semibold text-black'
                  : 'text-[var(--muted)]'
              "
              :disabled="!cell.has_workout"
              @click="cell.has_workout && emit('select', cell.date)"
            >
              {{ dayNumber(cell.date) }}
            </button>
            <div v-if="cell.has_workout" class="mt-0.5 space-y-0.5">
              <p
                v-for="(line, li) in dayActivityLines(cell)"
                :key="li"
                class="truncate text-[9px] leading-tight text-[var(--muted)]"
                :title="line"
              >
                {{ line }}
              </p>
            </div>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>
