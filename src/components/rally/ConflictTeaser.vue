<script setup lang="ts">
// What a visitor gets before signing up: one line (how many holdings conflict, and how many
// dollars), then a prompt to create a free account for the breakdown. Email only, simulated.
// No holdings and no per-category detail appear here.
import ReceiptPaper from '@/components/rally/ReceiptPaper.vue'
import type { ConflictSummary } from '@/composables/useHoldingsCheck'
import { useDemoStore } from '@/state/demo'
import { plural, usd } from '@/utils/format'
import { computed, ref } from 'vue'

const props = defineProps<{
  summary: ConflictSummary
  /** What was checked, for the label: "SPY" or "VOO, NVDA, AAPL" */
  name: string
  categories: number
}>()
const emit = defineEmits<{ created: [] }>()

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const demo = useDemoStore()
const email = ref('')
const invalid = ref(false)

// With no lines picked nothing was checked, which is not the same as a clean result.
const unchecked = computed(() => props.categories === 0)
const clean = computed(() => !unchecked.value && props.summary.count === 0)

function create() {
  if (!EMAIL.test(email.value.trim())) {
    invalid.value = true
    return
  }
  demo.createAccount(email.value)
  emit('created')
}
</script>

<template>
  <section class="teaser card" aria-live="polite">
    <div class="teaser__main">
      <p class="label-mono">Result · {{ name }} · {{ usd(summary.totalUsd) }} · sample data</p>
      <h2 v-if="unchecked" class="teaser__line is-unchecked">No lines picked.</h2>
      <h2 v-else class="teaser__line" :class="{ 'is-clean': clean }">{{ plural(summary.count, 'holding') }} {{ summary.count === 1 ? 'conflicts' : 'conflict' }}.</h2>
      <p class="teaser__sub">
        <template v-if="unchecked">Nothing was checked, so this is not a clean result. Switch on at least one line and the count appears.</template>
        <template v-else-if="clean">Nothing in it is tagged in the {{ plural(categories, 'category', 'categories') }} you picked. That’s this check, not a promise forever.</template>
        <template v-else>{{ usd(summary.usd) }} of your portfolio sits in companies tagged in the {{ plural(categories, 'category', 'categories') }} you picked.</template>
      </p>

      <div v-if="demo.account" class="teaser__signup">
        <p class="teaser__ask">You have a free account. The breakdown is ready.</p>
        <button type="button" class="btn btn-primary" @click="$emit('created')">See the breakdown →</button>
      </div>
      <form v-else class="teaser__signup" novalidate @submit.prevent="create">
        <p class="teaser__ask">
          <strong>Which ones, and why?</strong> Create a free account to see every holding, the reason it was flagged and the source. Email only. No brokerage
          link.
        </p>
        <div class="teaser__row">
          <label class="sr-only" for="teaser-email">Email</label>
          <input
            id="teaser-email"
            v-model="email"
            type="email"
            class="input teaser__email"
            :class="{ 'is-invalid': invalid }"
            placeholder="you@example.com"
            autocomplete="email"
            :aria-invalid="invalid || undefined"
            :aria-describedby="invalid ? 'teaser-email-error' : undefined"
            @input="invalid = false"
          />
          <button type="submit" class="btn btn-primary">Create free account</button>
        </div>
        <p v-if="invalid" id="teaser-email-error" class="field-error" role="alert">Enter an email address, like you@example.com.</p>
        <p class="small">Simulated for the demo: nothing is sent, and the address stays in this browser.</p>
      </form>
    </div>

    <ReceiptPaper
      class="teaser__receipt"
      compact
      flat
      skeleton
      :subtitle="`Conflict receipt · ${name}`"
      :meta="[{ label: 'Holdings', value: String(summary.holdings) }]"
      note="Your receipt prints when you create a free account."
      aria-hidden="true"
    />
  </section>
</template>

<style scoped>
.teaser {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  padding: 36px 40px;
  text-align: left;
}
.teaser__main {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
}
.teaser__line {
  font-size: clamp(64px, 6.7vw, 96px);
  line-height: 1;
}
.teaser__line.is-clean {
  color: var(--pass);
}
.teaser__line.is-unchecked {
  color: var(--text-muted);
}
.teaser__sub {
  font-size: 20px;
  line-height: 1.5;
  color: var(--text-muted);
}
.teaser__signup {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  margin-top: 10px;
  padding-top: 22px;
  border-top: 1px solid var(--hairline);
}
.teaser__ask {
  font-size: 17px;
  line-height: 1.5;
}
.teaser__ask strong {
  font-weight: 600;
}
.teaser__row {
  display: flex;
  gap: 12px;
  width: 100%;
  max-width: 560px;
}
.teaser__email {
  flex: 1 1 0;
  height: 50px;
  border-radius: var(--radius-pill);
  padding: 0 22px;
}
.teaser__receipt {
  --paper-width: 360px;
  flex: none;
  transform: rotate(1.5deg);
}
@media (max-width: 1180px) {
  .teaser__receipt {
    display: none;
  }
}
</style>
