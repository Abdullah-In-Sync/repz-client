<script setup lang="ts">
const props = defineProps<{
  values: number[]
  color?: string
}>()

const max = computed(() => Math.max(...props.values, 1))
</script>

<template>
  <div class="flex h-40 items-end gap-px">
    <div
      v-for="(value, index) in values"
      :key="index"
      class="min-h-[2px] flex-1 rounded-t-sm"
      :style="{ height: `${(value / max) * 100}%`, background: color || 'var(--accent)' }"
    />
  </div>
</template>
