<script setup lang="ts">
defineProps<{ title: string; value: string; hint?: string }>()
const root = ref<HTMLElement | null>(null)
function onMove(e: MouseEvent) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const el = root.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width - 0.5
  const y = (e.clientY - r.top) / r.height - 0.5
  el.style.transform = `rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg)`
}
function reset() {
  if (root.value) root.value.style.transform = ''
}
</script>

<template>
  <article
    ref="root"
    class="card tilt p-4"
    @mousemove="onMove"
    @mouseleave="reset"
  >
    <p class="text-xs uppercase tracking-widest text-[var(--muted)]">{{ title }}</p>
    <p class="display mt-1 text-3xl tabular text-[var(--accent)]">{{ value }}</p>
    <p v-if="hint" class="mt-1 text-xs text-[var(--muted)]">{{ hint }}</p>
  </article>
</template>

<style scoped>
.tilt {
  transform-style: preserve-3d;
  transition: transform 0.15s ease;
}
</style>
