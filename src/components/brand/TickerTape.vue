<script setup>
// The ticker tape: reads like a stock ticker. Symbol, slice of the fund, and ▼ red when
// it crosses one of your lines / ▲ green when it's clear. Follows the fund and lines
// picked on the page. Sample data, made-up companies.
import { BRAND_NAME } from '@/config/brand'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

const props = defineProps({
  result: { type: Object, required: true },
})

const SPEED = 110 // px/second
const COPIES = 4 // enough track to fill very wide screens; the loop slides by one copy
const SLOGANS = ['No judgment', 'Just receipts', 'Your money', 'Your lines']

const items = computed(() => {
  const { fund, lineup, crossingPct } = props.result
  const quotes = lineup.map((row) => ({
    sym: row.symbol,
    val: row.weight,
    down: row.crossed.length > 0,
    chg: row.crossed.length ? row.crossed[0].key.toUpperCase() : 'CLEAR',
  }))
  quotes.push({ sym: fund.symbol, val: crossingPct, down: crossingPct > 0, chg: crossingPct > 0 ? 'CROSSES YOUR LINES' : 'CLEAR' })

  // A slogan after every two quotes, as a break in the tape.
  const out = []
  let slogan = 0
  quotes.forEach((quote, i) => {
    out.push(quote)
    if (i % 2 === 1 && slogan < SLOGANS.length) out.push({ slogan: SLOGANS[slogan++] })
  })
  while (slogan < SLOGANS.length) out.push({ slogan: SLOGANS[slogan++] })
  return out
})

const firstTrack = useTemplateRef('tracks')
const duration = ref('40s')
let observer

onMounted(() => {
  const track = firstTrack.value?.[0]
  if (!track || !('ResizeObserver' in window)) return
  // Keep the speed constant as fonts load and the tape's contents change.
  observer = new ResizeObserver(() => {
    duration.value = `${track.getBoundingClientRect().width / SPEED}s`
  })
  observer.observe(track)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="tape" aria-hidden="true">
    <span class="tape__live"><span class="tape__dot"></span>{{ BRAND_NAME.toUpperCase() }} TAPE</span>
    <div class="tape__inner" :style="{ animationDuration: duration }">
      <div v-for="n in COPIES" ref="tracks" :key="n" class="tape__track">
        <template v-for="(item, i) in items" :key="i">
          <span v-if="item.slogan" class="tk-slogan">{{ item.slogan }}</span>
          <span v-else class="tk">
            <b class="tk-sym">{{ item.sym }}</b>
            <span class="tk-val">{{ item.val.toFixed(1) }}%</span>
            <span class="tk-chg" :class="item.down ? 'tk-down' : 'tk-up'">{{ item.down ? '▼' : '▲' }} {{ item.chg }}</span>
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tape {
  position: relative;
  z-index: 2;
  width: calc(100% + 82px);
  margin: -26px -41px 13px;
  padding: 22px 0;
  overflow: clip;
  transform: rotate(-1.5deg);
  background: #0e0d12;
  border-top: 4px solid var(--bubblegum);
  border-bottom: 4px solid var(--bubblegum);
}
/* Faint LED-board scanlines */
.tape::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.28) 0 1px, transparent 1px 3px);
}

/* Fixed "live" tag on the left; the tape slides under it. */
.tape__live {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 41px;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 40px 0 24px;
  background: linear-gradient(90deg, #0e0d12 78%, rgba(14, 13, 18, 0));
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 2.4px;
  color: var(--sun);
  white-space: nowrap;
}
.tape__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ff4f4f;
  box-shadow: 0 0 10px #ff4f4f;
  animation: tape-blink 1.2s steps(1) infinite;
}
@keyframes tape-blink {
  50% {
    opacity: 0.2;
  }
}

.tape__inner {
  display: flex;
  width: max-content;
  animation: tape-slide 40s linear infinite;
}
@keyframes tape-slide {
  to {
    transform: translateX(-25%); /* one of the four copies */
  }
}
.tape__track {
  display: flex;
  align-items: center;
  gap: 44px;
  padding-right: 44px;
  flex: none;
}

.tk,
.tk-slogan {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 30px;
  line-height: 50px;
  white-space: nowrap;
  text-shadow: 0 0 12px currentColor;
}
.tk {
  display: inline-flex;
  align-items: baseline;
  gap: 14px;
  color: var(--cream);
}
.tk-sym {
  font-weight: 600;
  letter-spacing: 1px;
}
.tk-val {
  color: rgba(255, 244, 214, 0.8);
}
.tk-chg {
  font-size: 22px;
  letter-spacing: 1px;
}
.tk-up {
  color: #6fe07f;
}
.tk-down {
  color: #ff5a4e;
}
.tk-slogan {
  padding: 0 18px;
  border-left: 2px solid rgba(255, 244, 214, 0.25);
  border-right: 2px solid rgba(255, 244, 214, 0.25);
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 40px;
  text-transform: uppercase;
  color: var(--sun);
  text-shadow: none;
}

@media (max-width: 900px) {
  .tk,
  .tk-slogan {
    font-size: 22px;
    line-height: 38px;
  }
  .tk-chg {
    font-size: 16px;
  }
  .tk-slogan {
    font-size: 30px;
  }
  .tape__live {
    font-size: 11px;
    letter-spacing: 1.6px;
    gap: 7px;
    padding: 0 28px 0 16px;
  }
}
</style>
