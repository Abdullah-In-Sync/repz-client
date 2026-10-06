<script setup lang="ts">
import type { CalendarDay } from '~/types/api'

defineProps<{ days: CalendarDay[] }>()
const emit = defineEmits<{ select: [date: string] }>()
</script>

<template>
  <div class="grid w-full min-w-0 grid-cols-7 gap-0.5 sm:gap-1">
    <button
      v-for="day in days"
      :key="day.date"
      class="aspect-square min-w-0 rounded-md text-[9px] sm:text-[10px]"
      :class="day.has_workout ? 'bg-[var(--accent)] text-black' : 'bg-[var(--surface-2)] text-[var(--muted)]'"
      :title="day.date"
      @click="emit('select', day.date)"
    >
      {{ Number(day.date.slice(-2)) }}
    </button>
  </div>
</template>
