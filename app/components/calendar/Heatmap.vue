<script setup lang="ts">
import type { CalendarDay } from '~/types/api'

defineProps<{ days: CalendarDay[] }>()
const emit = defineEmits<{ select: [date: string] }>()
</script>

<template>
  <div class="grid grid-cols-7 gap-1">
    <button
      v-for="day in days"
      :key="day.date"
      class="aspect-square rounded-md text-[10px]"
      :class="day.has_workout ? 'bg-[var(--accent)] text-black' : 'bg-[var(--surface-2)] text-[var(--muted)]'"
      :title="day.date"
      @click="emit('select', day.date)"
    >
      {{ Number(day.date.slice(-2)) }}
    </button>
  </div>
</template>
