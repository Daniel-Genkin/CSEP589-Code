<script setup>
import CategoryIcon from '@/components/ui/CategoryIcon.vue'
import ScoreBar from '@/components/ui/ScoreBar.vue'
import { CATEGORIES } from '@/utils/scoring'
import { Heart } from '@lucide/vue'

defineProps({
  categories: { type: Object, required: true },
  highlight: { type: Array, default: () => [] },
  compact: { type: Boolean, default: false },
  showNotes: { type: Boolean, default: true },
})
</script>

<template>
  <ul class="cats" :class="{ 'cats--compact': compact }">
    <li v-for="cat in CATEGORIES" :key="cat.key" class="cat" :class="{ 'is-mine': highlight.includes(cat.key) }">
      <div class="cat__head">
        <CategoryIcon :category="cat.key" :size="compact ? 30 : 38" />
        <div class="cat__title">
          <span class="cat__label">{{ cat.label }}</span>
          <span v-if="highlight.includes(cat.key)" class="cat__mine">
            <Heart :size="11" fill="currentColor" /> Matters to you
          </span>
        </div>
        <span class="cat__score num">{{ categories[cat.key].score }}</span>
      </div>
      <ScoreBar :score="categories[cat.key].score" :height="compact ? 6 : 8" />
      <p v-if="showNotes && categories[cat.key].note" class="cat__note">{{ categories[cat.key].note }}</p>
    </li>
  </ul>
</template>

<style scoped>
.cats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.cat {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
}
.cat.is-mine {
  border-color: var(--brand-200);
  background: linear-gradient(180deg, var(--brand-25), var(--surface));
}
.cat__head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cat__title {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.cat__label {
  font-weight: 700;
  font-size: 15px;
  line-height: 1.3;
}
.cat__mine {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  font-size: 12px;
  font-weight: 650;
  color: var(--coral-500);
}
.cat__score {
  font-size: 22px;
  font-weight: 760;
  letter-spacing: -0.02em;
}
.cat__note {
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-2);
}

.cats--compact {
  gap: 10px;
}
.cats--compact .cat {
  gap: 10px;
  padding: 14px;
  border-radius: 16px;
}
.cats--compact .cat__label {
  font-size: 14px;
}
.cats--compact .cat__score {
  font-size: 18px;
}
.cats--compact .cat__note {
  font-size: 13px;
  color: var(--muted);
}

@media (max-width: 720px) {
  .cats {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
