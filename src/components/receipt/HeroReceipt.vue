<script setup>
// The landing page's example receipt. It prints itself on load: the printer buzzes,
// the paper feeds out, the fields type out, the total counts up and the stamp lands.
import { useCountUp, useTypewriter } from '@/composables/useReceiptFx'
import { BRAND_NAME } from '@/config/brand'
import { checkFund } from '@/utils/lines'
import ReceiptPrinter from './ReceiptPrinter.vue'

const SAMPLE_LINES = ['oil', 'pay', 'senators']
const MAX_ROWS = 4

const { fund, crossers, crossingPct } = checkFund('VOO', SAMPLE_LINES)
const rows = crossers.slice(0, MAX_ROWS)
const more = crossers.length - rows.length

const fundField = useTypewriter(`${fund.symbol} · ${fund.holdingsCount} HOLDINGS`, { delay: 1500, speed: 32 })
const linesField = useTypewriter(SAMPLE_LINES.join(' · ').toUpperCase(), { delay: 1950, speed: 32 })
const total = useCountUp(crossingPct, { delay: 1000, duration: 900 })
</script>

<template>
  <aside class="receipt" aria-label="Example receipt (sample data)">
    <ReceiptPrinter />
    <div class="receipt-paper">
      <header class="rc-head">
        <p class="rc-logo">{{ BRAND_NAME.toUpperCase() }}</p>
        <p class="rc-sub">CONFLICT RECEIPT</p>
      </header>

      <dl class="rc-meta">
        <div>
          <dt>FUND</dt>
          <dd :class="{ typing: fundField.typing.value }">{{ fundField.text.value }}</dd>
        </div>
        <div>
          <dt>LINES</dt>
          <dd :class="{ typing: linesField.typing.value }">{{ linesField.text.value }}</dd>
        </div>
      </dl>

      <ul class="rc-items">
        <li v-for="(row, i) in rows" :key="row.symbol" :style="{ '--i': i }">
          <span class="rc-tick">{{ row.symbol }}</span>
          <span class="rc-what">
            <span class="rc-name">{{ row.name }}</span>
            <span class="rc-note">{{ row.crossed[0].reason }}</span>
          </span>
          <b>{{ row.weight.toFixed(1) }}%</b>
        </li>
        <li v-if="more > 0" class="rc-more" :style="{ '--i': rows.length }">+ {{ more }} more</li>
      </ul>

      <div class="rc-total">
        <span>CROSSES YOUR LINES</span>
        <b>{{ total.toFixed(1) }}%</b>
      </div>
      <p class="rc-dollars">
        = <b>${{ Math.round(total * 100).toLocaleString('en-US') }}</b> of every $10K
      </p>

      <div class="rc-barcode" aria-hidden="true"></div>
      <p class="rc-foot">SAMPLE DATA · NO JUDGMENT · JUST RECEIPTS</p>
      <span class="rc-stamp" aria-hidden="true">NO JUDGMENT</span>
    </div>
  </aside>
</template>

<style scoped>
.receipt {
  position: absolute;
  top: 64px;
  right: 24px;
  z-index: 1;
  width: 310px;
  transform: rotate(3deg);
  transform-origin: 50% 0;
  filter: drop-shadow(0 3px 0 var(--ink-solid)) drop-shadow(7px 7px 0 var(--ink-solid));
  pointer-events: none;
}
.receipt .receipt-paper {
  animation: rc-feed 1.3s cubic-bezier(0.45, 0.05, 0.3, 1) both 0.4s;
}
.receipt :deep(.rc-printer) {
  animation: rc-buzz 1.3s linear both 0.4s;
}
.receipt :deep(.rc-led) {
  animation: rc-led 1.5s steps(2, jump-none) both 0.4s;
}
.receipt .rc-items li {
  animation: rc-line-in 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.2) both calc(1.1s + var(--i, 0) * 0.12s);
}
.receipt .rc-stamp {
  animation-delay: 2.2s;
}

/* Scale up on larger screens, pivoting from the top-right corner so it keeps clear of the headline. */
@media (min-width: 1101px) {
  .receipt {
    transform: rotate(3deg) scale(1.1);
    transform-origin: 100% 0;
  }
}
@media (min-width: 1500px) {
  .receipt {
    transform: rotate(3deg) scale(1.3);
  }
}
@media (max-width: 1100px) {
  /* Centred and pivoted on its middle so the tilted paper never swings past the page edge. */
  .receipt {
    position: relative;
    top: auto;
    right: auto;
    align-self: center;
    width: min(310px, calc(100% - 28px));
    margin: 4px 0 24px;
    transform: rotate(2deg);
    transform-origin: 50% 50%;
  }
}
</style>
