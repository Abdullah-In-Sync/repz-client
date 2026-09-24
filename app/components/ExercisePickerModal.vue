<script setup lang="ts">
interface Exercise {
  id: string
  name: string
  gif_url: string | null
  target: string | null
  body_part: string | null
  equipment: string | null
}

interface Props {
  open: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  select: [exercise: { id: string; name: string; gif_url: string | null }]
}>()

const api = useApi()

const search = ref('')
const equipmentFilter = ref<string | null>(null)
const muscleFilter = ref<string | null>(null)
const items = ref<Exercise[]>([])
const total = ref(0)
const offset = ref(0)
const loading = ref(false)
const showEquipmentPicker = ref(false)
const showMusclePicker = ref(false)
const failedImages = ref<Set<string>>(new Set())

const PAGE_SIZE = 20

// Equipment options — mapped to real values in your DB
const EQUIPMENT_OPTIONS = [
  { label: 'None',           value: 'Body Weight',      img: '/icons/equipment/none.png' },
  { label: 'Barbell',        value: 'Barbell',          img: '/icons/equipment/barbell.png' },
  { label: 'Dumbbell',       value: 'Dumbbell',         img: '/icons/equipment/dumbbell.png' },
  { label: 'Kettlebell',     value: 'Kettlebell',       img: '/icons/equipment/kettlebell.png' },
  { label: 'Machine',        value: 'Leverage Machine', img: '/icons/equipment/machine.png' },
  { label: 'Plate',          value: 'Weighted',         img: '/icons/equipment/plate.png' },
  { label: 'Cable',          value: 'Cable',            img: '/icons/equipment/cable.png' },
  { label: 'Smith Machine',  value: 'Smith Machine',    img: '/icons/equipment/smith-machine.png' },
  { label: 'Band',           value: 'Band',             img: '/icons/equipment/band.png' },
  { label: 'Weighted',       value: 'Weighted',         img: '/icons/equipment/weighted.png' },
  { label: 'Stability Ball', value: 'Stability Ball',   img: '/icons/equipment/stability-ball.png' },
  { label: 'Assisted',       value: 'Assisted',         img: '/icons/equipment/assisted.png' },
]

// Muscle groups — mapped to `target` values in your DB
const MUSCLE_GROUPS = [
  {
    label: 'Upper Body',
    items: [
      { label: 'Abs',        value: 'Abs' },
      { label: 'Biceps',     value: 'Biceps' },
      { label: 'Chest',      value: 'Pectorals' },
      { label: 'Forearms',   value: 'Forearms' },
      { label: 'Lats',       value: 'Lats' },
      { label: 'Lower Back', value: 'Spine' },
      { label: 'Neck',       value: 'Levator Scapulae' },
      { label: 'Shoulders',  value: 'Delts' },
      { label: 'Traps',      value: 'Traps' },
      { label: 'Triceps',    value: 'Triceps' },
      { label: 'Upper Back', value: 'Upper Back' },
    ],
  },
  {
    label: 'Lower Body',
    items: [
      { label: 'Calves',     value: 'Calves' },
      { label: 'Glutes',     value: 'Glutes' },
      { label: 'Hamstrings', value: 'Hamstrings' },
      { label: 'Quads',      value: 'Quads' },
      { label: 'Adductors',  value: 'Adductors' },
      { label: 'Abductors',  value: 'Abductors' },
    ],
  },
]

const activeEquipmentLabel = computed(() => {
  if (!equipmentFilter.value) return 'All Equipment'
  const eq = EQUIPMENT_OPTIONS.find((e) => e.value === equipmentFilter.value)
  return eq ? eq.label : 'All Equipment'
})

const activeMuscleLabel = computed(() => {
  if (!muscleFilter.value) return 'All Muscles'
  for (const group of MUSCLE_GROUPS) {
    const m = group.items.find((x) => x.value === muscleFilter.value)
    if (m) return m.label
  }
  return 'All Muscles'
})

async function load(reset = false) {
  if (loading.value) return
  loading.value = true
  try {
    if (reset) {
      offset.value = 0
      items.value = []
    }
    const query: Record<string, string | number> = {
      limit: PAGE_SIZE,
      offset: offset.value,
    }
    if (search.value.trim()) query.search = search.value.trim()
    if (equipmentFilter.value) query.equipment = equipmentFilter.value
    if (muscleFilter.value) query.target = muscleFilter.value

    const res = await api.get<{ items: Exercise[]; total: number }>('/exercises', query)
    items.value = reset ? res.items : [...items.value, ...res.items]
    total.value = res.total
    offset.value += res.items.length
  } catch {
    /* toast handled by useApi */
  } finally {
    loading.value = false
  }
}

let searchDebounce: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => load(true), 300)
})

watch([equipmentFilter, muscleFilter], () => load(true))

watch(
  () => props.open,
  (v) => {
    if (v) {
      search.value = ''
      equipmentFilter.value = null
      muscleFilter.value = null
      failedImages.value = new Set()
      load(true)
    }
  },
)

function pickEquipment(value: string | null) {
  equipmentFilter.value = value
  showEquipmentPicker.value = false
}

function pickMuscle(value: string | null) {
  muscleFilter.value = value
  showMusclePicker.value = false
}

function clearFilters() {
  search.value = ''
  equipmentFilter.value = null
  muscleFilter.value = null
}

function pick(exercise: Exercise) {
  emit('select', { id: exercise.id, name: exercise.name, gif_url: exercise.gif_url })
  emit('close')
}

function imageFailed(id: string) {
  failedImages.value = new Set([...failedImages.value, id])
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-stretch sm:items-center sm:justify-center">
      <div class="absolute inset-0 bg-black/50" @click="emit('close')" />

      <div class="relative z-10 flex h-full w-full flex-col bg-[var(--bg)] sm:h-[90vh] sm:max-w-2xl sm:rounded-2xl">
        <!-- Header -->
        <header class="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <button class="text-[var(--accent)]" @click="emit('close')">Cancel</button>
          <h2 class="text-lg font-semibold">Add Exercise</h2>
          <button class="text-[var(--accent)]" @click="emit('close')">Done</button>
        </header>

        <!-- Search -->
        <div class="px-4 pt-3">
          <div class="relative">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">🔍</span>
            <input v-model="search" class="input w-full pl-9" placeholder="Search exercise" />
          </div>
        </div>

        <!-- Filter pills -->
        <div class="grid grid-cols-2 gap-3 px-4 pt-3">
          <button
            class="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium"
            @click="showEquipmentPicker = true"
          >
            <span class="truncate">{{ activeEquipmentLabel }}</span>
            <span class="text-[var(--muted)]">›</span>
          </button>
          <button
            class="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium"
            @click="showMusclePicker = true"
          >
            <span class="truncate">{{ activeMuscleLabel }}</span>
            <span class="text-[var(--muted)]">›</span>
          </button>
        </div>

        <!-- Result count -->
        <p class="px-4 pt-4 text-sm text-[var(--muted)]">
          {{ loading && !items.length ? 'Loading…' : `${total} results` }}
        </p>

        <!-- Exercise list -->
        <div class="flex-1 overflow-y-auto px-4 py-3">
          <div v-if="!items.length && !loading" class="py-10 text-center text-[var(--muted)]">
            No exercises match your filters.
          </div>

          <ul class="grid gap-1">
            <li
              v-for="item in items"
              :key="item.id"
              class="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-3 hover:bg-[var(--surface)]"
              @click="pick(item)"
            >
              <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--surface)]">
                <img
                  v-if="item.gif_url && !failedImages.has(item.id)"
                  :src="item.gif_url"
                  :alt="item.name"
                  class="h-full w-full object-cover"
                  loading="lazy"
                  @error="imageFailed(item.id)"
                />
                <span v-else class="text-lg">💪</span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium">{{ item.name }}</p>
                <p class="truncate text-xs capitalize text-[var(--muted)]">
                  {{ item.target || item.body_part }}
                </p>
              </div>
              <span class="text-[var(--muted)]">＋</span>
            </li>
          </ul>

          <button
            v-if="items.length < total && !loading"
            class="btn-ghost mx-auto mt-4 block"
            @click="load()"
          >
            Load more
          </button>

          <p v-if="loading" class="py-4 text-center text-sm text-[var(--muted)]">Loading…</p>
        </div>

        <!-- Sticky footer -->
        <footer class="flex items-center gap-3 border-t border-[var(--border)] px-4 py-3">
          <button class="btn-ghost flex-1" @click="clearFilters">Clear Filters</button>
          <button class="btn-primary flex-1" @click="emit('close')">Show {{ total }} results</button>
        </footer>
      </div>

      <!-- Equipment sub-sheet -->
      <div
        v-if="showEquipmentPicker"
        class="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
        @click.self="showEquipmentPicker = false"
      >
        <div class="absolute inset-0 bg-black/50" @click="showEquipmentPicker = false" />
        <div class="relative z-10 flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-[var(--bg)] sm:max-w-lg sm:rounded-2xl">
          <header class="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <button class="text-[var(--accent)]" @click="showEquipmentPicker = false">Cancel</button>
            <h2 class="text-lg font-semibold">Equipment</h2>
            <span class="w-14" />
          </header>
          <div class="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-4">
            <button
              v-for="eq in EQUIPMENT_OPTIONS"
              :key="eq.value"
              class="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-left text-sm font-medium"
              :class="{ 'ring-2 ring-[var(--accent)]': equipmentFilter === eq.value }"
              @click="pickEquipment(eq.value)"
            >
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/95 ring-1 ring-[var(--border)]">
                <img
                  :src="eq.img"
                  :alt="eq.label"
                  class="h-7 w-7 object-contain"
                  @error="($event.target as HTMLImageElement).style.display = 'none'"
                />
              </span>
              <span class="truncate">{{ eq.label }}</span>
            </button>
          </div>
          <footer class="flex items-center gap-3 border-t border-[var(--border)] px-4 py-3">
            <button class="btn-ghost flex-1" @click="pickEquipment(null)">Clear Filters</button>
            <button class="btn-primary flex-1" @click="showEquipmentPicker = false">
              Show {{ total }} results
            </button>
          </footer>
        </div>
      </div>

      <!-- Muscle sub-sheet -->
      <div
        v-if="showMusclePicker"
        class="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
        @click.self="showMusclePicker = false"
      >
        <div class="absolute inset-0 bg-black/50" @click="showMusclePicker = false" />
        <div class="relative z-10 flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-[var(--bg)] sm:max-w-lg sm:rounded-2xl">
          <header class="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <button class="text-[var(--accent)]" @click="showMusclePicker = false">Cancel</button>
            <h2 class="text-lg font-semibold">Muscle Group</h2>
            <span class="w-14" />
          </header>
          <div class="flex-1 overflow-y-auto p-4">
            <div v-for="group in MUSCLE_GROUPS" :key="group.label" class="mb-5">
              <p class="mb-2 text-sm text-[var(--muted)]">{{ group.label }}</p>
              <div class="grid grid-cols-2 gap-3">
                <button
                  v-for="m in group.items"
                  :key="m.value"
                  class="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-left text-sm font-medium"
                  :class="{ 'ring-2 ring-[var(--accent)]': muscleFilter === m.value }"
                  @click="pickMuscle(m.value)"
                >
                  {{ m.label }}
                </button>
              </div>
            </div>
          </div>
          <footer class="flex items-center gap-3 border-t border-[var(--border)] px-4 py-3">
            <button class="btn-ghost flex-1" @click="pickMuscle(null)">Clear Filters</button>
            <button class="btn-primary flex-1" @click="showMusclePicker = false">
              Show {{ total }} results
            </button>
          </footer>
        </div>
      </div>
    </div>
  </Teleport>
</template>