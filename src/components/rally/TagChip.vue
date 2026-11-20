<script setup lang="ts">
// A values tag on a holding. Click it to see why the tag was applied, how strongly, and the
// source it rests on (PRD F2: "each chip opens its reason, strength and source link").
import type { ValuesTag } from '@/types'
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'

const props = defineProps<{
  tag: ValuesTag
  label: string
  color: string
  /** Company name, for the popover's heading */
  company: string
}>()

const STRENGTH = { 1: 'Minor or indirect', 2: 'A significant part of the business', 3: 'A core business' } as const

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const button = ref<HTMLButtonElement | null>(null)
const panelId = useId()

// A table can hold hundreds of chips, so listen for outside clicks only while this one is open.
const onPointerDown = (event: PointerEvent) => {
  if (!root.value?.contains(event.target as Node)) open.value = false
}
watch(open, (isOpen) => {
  if (isOpen) document.addEventListener('pointerdown', onPointerDown)
  else document.removeEventListener('pointerdown', onPointerDown)
})
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))

/** Escape closes the panel and puts focus back on the chip, so the reader keeps their place. */
function closeAndReturn() {
  if (!open.value) return
  open.value = false
  button.value?.focus()
}
/** Tabbing out of the chip and its panel closes it. */
function onFocusOut(event: FocusEvent) {
  if (!root.value?.contains(event.relatedTarget as Node | null)) open.value = false
}

const host = computed(() => {
  try {
    return new URL(props.tag.sourceUrl).hostname.replace(/^www\./, '')
  } catch {
    return props.tag.sourceUrl
  }
})
</script>

<template>
  <span ref="root" class="tag-chip" @keydown.esc="closeAndReturn" @focusout="onFocusOut">
    <button
      ref="button"
      type="button"
      class="tag-chip__button"
      :class="{ 'is-open': open }"
      :aria-expanded="open"
      :aria-controls="open ? panelId : undefined"
      :aria-label="`${label}: why ${company} is tagged`"
      @click="open = !open"
    >
      <span class="dot" :style="{ '--dot': color }" />{{ label }}
    </button>
    <Transition name="pop">
      <span v-if="open" :id="panelId" class="tag-chip__panel" role="group" :aria-label="`${label}: ${company}`">
        <span class="label-mono">{{ company }} · {{ label }}</span>
        <span class="tag-chip__reason">{{ tag.reason }}</span>
        <span class="tag-chip__strength">
          <span class="tag-chip__pips" aria-hidden="true"><i v-for="n in 3" :key="n" :class="{ 'is-on': n <= tag.strength }" /></span>
          Strength {{ tag.strength }} of 3 · {{ STRENGTH[tag.strength] }}
        </span>
        <a :href="tag.sourceUrl" target="_blank" rel="noopener noreferrer" class="source-link">Source: {{ host }} ↗</a>
      </span>
    </Transition>
  </span>
</template>

<style scoped>
.tag-chip {
  position: relative;
  display: inline-flex;
}
.tag-chip__button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px 6px 10px;
  border-radius: var(--radius-pill);
  background: var(--surface-2);
  font-size: 13px;
  font-weight: 500;
  line-height: 16px;
  white-space: nowrap;
  transition: background-color 0.2s var(--ease);
}
.tag-chip__button:hover,
.tag-chip__button.is-open {
  background: var(--border);
}
.tag-chip__panel {
  position: absolute;
  z-index: 25;
  top: calc(100% + 8px);
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  width: 340px;
  padding: 18px 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-float);
  text-align: left;
  white-space: normal;
}
.tag-chip__reason {
  font-size: 15px;
  line-height: 1.45;
}
.tag-chip__strength {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text-muted);
}
.tag-chip__pips {
  display: inline-flex;
  gap: 4px;
}
.tag-chip__pips i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--track);
}
.tag-chip__pips i.is-on {
  background: var(--flare);
}
</style>
