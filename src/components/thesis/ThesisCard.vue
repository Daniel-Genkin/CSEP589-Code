<script setup>
import DeltaChip from '@/components/ui/DeltaChip.vue'
import { MessageSquare, Users } from '@lucide/vue'
import { computed } from 'vue'
import AuthorLine from './AuthorLine.vue'
import LogoStack from './LogoStack.vue'

const props = defineProps({
  thesis: { type: Object, required: true },
  to: { type: [String, Object], required: true },
  showAuthor: { type: Boolean, default: true },
  followable: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['follow'])

const counts = computed(() => props.thesis.claimCounts)
const record = computed(() => props.thesis.record)
</script>

<template>
  <article class="tcard card">
    <header class="tcard__top">
      <span class="topic-chip">{{ thesis.topic.short }}</span>
      <span v-if="thesis.status === 'draft'" class="badge">Draft</span>
      <span v-if="thesis.invested" class="badge badge-brand">Invested</span>
      <span class="grow" />
      <button
        v-if="followable && !thesis.isOwner"
        type="button"
        class="chip tcard__follow"
        :class="{ 'is-active': thesis.isFollowing }"
        :disabled="busy"
        @click="emit('follow', thesis)"
      >
        {{ thesis.isFollowing ? 'Following' : 'Follow' }}
      </button>
    </header>

    <RouterLink :to="to" class="tcard__link">
      <h3 class="tcard__title">{{ thesis.title }}</h3>
    </RouterLink>
    <p class="tcard__statement">{{ thesis.statement }}</p>

    <div class="tcard__meta">
      <LogoStack :items="thesis.basket" :max="5" :size="26" />
      <span class="muted text-sm">{{ thesis.basket.length }} companies</span>
      <span class="tcard__claims" :title="`${counts.supported} of ${counts.total} claims hold up`">
        <span class="dot dot--great" />{{ counts.supported }}
        <span class="dot dot--mixed" />{{ counts.mixed }}
        <span class="dot dot--low" />{{ counts.weak }}
        <span class="sr-only">claims: holds up, mixed, not proven</span>
      </span>
    </div>

    <footer class="tcard__foot">
      <AuthorLine v-if="showAuthor" :author="thesis.author" size="sm" :link="false" />
      <span v-else class="muted text-sm">{{ thesis.status === 'published' ? 'Published' : 'Not published yet' }}</span>
      <div class="tcard__stats">
        <span v-if="record?.tooEarly" class="tcard__early">Too early to call</span>
        <DeltaChip v-else-if="record" :value="record.excess" suffix=" pts" />
        <span v-else class="tcard__backtest">5-yr backtest <DeltaChip :value="thesis.backtest.excess" suffix=" pts" subtle /></span>
        <span v-if="thesis.status === 'published'" class="tcard__count"><Users :size="14" /> {{ thesis.followers }}</span>
        <span v-if="thesis.status === 'published'" class="tcard__count"><MessageSquare :size="14" /> {{ thesis.commentsCount }}</span>
      </div>
    </footer>
  </article>
</template>

<style scoped>
.tcard {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  color: var(--ink);
  transition:
    transform 0.2s var(--ease),
    box-shadow 0.2s var(--ease);
}
.tcard:hover {
  transform: translate(-2px, -2px);
  box-shadow: 8px 8px 0 var(--ink-solid);
}
.tcard__top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tcard__follow {
  position: relative;
  z-index: 2;
  height: 30px;
}
.tcard__link::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
}
.tcard__title {
  font-family: var(--font-display);
  font-size: 27px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.005em;
  text-transform: uppercase;
}
.tcard__link:hover .tcard__title {
  color: var(--signal-ink);
}
.tcard__link:focus-visible {
  outline: none;
}
.tcard__link:focus-visible::after {
  outline: 3px solid var(--signal);
  outline-offset: 2px;
}
.tcard__statement {
  font-size: 14px;
  color: var(--ink-2);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.tcard__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 2px;
}
.tcard__claims {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink-2);
}
.dot {
  width: 9px;
  height: 9px;
  margin-left: 4px;
  border: 1.5px solid var(--ink-solid);
  border-radius: 50%;
}
.dot--great {
  background: var(--signal);
}
.dot--mixed {
  background: var(--sun);
}
.dot--low {
  background: var(--ember);
}
.tcard__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 2px dashed var(--line);
}
.tcard__stats {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tcard__count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 650;
  color: var(--muted);
}
.tcard__early,
.tcard__backtest {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 650;
  color: var(--muted);
}
</style>
