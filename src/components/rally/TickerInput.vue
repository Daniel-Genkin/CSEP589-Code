<script setup lang="ts">
// The Home input: a fund ticker, or several tickers separated by commas or spaces.
// Suggestions start after one character and complete the ticker being typed.
import { provider } from '@/data'
import type { Security } from '@/types'
import { computed, ref, useId, watch } from 'vue'

const model = defineModel<string>({ required: true })
defineProps<{ invalid?: boolean; describedBy?: string }>()
const emit = defineEmits<{ submit: [] }>()

const listId = useId()
const input = ref<HTMLInputElement | null>(null)
const options = ref<Security[]>([])
const open = ref(false)
const active = ref(-1)
const searching = ref(false)
const failed = ref(false)
// True from a keystroke until a suggestion is taken or the input is submitted, so a search
// that finishes late cannot reopen the list over the result.
const typing = ref(false)
let request = 0

/** The ticker being typed: whatever follows the last comma, semicolon or space. */
const token = computed(() => model.value.split(/[\s,;]+/).pop() ?? '')

watch(token, async (value) => {
  const mine = ++request
  active.value = -1
  if (!value) {
    options.value = []
    open.value = false
    searching.value = false
    failed.value = false
    return
  }
  let found: Security[] = []
  let searchFailed = false
  searching.value = true
  failed.value = false
  open.value = typing.value && document.activeElement === input.value
  try {
    found = await provider.searchSecurities(value)
  } catch {
    searchFailed = true
  }
  if (mine !== request) return // a later keystroke already asked again
  searching.value = false
  failed.value = searchFailed
  // Nothing to suggest once the exact ticker is present, even when a live catalog also has SPY* funds.
  options.value = found.some((security) => security.ticker === value.toUpperCase()) ? [] : found
  open.value = typing.value && (searching.value || failed.value || options.value.length > 0) && document.activeElement === input.value
})

function choose(option: Security) {
  const head = model.value.slice(0, model.value.length - token.value.length)
  model.value = `${head}${option.ticker}`
  typing.value = false
  options.value = []
  open.value = false
  active.value = -1
  input.value?.focus()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' && options.value.length) {
    event.preventDefault()
    open.value = true
    active.value = (active.value + 1) % options.value.length
  } else if (event.key === 'ArrowUp' && open.value) {
    event.preventDefault()
    active.value = active.value <= 0 ? options.value.length - 1 : active.value - 1
  } else if (event.key === 'Enter') {
    event.preventDefault()
    // Enter takes the highlighted suggestion; with none highlighted it submits what is typed.
    if (open.value && active.value >= 0) choose(options.value[active.value])
    else {
      open.value = false
      typing.value = false
      emit('submit')
    }
  } else if (event.key === 'Escape') {
    open.value = false
    active.value = -1
  }
}

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div class="ticker-input">
    <input
      ref="input"
      v-model="model"
      type="text"
      class="ticker-input__field"
      role="combobox"
      aria-label="Fund or tickers"
      aria-autocomplete="list"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-activedescendant="active >= 0 ? `${listId}-${active}` : undefined"
      :aria-invalid="invalid || undefined"
      :aria-describedby="describedBy"
      placeholder="SPY, or VOO, NVDA, AAPL"
      autocomplete="off"
      autocapitalize="characters"
      spellcheck="false"
      @input="typing = true"
      @keydown="onKeydown"
      @focus="open = typing && options.length > 0"
      @blur="open = false"
    />
    <Transition name="pop">
      <ul v-show="open" :id="listId" class="ticker-input__list" role="listbox" aria-label="Matching securities">
        <li v-if="searching" class="ticker-input__loading" role="status">
          <span class="skeleton ticker-input__loading-ticker" />
          <span class="skeleton ticker-input__loading-name" />
        </li>
        <li v-else-if="failed" class="ticker-input__error" role="alert">Alpaca search is unavailable. You can still submit an exact ticker.</li>
        <li
          v-for="(option, index) in options"
          :id="`${listId}-${index}`"
          :key="option.ticker"
          role="option"
          class="ticker-input__option"
          :class="{ 'is-active': index === active }"
          :aria-selected="index === active"
          @mousedown.prevent="choose(option)"
          @mousemove="active = index"
        >
          <span class="ticker-input__ticker">{{ option.ticker }}</span>
          <span class="ticker-input__name">{{ option.name }}</span>
          <span v-if="option.kind === 'etf'" class="label-mono">Fund</span>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.ticker-input {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
}
.ticker-input__field {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border: 0;
  border-radius: var(--radius-pill);
  background: none;
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 500;
  color: var(--text);
  text-transform: uppercase;
}
.ticker-input__field::placeholder {
  color: var(--text-muted);
  text-transform: none;
}
.ticker-input__field:focus {
  outline: none;
}
.ticker-input__list {
  position: absolute;
  z-index: 30;
  top: calc(100% + 16px);
  left: -12px;
  width: min(520px, 90vw);
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-float);
  text-align: left;
}
.ticker-input__option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.ticker-input__option.is-active {
  background: var(--surface-2);
}
.ticker-input__loading,.ticker-input__error {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 42px;
  padding: 10px 12px;
}
.ticker-input__loading-ticker {
  width: 64px;
  height: 14px;
}
.ticker-input__loading-name {
  width: 55%;
  height: 14px;
}
.ticker-input__error {
  font-size: 13px;
  line-height: 1.4;
  color: #f6a283;
}
.ticker-input__ticker {
  flex: none;
  width: 64px;
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  color: var(--cream);
}
.ticker-input__name {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
