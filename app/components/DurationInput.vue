<script setup lang="ts">
import {
  appendDurationDigit,
  backspaceDurationDigit,
  formatDurationMmSs,
} from '~/utils/durationInput'

const model = defineModel<number | null>({ default: null })

withDefaults(
  defineProps<{
    placeholder?: string
    inputClass?: string
  }>(),
  { placeholder: '00:00', inputClass: 'input mt-1 text-center tabular-nums' },
)

function onKeydown(event: KeyboardEvent) {
  if (event.key >= '0' && event.key <= '9') {
    event.preventDefault()
    model.value = appendDurationDigit(model.value, Number(event.key))
    return
  }
  if (event.key === 'Backspace' || event.key === 'Delete') {
    event.preventDefault()
    model.value = backspaceDurationDigit(model.value)
  }
}

function onPaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text') ?? ''
  const match = text.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return
  const mm = Number(match[1])
  const ss = Number(match[2])
  if (ss >= 60) return
  const total = mm * 60 + ss
  model.value = total > 0 ? total : null
}
</script>

<template>
  <input
    :class="inputClass"
    type="text"
    inputmode="numeric"
    autocomplete="off"
    :placeholder="placeholder"
    :value="formatDurationMmSs(model)"
    @keydown="onKeydown"
    @paste="onPaste"
  />
</template>
