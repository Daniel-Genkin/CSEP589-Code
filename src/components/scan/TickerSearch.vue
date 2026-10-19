<script setup>
import { securitiesService } from '@/api'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import { useClickOutside } from '@/composables/useClickOutside'
import { Check, LoaderCircle, Plus, Search } from '@lucide/vue'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  selected: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Search a company or ticker, like NOVA or Broadline' },
})
const emit = defineEmits(['select', 'bulk'])

const root = ref(null)
const input = ref(null)
const query = ref('')
const results = ref([])
const loading = ref(false)
const open = ref(false)
const active = ref(0)
let timer = null
let requestId = 0

const tokens = computed(() =>
  query.value
    .split(/[\s,;]+/)
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean),
)
const isBulk = computed(() => /[,;]/.test(query.value))
const showList = computed(() => open.value && query.value.trim() && !isBulk.value && (results.value.length || !loading.value))

watch(query, (value) => {
  clearTimeout(timer)
  const q = value.trim()
  if (!q || isBulk.value) {
    results.value = []
    loading.value = false
    return
  }
  loading.value = true
  timer = setTimeout(async () => {
    const id = ++requestId
    const found = await securitiesService.search(q).catch(() => [])
    if (id !== requestId) return
    results.value = found
    active.value = 0
    loading.value = false
    open.value = true
  }, 180)
})

useClickOutside(root, () => (open.value = false))

function choose(security) {
  if (props.selected.includes(security.symbol)) return
  emit('select', security)
  query.value = ''
  results.value = []
  input.value?.focus()
}

function onEnter() {
  if (isBulk.value) {
    emit('bulk', tokens.value)
    query.value = ''
    return
  }
  const pick = results.value[active.value]
  if (pick) choose(pick)
}

function onKeydown(event) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    open.value = true
    active.value = Math.min(active.value + 1, results.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    active.value = Math.max(active.value - 1, 0)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    onEnter()
  } else if (event.key === 'Escape') {
    open.value = false
  }
}
</script>

<template>
  <div ref="root" class="ticker">
    <div class="ticker__field">
      <Search :size="19" class="ticker__icon" />
      <input
        ref="input"
        v-model="query"
        class="input ticker__input"
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-controls="ticker-results"
        :aria-expanded="Boolean(showList)"
        :placeholder="placeholder"
        autocomplete="off"
        spellcheck="false"
        @focus="open = true"
        @keydown="onKeydown"
      />
      <LoaderCircle v-if="loading" :size="18" class="ticker__loading" />
    </div>

    <p v-if="isBulk && tokens.length" class="ticker__bulk">
      Press <kbd>Enter</kbd> to add <strong>{{ tokens.join(', ') }}</strong>
    </p>

    <Transition name="pop">
      <ul v-if="showList" id="ticker-results" class="ticker__list" role="listbox">
        <li v-for="(sec, index) in results" :key="sec.symbol" role="option" :aria-selected="index === active">
          <button
            type="button"
            class="ticker__option"
            :class="{ 'is-active': index === active, 'is-added': selected.includes(sec.symbol) }"
            @mousedown.prevent="choose(sec)"
            @mouseenter="active = index"
          >
            <SecurityLogo :symbol="sec.symbol" :name="sec.name" :color="sec.color" :type="sec.type" :size="34" />
            <span class="ticker__text">
              <span class="ticker__symbol">{{ sec.symbol }}</span>
              <span class="ticker__name">{{ sec.name }} · {{ sec.sector }}</span>
            </span>
            <span v-if="sec.type === 'etf'" class="badge badge-etf">ETF</span>
            <span class="ticker__add">
              <Check v-if="selected.includes(sec.symbol)" :size="17" />
              <Plus v-else :size="17" />
            </span>
          </button>
        </li>
        <li v-if="!results.length" class="ticker__empty">
          No matches for “{{ query.trim() }}”. Try a ticker like NOVA, or a word like “clean”.
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.ticker {
  position: relative;
}
.ticker__field {
  position: relative;
}
.ticker__icon {
  position: absolute;
  top: 50%;
  left: 18px;
  transform: translateY(-50%);
  color: var(--subtle);
  pointer-events: none;
}
.ticker__input {
  height: 56px;
  padding-left: 48px;
  padding-right: 44px;
  font-size: 16px;
  border-radius: 18px;
}
.ticker__loading {
  position: absolute;
  top: 50%;
  right: 16px;
  margin-top: -9px;
  color: var(--subtle);
  animation: spin 0.8s linear infinite;
}
.ticker__bulk {
  margin-top: 8px;
  font-size: 13.5px;
  color: var(--muted);
}
.ticker__bulk kbd {
  padding: 1px 6px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  background: var(--surface);
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
}
.ticker__list {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 30;
  max-height: 360px;
  overflow-y: auto;
  padding: 6px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 20px;
  box-shadow: var(--shadow-lg);
}
.ticker__option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 14px;
  text-align: left;
}
.ticker__option.is-active {
  background: var(--surface-muted);
}
.ticker__option.is-added {
  opacity: 0.6;
  cursor: default;
}
.ticker__text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.ticker__symbol {
  font-weight: 750;
}
.ticker__name {
  font-size: 13px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ticker__add {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--brand-50);
  color: var(--brand-700);
}
.ticker__empty {
  padding: 16px 12px;
  font-size: 14px;
  color: var(--muted);
}
</style>
