<script setup>
import { ArrowRight, Info, RotateCcw, Sparkles } from '@lucide/vue'
import { computed } from 'vue'
import BacktestCard from './BacktestCard.vue'
import BasketList from './BasketList.vue'
import ClaimList from './ClaimList.vue'
import CounterArguments from './CounterArguments.vue'

const props = defineProps({
  preview: { type: Object, required: true },
  authed: { type: Boolean, default: false },
  continuing: { type: Boolean, default: false },
})
const emit = defineEmits(['continue', 'reset'])

const holdUp = computed(() => props.preview.claims.filter((c) => c.status === 'supported').length)
</script>

<template>
  <article class="preview">
    <header class="preview__head">
      <div class="preview__labels">
        <span class="preview__badge"><Sparkles :size="14" /> Copilot draft</span>
        <span class="topic-chip">Climate · {{ preview.topic.label }}</span>
      </div>
      <button type="button" class="btn btn-secondary btn-sm" @click="emit('reset')"><RotateCcw :size="15" /> Try another idea</button>
    </header>

    <p class="preview__idea">Your take: “{{ preview.idea }}”</p>
    <h2 class="preview__title">{{ preview.title }}</h2>
    <p class="preview__statement">{{ preview.statement }}</p>
    <p v-if="preview.notice" class="callout callout-sun preview__notice"><Info :size="17" /> {{ preview.notice }}</p>

    <div class="preview__grid">
      <section class="panel">
        <p class="panel__title">
          What must be true
          <span class="panel__meta">{{ holdUp }} of {{ preview.claims.length }} hold up</span>
        </p>
        <ClaimList :claims="preview.claims" compact />
      </section>
      <section class="panel">
        <p class="panel__title">
          Most exposed companies
          <span class="panel__meta">{{ preview.basket.length }} in the basket</span>
        </p>
        <BasketList :basket="preview.basket" compact />
      </section>
      <section class="panel">
        <p class="panel__title">Strongest arguments against</p>
        <CounterArguments :items="preview.counterarguments" :limit="2" />
      </section>
      <section class="panel">
        <BacktestCard :backtest="preview.backtest" compact />
      </section>
    </div>

    <footer class="preview__foot">
      <div>
        <p class="preview__next">
          Next: push back on the copilot, swap companies, get the community’s take, then invest from $10.
        </p>
        <p class="preview__legal">Illustrative demo data. Not investment advice.</p>
      </div>
      <button type="button" class="btn btn-primary btn-shout preview__cta" :disabled="continuing" @click="emit('continue')">
        <span v-if="continuing" class="spinner" />
        {{ authed ? 'Open in my workshop' : 'Save it and keep workshopping' }}
        <ArrowRight v-if="!continuing" :size="18" />
      </button>
    </footer>
  </article>
</template>

<style scoped>
.preview {
  padding: 28px;
  border: var(--outline);
  border-radius: 30px;
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-lg);
  text-align: left;
}
.preview__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.preview__labels {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.preview__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  border: 1.5px solid var(--ink-solid);
  border-radius: var(--radius-pill);
  background: var(--ink);
  color: var(--cream);
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.preview__badge svg {
  color: var(--sun);
}
.preview__idea {
  margin-top: 20px;
  font-size: 15px;
  font-weight: 600;
  color: var(--muted);
}
.preview__title {
  margin-top: 8px;
  font-size: clamp(34px, 4.2vw, 52px);
}
.preview__statement {
  max-width: 820px;
  margin-top: 12px;
  font-size: 17px;
  line-height: 1.55;
  color: var(--ink-2);
}
.preview__notice {
  margin-top: 16px;
}
.preview__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;
}
.panel {
  min-width: 0;
  padding: 18px;
  border: var(--outline-thin);
  border-radius: 20px;
  background: var(--surface-muted);
}
.panel__title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
  font-weight: 750;
}
.panel__meta {
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--deep-violet);
}
.preview__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
  margin-top: 26px;
  padding-top: 22px;
  border-top: 2px dashed var(--ink-solid);
}
.preview__next {
  max-width: 520px;
  font-weight: 650;
}
.preview__legal {
  margin-top: 4px;
  font-family: var(--font-mono);
  font-size: 11.5px;
  letter-spacing: 0.04em;
  color: var(--subtle);
}
.preview__cta {
  --btn-h: 60px;
  font-size: 23px;
}
@media (max-width: 900px) {
  .preview__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 640px) {
  .preview {
    padding: 20px;
    border-radius: 24px;
  }
  .panel {
    padding: 14px;
  }
  .preview__foot .btn {
    width: 100%;
    white-space: normal;
    text-align: center;
  }
  .preview__cta {
    --btn-h: auto;
    min-height: 58px;
    padding: 10px 18px;
    font-size: 20px;
    line-height: 1.05;
  }
}
</style>
