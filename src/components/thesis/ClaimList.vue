<script setup>
import { SOURCES } from '@/utils/thesis'
import { MessageSquareWarning } from '@lucide/vue'
import ClaimStatusBadge from './ClaimStatusBadge.vue'

defineProps({
  claims: { type: Array, required: true },
  compact: { type: Boolean, default: false },
  showChallenges: { type: Boolean, default: false },
})
</script>

<template>
  <ol class="claims" :class="{ 'claims--compact': compact }">
    <li v-for="(claim, i) in claims" :key="claim.id" class="claim">
      <span class="claim__num num">{{ i + 1 }}</span>
      <div class="claim__body">
        <div class="claim__top">
          <p class="claim__text">{{ claim.text }}</p>
          <ClaimStatusBadge :status="claim.status" />
        </div>
        <ul class="claim__checks">
          <li v-for="check in compact ? claim.checks.slice(0, 1) : claim.checks" :key="check.source + check.finding" class="check">
            <span class="check__source">
              <component :is="SOURCES[check.source].icon" :size="14" />
              {{ SOURCES[check.source].label }}
            </span>
            <span class="check__finding">{{ check.finding }}</span>
          </li>
        </ul>
        <p v-if="showChallenges && claim.challenges" class="claim__challenges">
          <MessageSquareWarning :size="14" />
          {{ claim.challenges }} community {{ claim.challenges === 1 ? 'challenge' : 'challenges' }}
        </p>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.claims {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.claim {
  display: flex;
  gap: 14px;
  padding: 16px;
  border: var(--outline-thin);
  border-radius: 18px;
  background: var(--surface);
  color: var(--ink);
}
.claim__num {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border: 1.5px solid var(--ink-solid);
  border-radius: 10px;
  background: var(--sun);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}
.claim__body {
  flex: 1;
  min-width: 0;
}
.claim__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.claim__text {
  font-weight: 700;
  line-height: 1.4;
}
.claim__checks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}
.check {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 10px;
  font-size: 14px;
}
.check__source {
  display: inline-flex;
  align-items: flex-start;
  gap: 6px;
  font-weight: 650;
  color: var(--muted);
  white-space: nowrap;
}
.check__source svg {
  flex-shrink: 0;
  margin-top: 3px;
}
.check__finding {
  color: var(--ink-2);
}
.claim__challenges {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 4px 10px;
  border: 1.5px solid var(--ink-solid);
  border-radius: var(--radius-pill);
  background: var(--lilac-100);
  color: var(--lilac-700);
  font-size: 12.5px;
  font-weight: 700;
}

.claims--compact {
  gap: 8px;
}
.claims--compact .claim {
  padding: 12px 14px;
  border-radius: 16px;
}
.claims--compact .claim__text {
  font-size: 14.5px;
}
.claims--compact .check {
  grid-template-columns: minmax(0, 1fr);
  gap: 2px;
  font-size: 13.5px;
}

@media (max-width: 640px) {
  .claim {
    padding: 14px;
    gap: 12px;
  }
  .claim__top {
    flex-direction: column;
    gap: 8px;
  }
  .check {
    grid-template-columns: minmax(0, 1fr);
    gap: 2px;
  }
}
</style>
