<script setup lang="ts">
import gsap from 'gsap'

const reduced = ref(false)
onMounted(() => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!reduced.value) {
    gsap.from('.dumbbell', { opacity: 0, y: 12, duration: 0.6 })
  }
})
</script>

<template>
  <div class="perspective-card mx-auto h-40 w-40">
    <div class="dumbbell" :class="{ still: reduced }">
      <span class="plate left" />
      <span class="bar" />
      <span class="plate right" />
    </div>
  </div>
</template>

<style scoped>
.perspective-card {
  perspective: 600px;
}
.dumbbell {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-style: preserve-3d;
  animation: spin 8s linear infinite;
}
.dumbbell.still {
  animation: none;
}
.bar {
  width: 72px;
  height: 14px;
  background: linear-gradient(90deg, #777, #f5c518, #777);
  border-radius: 8px;
}
.plate {
  width: 28px;
  height: 72px;
  border-radius: 8px;
  background: #232326;
  border: 2px solid #f5c518;
}
.plate.left {
  transform: translateZ(8px);
}
.plate.right {
  transform: translateZ(-8px);
}
@keyframes spin {
  from {
    transform: rotateY(0deg);
  }
  to {
    transform: rotateY(360deg);
  }
}
</style>
