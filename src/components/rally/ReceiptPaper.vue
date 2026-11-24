<script setup>
// The cream receipt from the Figma frames. One component covers the full receipt, the
// "still printing" skeleton (first visit, scanning) and the muted copy that sits behind it.
import { BRAND_NAME } from '@/config/brand'

defineProps({
  subtitle: { type: String, default: 'Conflict receipt' },
  // [{ label, value }] label left (muted), value right
  meta: { type: Array, default: () => [] },
  // [{ name, note, value }]
  items: { type: Array, default: () => [] },
  more: { type: String, default: '' },
  // { label, note, value, tone: 'flare' | 'ink' }
  total: { type: Object, default: null },
  // [{ label, value }] rows after the total ("Passes your lines")
  after: { type: Array, default: () => [] },
  footer: { type: String, default: '' },
  barcode: { type: Boolean, default: true },
  // Skeleton: grey bars instead of rows, with a note at the bottom
  skeleton: { type: Boolean, default: false },
  skeletonRows: { type: Number, default: 3 },
  note: { type: String, default: '' },
  // The faded receipt behind the front one
  behind: { type: Boolean, default: false },
  flat: { type: Boolean, default: false },
  // The 416px receipt used inside the app: slightly tighter than the 448px landing one
  compact: { type: Boolean, default: false },
})

// Bar widths from the Figma barcode, in px.
const BARS = [3, 1, 4, 1, 2, 5, 1, 3, 2, 1, 4, 2, 1, 1, 5, 2, 1, 3, 1, 4, 2, 1, 5, 1, 2, 3, 1, 4, 1, 2, 3, 1, 5, 2, 1, 3]
const SKELETON_WIDTHS = [42, 53, 33, 47, 38]
</script>

<template>
  <div class="paper" :class="{ 'is-behind': behind, 'is-flat': flat || behind, 'is-compact': compact }">
    <div class="paper__content">
      <p class="paper__logo">{{ BRAND_NAME.toUpperCase() }}</p>
      <p class="paper__sub">{{ subtitle }}</p>
      <hr />

      <template v-if="meta.length">
        <div v-for="(row, i) in meta" :key="i" class="paper__row">
          <span class="paper__label">{{ row.label }}</span>
          <span class="paper__value">{{ row.value }}</span>
        </div>
        <hr />
      </template>

      <template v-if="skeleton">
        <div v-for="n in skeletonRows" :key="n" class="paper__row paper__ghost" aria-hidden="true">
          <span class="skeleton" :style="{ width: `${SKELETON_WIDTHS[(n - 1) % SKELETON_WIDTHS.length]}%` }" />
          <span class="skeleton" style="width: 12%" />
        </div>
        <slot name="skeleton-extra" />
        <p v-if="note" class="paper__note">{{ note }}</p>
      </template>

      <template v-else>
        <div v-for="(item, i) in items" :key="i" class="paper__row">
          <span class="paper__stack">
            <span class="paper__name">{{ item.name }}</span>
            <span v-if="item.note" class="paper__reason">{{ item.note }}</span>
          </span>
          <span class="paper__amount">{{ item.value }}</span>
        </div>
        <p v-if="more" class="paper__label paper__more">{{ more }}</p>
        <hr v-if="items.length || more" />

        <div v-if="total" class="paper__row paper__total">
          <span class="paper__stack">
            <span class="paper__name">{{ total.label }}</span>
            <span v-if="total.note" class="paper__reason">{{ total.note }}</span>
          </span>
          <span class="paper__figure" :class="`is-${total.tone ?? 'flare'}`">{{ total.value }}</span>
        </div>
        <div v-for="(row, i) in after" :key="i" class="paper__row">
          <span class="paper__name">{{ row.label }}</span>
          <span class="paper__amount">{{ row.value }}</span>
        </div>
        <hr v-if="total || after.length" />

        <div v-if="barcode" class="paper__barcode" aria-hidden="true">
          <span v-for="(w, i) in BARS" :key="i" :style="{ width: `${w}px` }" />
        </div>
        <p v-if="footer" class="paper__foot">{{ footer }}</p>
      </template>
    </div>
    <div class="paper__edge" aria-hidden="true" />
  </div>
</template>

<style scoped>
.paper {
  --paper-ground: var(--ink);
  display: flex;
  flex-direction: column;
  width: var(--paper-width, 448px);
  max-width: 100%;
  padding-top: 38px;
  overflow: hidden;
  border-radius: 6px 6px 0 0;
  background: var(--cream);
  color: var(--ink);
  box-shadow: var(--shadow-paper);
  font-family: var(--font-mono);
}
.paper.is-flat {
  box-shadow: none;
}
.paper.is-behind {
  background: var(--paper-shade);
}
.paper.is-behind .paper__content {
  opacity: 0.3;
}
.paper__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: 0 32px 30px;
}
.paper__content > * {
  width: 100%;
}
.paper hr {
  height: 0;
  border: 0;
  border-top: 1px dashed var(--ink);
}
.paper__logo {
  font-family: var(--font-display);
  font-size: 48px;
  line-height: 72px;
  letter-spacing: 0.02em;
  text-align: center;
}
.paper__sub {
  margin-top: -18px;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: center;
  color: var(--muted-ink);
}
.paper__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.paper__label {
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted-ink);
}
.paper__value {
  font-size: 13px;
  font-weight: 500;
  line-height: 17px;
  text-align: right;
}
.paper__stack {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.paper__name,
.paper__amount {
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  text-transform: uppercase;
}
.paper__name {
  letter-spacing: 0.02em;
}
.paper__amount {
  white-space: nowrap;
}
.paper__reason {
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  color: var(--muted-ink);
}
.paper__total {
  align-items: center;
}
.paper__figure {
  font-family: var(--font-display);
  font-size: 60px;
  line-height: 1;
  white-space: nowrap;
}
.paper__figure.is-flare {
  color: var(--flare);
}
.paper__barcode {
  display: flex;
  justify-content: center;
  gap: 3px;
  height: 46px;
}
.paper__barcode span {
  background: var(--ink);
}
.paper__foot,
.paper__note {
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-align: center;
  color: var(--muted-ink);
}
.paper__ghost span {
  height: 12px;
  border-radius: 6px;
  --skeleton-base: var(--paper-ghost);
  --skeleton-highlight: rgba(255, 255, 255, 0.68);
}
.paper.is-compact {
  width: var(--paper-width, 416px);
  padding-top: 36px;
}
.is-compact .paper__content {
  padding: 0 30px 28px;
}
.is-compact .paper__logo {
  font-size: 44px;
  line-height: 66px;
}
.is-compact .paper__figure {
  font-size: 56px;
}
.is-compact .paper__note {
  line-height: 1.6;
}
.is-compact .paper__edge {
  background-position-x: 0;
}
/* Scalloped bottom edge: half-circles of the page colour biting into the paper */
.paper__edge {
  height: 9px;
  background: radial-gradient(circle at 50% 100%, var(--paper-ground) 9px, transparent 9.5px) 3px 0 / 26px 9px repeat-x;
}
</style>
