<script setup>
import { communityService } from '@/api'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import { Search } from '@lucide/vue'
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  topic: { type: String, default: null },
  exclude: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Search by company, ticker or industry' },
  busySymbol: { type: String, default: null },
  actionLabel: { type: String, default: 'Add' },
})
const emit = defineEmits(['select'])

const query = ref('')
const results = ref([])
const loading = ref(false)
const active = ref(0)
let timer = null
let sequence = 0

watch(query, (q) => {
  clearTimeout(timer)
  if (!q.trim()) {
    results.value = []
    return
  }
  timer = setTimeout(async () => {
    const mine = ++sequence
    loading.value = true
    try {
      const found = await communityService.searchCompanies(q.trim(), props.topic)
      // Ignore stale responses from earlier keystrokes.
      if (mine === sequence) {
        results.value = found
        active.value = 0
      }
    } finally {
      if (mine === sequence) loading.value = false
    }
  }, 180)
})
onBeforeUnmount(() => clearTimeout(timer))

function choose(company) {
  if (props.exclude.includes(company.symbol)) return
  emit('select', company)
}

function onKeydown(event) {
  if (!results.value.length) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    active.value = (active.value + 1) % results.value.length
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    active.value = (active.value - 1 + results.value.length) % results.value.length
  } else if (event.key === 'Enter') {
    event.preventDefault()
    choose(results.value[active.value])
  }
}
</script>

<template>
  <div class="picker">
    <label class="picker__field">
      <Search :size="17" class="picker__icon" />
      <input v-model="query" class="input picker__input" :placeholder="placeholder" aria-label="Search companies" @keydown="onKeydown" />
      <span v-if="loading" class="spinner picker__spinner" />
    </label>
    <ul v-if="results.length" class="picker__results" role="listbox">
      <li v-for="(company, i) in results" :key="company.symbol" role="option" :aria-selected="i === active">
        <button
          type="button"
          class="picker__item"
          :class="{ 'is-active': i === active }"
          :disabled="exclude.includes(company.symbol) || Boolean(busySymbol)"
          @click="choose(company)"
          @mouseenter="active = i"
        >
          <SecurityLogo :symbol="company.symbol" :name="company.name" :color="company.color" :size="34" />
          <span class="picker__text">
            <span class="picker__name">{{ company.name }} <span class="picker__ticker">{{ company.symbol }}</span></span>
            <span class="picker__sector">{{ company.sector }}<template v-if="company.exposure !== null"> · {{ company.exposure }}% tied to this idea</template></span>
          </span>
          <span v-if="busySymbol === company.symbol" class="spinner" />
          <span v-else class="picker__action">{{ exclude.includes(company.symbol) ? 'In basket' : actionLabel }}</span>
        </button>
      </li>
    </ul>
    <p v-else-if="query.trim() && !loading" class="picker__empty">No companies match “{{ query.trim() }}”.</p>
  </div>
</template>

<style scoped>
.picker__field {
  position: relative;
  display: block;
}
.picker__icon {
  position: absolute;
  top: 50%;
  left: 15px;
  transform: translateY(-50%);
  color: var(--subtle);
}
.picker__input {
  padding-left: 42px;
}
.picker__spinner {
  position: absolute;
  top: 50%;
  right: 15px;
  margin-top: -9px;
  color: var(--brand-500);
}
.picker__results {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 8px;
  max-height: 260px;
  overflow-y: auto;
}
.picker__item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 10px;
  border: 2px solid transparent;
  border-radius: 12px;
  text-align: left;
}
.picker__item.is-active,
.picker__item:hover:not(:disabled) {
  border-color: var(--ink-solid);
  background: var(--sun-100);
}
.picker__item:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.picker__text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  line-height: 1.35;
}
.picker__name {
  font-weight: 700;
  font-size: 14.5px;
}
.picker__ticker {
  font-size: 12px;
  color: var(--subtle);
}
.picker__sector {
  font-size: 12.5px;
  color: var(--muted);
}
.picker__action {
  font-size: 13px;
  font-weight: 700;
  color: var(--brand-700);
}
.picker__empty {
  margin-top: 10px;
  font-size: 14px;
  color: var(--muted);
}
</style>
