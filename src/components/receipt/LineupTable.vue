<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  result: { type: Object, required: true },
  note: { type: String, default: '' },
})
const open = ref(null)
const toggle = (symbol) => (open.value = open.value === symbol ? null : symbol)
// Bar width scaled to the biggest slice in the lineup (rows are sorted flagged-first, not by size).
const maxWeight = computed(() => Math.max(1e-9, ...props.result.lineup.map((r) => r.weight)))
const barWidth = (weight) => `${Math.max(8, (weight / maxWeight.value) * 100)}%`
</script>

<template>
  <div class="lineup sticker">
    <div class="lineup__head">
      <h2 class="h-2">The lineup. <span class="lineup__blue">Names, slices, receipts.</span></h2>
      <p v-if="note" class="label-mono lineup__note">{{ note }}</p>
    </div>
    <div class="lineup__scroll">
      <div class="lineup__grid lineup__labels label-mono">
        <span>Who you're bankrolling <span class="pink-ink">(made-up names, real patterns)</span></span>
        <span>Your slice</span>
        <span>The problem</span>
      </div>
      <div
        v-for="row in result.lineup"
        :key="row.symbol"
        class="lineup__row"
        :class="{ 'is-flagged': row.crossed.length }"
        :style="row.crossed.length ? { background: row.crossed[0].tint } : null"
      >
        <div class="lineup__grid">
          <div class="who">
            <span class="who__tick">{{ row.symbol }}</span>
            <RouterLink :to="`/company/${row.symbol}`" class="who__name">{{ row.name }}</RouterLink>
          </div>
          <div class="slice">
            <span class="slice__pct">{{ row.weight.toFixed(1) }}%</span>
            <span class="slice__bar"><span :style="{ width: barWidth(row.weight), background: row.crossed[0]?.bg ?? 'var(--cream)' }" /></span>
          </div>
          <div class="problem">
            <template v-if="row.crossed.length">
              <span v-for="line in row.crossed" :key="line.key" class="problem__chip" :style="{ background: line.bg, color: line.fg }">
                {{ line.reason }}
              </span>
              <button type="button" class="problem__link" :aria-expanded="open === row.symbol" @click="toggle(row.symbol)">
                {{ open === row.symbol ? 'Hide receipts' : 'Receipts →' }}
              </button>
            </template>
            <span v-else class="passes">Passes your lines</span>
          </div>
        </div>
        <ul v-if="open === row.symbol" class="receipts">
          <li v-for="line in row.crossed" :key="line.key">
            <span class="receipts__tag" :style="{ background: line.bg, color: line.fg }">{{ line.label }}</span>
            {{ line.receipt }}
          </li>
          <li class="receipts__more"><RouterLink :to="`/company/${row.symbol}`">See everything on {{ row.name }} →</RouterLink></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pink-ink {
  color: var(--bubblegum);
}
.lineup {
  background: var(--cream);
  color: var(--ink);
  overflow: hidden;
  box-shadow: 12px 12px 0 var(--ink-solid);
}
.lineup__head {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 28px 28px 20px;
}
.lineup__head h2 {
  font-size: clamp(36px, 4vw, 76px);
  line-height: 0.92;
}
.lineup__blue {
  color: var(--signal);
}
.lineup__note {
  color: var(--muted);
}
.lineup__scroll {
  overflow-x: auto;
}
.lineup__grid {
  display: grid;
  grid-template-columns: 2.1fr 1.5fr 2.2fr;
  gap: 16px;
  align-items: center;
  min-width: 860px;
}
.lineup__labels {
  padding: 14px 28px;
  background: var(--ink-solid);
  color: var(--cream);
  min-width: 916px;
}
.lineup__row {
  padding: 18px 28px;
  border-top: 3px solid var(--ink-solid);
  min-width: 916px;
}
.who {
  display: flex;
  align-items: center;
  gap: 14px;
}
.who__tick {
  font-family: var(--font-display);
  font-size: 18px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 2px solid var(--ink-solid);
}
.is-flagged .who__tick {
  background: var(--ink-solid);
  color: var(--sun);
}
.who__name {
  font-size: 19px;
  font-weight: 600;
}
.who__name:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.slice {
  display: flex;
  align-items: center;
  gap: 12px;
}
.slice__pct {
  font-family: var(--font-display);
  font-size: 30px;
  width: 78px;
}
.slice__bar {
  flex: 1;
  max-width: 220px;
}
.slice__bar span {
  display: block;
  height: 20px;
  border: 2px solid var(--ink-solid);
  border-radius: 999px;
}
.problem {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.problem__chip {
  font-size: 16px;
  font-weight: 700;
  padding: 8px 16px;
  border: 2px solid var(--ink-solid);
  border-radius: 999px;
}
.problem__link {
  font-weight: 700;
  font-size: 15px;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.passes {
  font-size: 17px;
  font-weight: 600;
  color: var(--ink-2);
}
.receipts {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px;
  border: 2px solid var(--ink-solid);
  border-radius: 14px;
  background: var(--surface);
  font-size: 15.5px;
}
.receipts__tag {
  display: inline-block;
  margin-right: 8px;
  padding: 2px 10px;
  border: 2px solid var(--ink-solid);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}
.receipts__more a {
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* Too narrow for the table: stack each row as a card instead of side-scrolling. */
@media (max-width: 960px) {
  .lineup__scroll {
    overflow-x: visible;
  }
  .lineup__labels {
    display: none;
  }
  .lineup__grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    min-width: 0;
  }
  .lineup__row {
    min-width: 0;
    padding: 16px 18px;
  }
  .lineup__head {
    padding: 22px 18px 16px;
  }
  .who__name {
    font-size: 17px;
    line-height: 1.2;
  }
  .slice {
    gap: 10px;
  }
  .slice__pct {
    flex: none;
    width: 62px;
    font-size: 28px;
    line-height: 36px;
  }
  .problem__chip {
    font-size: 15px;
    padding: 6px 14px;
  }
}
@media (max-width: 560px) {
  .lineup {
    border-radius: 22px;
    box-shadow: 6px 6px 0 var(--ink-solid);
  }
}
</style>
