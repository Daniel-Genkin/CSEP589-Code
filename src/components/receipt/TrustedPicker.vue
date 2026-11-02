<script setup>
// "Borrow someone's lines": one tap copies a trusted profile's lines.
// Profiles are made-up samples; real creators and nonprofits would publish their own.
import { LINE_MAP, TRUSTED_PROFILES } from '@/utils/lines'

const model = defineModel({ type: Array, required: true })
const isActive = (profile) => profile.lines.length === model.value.length && profile.lines.every((k) => model.value.includes(k))
</script>

<template>
  <div class="trusted">
    <p class="label-mono trusted__label">Or borrow someone's lines</p>
    <div class="trusted__row">
      <button
        v-for="p in TRUSTED_PROFILES"
        :key="p.key"
        type="button"
        class="profile sticker"
        :class="{ 'is-on': isActive(p) }"
        :style="{ background: p.bg, color: p.fg ?? '#17161D' }"
        :aria-pressed="isActive(p)"
        @click="model = [...p.lines]"
      >
        <span class="profile__name">{{ p.name }}</span>
        <span class="profile__kind">{{ p.kind }}</span>
        <span class="profile__lines">{{ p.lines.map((k) => LINE_MAP[k].label).join(' · ') }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.trusted {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.trusted__label {
  color: var(--cream);
}
.trusted__row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.profile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 12px 18px;
  border-radius: 18px;
  box-shadow: var(--shadow-sm);
  text-align: left;
  transition: transform 0.15s var(--ease);
}
.profile:hover {
  transform: translate(-2px, -2px);
}
.profile.is-on {
  outline: 3px solid var(--cream);
  outline-offset: 3px;
}
.profile__name {
  font-family: var(--font-display);
  font-size: 22px;
  line-height: 1.05;
  text-transform: uppercase;
}
.profile__kind {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.85;
}
.profile__lines {
  font-size: 13.5px;
  font-weight: 600;
}
</style>
