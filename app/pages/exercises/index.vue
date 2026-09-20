<script setup lang="ts">
import type { Exercise } from '~/types/api'

const store = useExerciseStore()
const selected = ref<Exercise | null>(null)
const showCustom = ref(false)
const customName = ref('')

onMounted(async () => {
  await store.loadFilters()
  await store.load()
})

watch(
  () => ({ ...store.query, offset: store.query.offset }),
  () => store.load(),
)

function open(item: Exercise) {
  selected.value = item
}

async function createCustom() {
  if (!customName.value) return
  const created = await store.createCustom({ name: customName.value })
  showCustom.value = false
  customName.value = ''
  selected.value = created
  await store.load()
}
</script>

<template>
  <div class="grid gap-4 pb-10">
    <div class="flex items-end justify-between">
      <div>
        <h1 class="display text-4xl">Exercises</h1>
        <p class="text-[var(--muted)]">{{ store.total }} movements</p>
      </div>
      <button class="btn-ghost" @click="showCustom = true">Custom</button>
    </div>
    <div class="grid gap-2 lg:grid-cols-4">
      <input v-model="store.query.search" class="input lg:col-span-1" placeholder="Search" @keyup.enter="store.query.offset = 0" />
      <select v-model="store.query.bodyPart" class="input" @change="store.query.offset = 0">
        <option value="">Body part</option>
        <option v-for="p in store.filters.body_parts" :key="p" :value="p">{{ p }}</option>
      </select>
      <select v-model="store.query.target" class="input" @change="store.query.offset = 0">
        <option value="">Target</option>
        <option v-for="p in store.filters.targets" :key="p" :value="p">{{ p }}</option>
      </select>
      <select v-model="store.query.equipment" class="input" @change="store.query.offset = 0">
        <option value="">Equipment</option>
        <option v-for="p in store.filters.equipment" :key="p" :value="p">{{ p }}</option>
      </select>
    </div>
    <div v-if="store.loading" class="text-[var(--muted)]">Loading…</div>
    <div class="grid gap-2">
      <button
        v-for="item in store.items"
        :key="item.id"
        class="card flex items-center gap-3 p-3 text-left"
        @click="open(item)"
      >
        <img v-if="item.gif_url" :src="item.gif_url" alt="" class="h-14 w-14 rounded-lg object-cover" loading="lazy" />
        <div>
          <p class="font-semibold">{{ item.name }}</p>
          <p class="text-xs text-[var(--muted)]">{{ item.body_part }} · {{ item.target }} · {{ item.equipment }}</p>
        </div>
      </button>
    </div>
    <div class="flex justify-between">
      <button class="btn-ghost" :disabled="store.query.offset === 0" @click="store.query.offset = Math.max(0, store.query.offset - store.query.limit)">
        Prev
      </button>
      <button class="btn-ghost" :disabled="store.query.offset + store.query.limit >= store.total" @click="store.query.offset += store.query.limit">
        Next
      </button>
    </div>

    <div v-if="selected" class="fixed inset-0 z-30 bg-black/70 p-4" @click.self="selected = null">
      <div class="card mx-auto max-h-[90dvh] max-w-lg overflow-y-auto p-5">
        <img v-if="selected.gif_url" :src="selected.gif_url" class="mb-4 w-full rounded-xl" alt="" />
        <h2 class="display text-3xl">{{ selected.name }}</h2>
        <p class="text-sm text-[var(--muted)]">{{ selected.body_part }} / {{ selected.target }}</p>
        <ol class="mt-4 list-decimal space-y-1 pl-5 text-sm">
          <li v-for="(step, i) in selected.instructions || []" :key="i">{{ step }}</li>
        </ol>
        <NuxtLink class="btn-primary mt-4" :to="`/routines/edit?add=${selected.id}`">Add to routine</NuxtLink>
      </div>
    </div>

    <div v-if="showCustom" class="fixed inset-0 z-30 grid place-items-center bg-black/70 p-4" @click.self="showCustom = false">
      <form class="card grid w-full max-w-sm gap-3 p-5" @submit.prevent="createCustom">
        <h2 class="font-semibold">Custom exercise</h2>
        <input v-model="customName" class="input" placeholder="Name" required />
        <button class="btn-primary">Save</button>
      </form>
    </div>
  </div>
</template>
