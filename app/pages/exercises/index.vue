<script setup lang="ts">
import type { Exercise } from '~/types/api'

const route = useRoute()
const store = useExerciseStore()
const selected = ref<Exercise | null>(null)
const editing = ref(false)
const showCustom = ref(false)
const customName = ref('')
const gifFailed = ref(false)
const saving = ref(false)

const form = reactive({
  name: '',
  description: '',
  target: '',
  body_part: '',
  equipment: '',
  secondary_muscles_text: '',
  is_reps_based: true,
  is_load_based: false,
  is_time_based: false,
  is_distance_based: false,
})

const returnTo = computed(() => {
  const value = route.query.returnTo
  return typeof value === 'string' && value.startsWith('/') ? value : null
})

async function openFromRoute() {
  const id = typeof route.query.id === 'string' ? route.query.id : ''
  if (!id) return
  const wantEdit = route.query.edit === '1' || route.query.edit === 'true'
  try {
    const item = await store.getOne(id)
    open(item)
    if (wantEdit) startEdit()
  } catch {
    /* ignore */
  }
}

function closeDetail() {
  selected.value = null
  editing.value = false
  if (returnTo.value) void navigateTo(returnTo.value)
}

onMounted(async () => {
  const auth = useAuthStore()
  await auth.init()
  void store.loadFilters()
  void store.load()
  await openFromRoute()
})

watch(
  () => [route.query.id, route.query.edit],
  () => {
    void openFromRoute()
  },
)

function applySearch() {
  store.query.offset = 0
  void store.load()
}

function applyFilter() {
  store.query.offset = 0
  void store.load()
}

function prevPage() {
  store.query.offset = Math.max(0, store.query.offset - store.query.limit)
  void store.load()
}

function nextPage() {
  store.query.offset += store.query.limit
  void store.load()
}

function hideBrokenGif(event: Event) {
  gifFailed.value = true
  const image = event.target as HTMLImageElement
  image.style.display = 'none'
}

function fillForm(item: Exercise) {
  form.name = item.name
  form.description = item.description || ''
  form.target = item.target || ''
  form.body_part = item.body_part || ''
  form.equipment = item.equipment || ''
  form.secondary_muscles_text = (item.secondary_muscles || []).join(', ')
  form.is_reps_based = item.is_reps_based
  form.is_load_based = item.is_load_based
  form.is_time_based = item.is_time_based
  form.is_distance_based = item.is_distance_based
}

function open(item: Exercise) {
  gifFailed.value = false
  selected.value = item
  editing.value = false
  fillForm(item)
}

function startEdit() {
  if (!selected.value) return
  fillForm(selected.value)
  editing.value = true
}

async function saveEdit() {
  if (!selected.value) return
  saving.value = true
  try {
    const secondary_muscles = form.secondary_muscles_text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const updated = await store.update(selected.value.id, {
      name: form.name,
      description: form.description || null,
      target: form.target || null,
      body_part: form.body_part || null,
      equipment: form.equipment || null,
      secondary_muscles,
      is_reps_based: form.is_reps_based,
      is_load_based: form.is_load_based,
      is_time_based: form.is_time_based,
      is_distance_based: form.is_distance_based,
    })
    selected.value = updated
    editing.value = false
    await store.load()
    if (returnTo.value) await navigateTo(returnTo.value)
  } finally {
    saving.value = false
  }
}

async function onGifPick(event: Event) {
  if (!selected.value) return
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  saving.value = true
  try {
    const updated = await store.uploadGif(selected.value.id, file)
    selected.value = updated
    gifFailed.value = false
    await store.load()
  } finally {
    saving.value = false
    input.value = ''
  }
}

async function deleteExercise() {
  if (!selected.value) return
  if (!confirm(`Delete "${selected.value.name}"? This fails if it is used in routines or workouts.`)) return
  saving.value = true
  try {
    await store.remove(selected.value.id)
    selected.value = null
    editing.value = false
    await store.load()
  } finally {
    saving.value = false
  }
}

async function createCustom() {
  if (!customName.value) return
  const created = await store.createCustom({ name: customName.value })
  showCustom.value = false
  customName.value = ''
  open(created)
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
      <input v-model="store.query.search" class="input lg:col-span-1" placeholder="Search" @keyup.enter="applySearch" />
      <select v-model="store.query.bodyPart" class="input" @change="applyFilter">
        <option value="">Body part</option>
        <option v-for="p in store.filters.body_parts" :key="p" :value="p">{{ p }}</option>
      </select>
      <select v-model="store.query.target" class="input" @change="applyFilter">
        <option value="">Target</option>
        <option v-for="p in store.filters.targets" :key="p" :value="p">{{ p }}</option>
      </select>
      <select v-model="store.query.equipment" class="input" @change="applyFilter">
        <option value="">Equipment</option>
        <option v-for="p in store.filters.equipment" :key="p" :value="p">{{ p }}</option>
      </select>
    </div>
    <div v-if="store.loading" class="text-[var(--muted)]">Loading…</div>
    <div v-else-if="store.error" class="card flex items-center justify-between p-4 text-sm">
      <span>{{ store.error }}</span>
      <button class="btn-ghost" @click="store.load()">Retry</button>
    </div>
    <div class="grid gap-2">
      <button
        v-for="item in store.items"
        :key="item.id"
        class="card flex items-center gap-3 p-3 text-left"
        @click="open(item)"
      >
        <div class="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-[var(--surface-2)] text-xs text-[var(--muted)]">
          <img
            v-if="item.gif_url"
            :src="exerciseGifSrc(item.gif_url, item.updated_at)!"
            alt=""
            class="h-full w-full object-cover"
          />
          <span v-else>GIF</span>
        </div>
        <div>
          <p class="font-semibold">{{ item.name }}</p>
          <p class="text-xs text-[var(--muted)]">{{ item.body_part }} · {{ item.target }} · {{ item.equipment }}</p>
        </div>
      </button>
    </div>
    <div class="flex items-center justify-between">
      <button
        class="btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="store.query.offset === 0"
        @click="prevPage"
      >
        Prev
      </button>
      <p class="text-sm text-[var(--muted)]">
        {{ store.total === 0 ? 0 : store.query.offset + 1 }}–{{ Math.min(store.query.offset + store.items.length, store.total) }}
        of {{ store.total }}
      </p>
      <button
        class="btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="store.query.offset + store.query.limit >= store.total"
        @click="nextPage"
      >
        Next
      </button>
    </div>

    <div v-if="selected" class="fixed inset-0 z-30 bg-black/70 p-4" @click.self="closeDetail">
      <div class="card mx-auto max-h-[90dvh] max-w-lg overflow-y-auto p-5">
        <img
          v-if="selected.gif_url && !gifFailed && !editing"
          :src="exerciseGifSrc(selected.gif_url, selected.updated_at)!"
          class="mb-4 w-full rounded-xl"
          alt=""
          @error="hideBrokenGif"
        />
        <template v-if="!editing">
          <h2 class="display text-3xl">{{ selected.name }}</h2>
          <p class="text-sm text-[var(--muted)]">{{ selected.body_part }} / {{ selected.target }}</p>
          <p v-if="selected.description" class="mt-2 text-sm">{{ selected.description }}</p>
          <p class="mt-2 text-xs text-[var(--muted)]">
            Tracking:
            <span v-if="selected.is_reps_based">reps</span>
            <span v-if="selected.is_load_based"> · load</span>
            <span v-if="selected.is_time_based"> · time</span>
            <span v-if="selected.is_distance_based"> · distance</span>
          </p>
          <ol class="mt-4 list-decimal space-y-1 pl-5 text-sm">
            <li v-for="(step, i) in selected.instructions || []" :key="i">{{ step }}</li>
          </ol>
          <div class="mt-4 flex flex-wrap gap-2">
            <button class="btn-ghost" @click="startEdit">Edit</button>
            <button class="btn-ghost text-red-400" :disabled="saving" @click="deleteExercise">Delete</button>
            <NuxtLink class="btn-primary" :to="`/routines/edit?add=${selected.id}`">Add to routine</NuxtLink>
          </div>
        </template>
        <form v-else class="grid gap-3" @submit.prevent="saveEdit">
          <h2 class="font-semibold">Edit exercise</h2>
          <label class="text-xs">Name<input v-model="form.name" class="input mt-1" required /></label>
          <label class="text-xs">Description<textarea v-model="form.description" class="input mt-1 min-h-20" /></label>
          <label class="text-xs">Target muscle<input v-model="form.target" class="input mt-1" /></label>
          <label class="text-xs">Body part<input v-model="form.body_part" class="input mt-1" /></label>
          <label class="text-xs">Equipment<input v-model="form.equipment" class="input mt-1" /></label>
          <label class="text-xs">
            Secondary muscles (comma-separated)
            <input v-model="form.secondary_muscles_text" class="input mt-1" />
          </label>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <label class="flex items-center gap-2"><input v-model="form.is_reps_based" type="checkbox" /> Reps</label>
            <label class="flex items-center gap-2"><input v-model="form.is_load_based" type="checkbox" /> Load</label>
            <label class="flex items-center gap-2"><input v-model="form.is_time_based" type="checkbox" /> Time</label>
            <label class="flex items-center gap-2"><input v-model="form.is_distance_based" type="checkbox" /> Distance</label>
          </div>
          <label class="text-xs">
            GIF / image
            <input class="input mt-1" type="file" accept="image/*" @change="onGifPick" />
          </label>
          <div class="flex gap-2">
            <button
              type="button"
              class="btn-ghost"
              @click="returnTo ? closeDetail() : (editing = false)"
            >
              Cancel
            </button>
            <button type="submit" class="btn-primary flex-1" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
          </div>
        </form>
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
