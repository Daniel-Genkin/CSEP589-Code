<script setup>
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import { timeAgo } from '@/utils/format'
import { CATEGORY_MAP } from '@/utils/scoring'
import { ArrowUpRight, Newspaper, ThumbsUp, TriangleAlert } from '@lucide/vue'
import { computed, ref } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  filterable: { type: Boolean, default: true },
  limit: { type: Number, default: 0 },
})

const SENTIMENT = {
  positive: { icon: ThumbsUp, label: 'Good news' },
  negative: { icon: TriangleAlert, label: 'Heads up' },
  neutral: { icon: Newspaper, label: 'Worth knowing' },
}

const filter = ref('all')
const countOf = (sentiment) => props.items.filter((n) => n.sentiment === sentiment).length

const options = computed(() =>
  [
    { value: 'all', label: 'All', count: props.items.length },
    { value: 'positive', label: 'Good news', count: countOf('positive') },
    { value: 'negative', label: 'Heads up', count: countOf('negative') },
    { value: 'neutral', label: 'Worth knowing', count: countOf('neutral') },
  ].filter((o) => o.value === 'all' || o.count > 0),
)

const visible = computed(() => {
  const list = filter.value === 'all' ? props.items : props.items.filter((n) => n.sentiment === filter.value)
  return props.limit ? list.slice(0, props.limit) : list
})
</script>

<template>
  <div class="news">
    <SegmentedControl v-if="filterable && items.length > 1" v-model="filter" :options="options" label="Filter news" />

    <ul class="news__list">
      <li
        v-for="item in visible"
        :key="`${item.id}-${item.via?.symbol ?? ''}`"
        class="news-item"
        :class="`news-item--${item.sentiment}`"
      >
        <span class="news-item__icon"><component :is="SENTIMENT[item.sentiment].icon" :size="17" /></span>
        <div class="news-item__body">
          <p class="news-item__meta">
            <span class="news-item__tone">{{ SENTIMENT[item.sentiment].label }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ item.source }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ timeAgo(item.publishedAt) }}</span>
          </p>
          <a :href="item.url" target="_blank" rel="noopener noreferrer" class="news-item__title">
            {{ item.title }}
            <ArrowUpRight :size="15" class="news-item__ext" />
          </a>
          <p class="news-item__summary">{{ item.summary }}</p>
          <div v-if="item.via || item.categories.length || item.impact" class="news-item__tags">
            <span v-if="item.via" class="badge badge-etf">via {{ item.via.name }} · {{ item.via.weight }}% of fund</span>
            <span
              v-for="key in item.categories"
              :key="key"
              class="news-item__tag"
              :style="{ color: `var(--cat-${key})`, background: `var(--cat-${key}-bg)` }"
            >
              {{ CATEGORY_MAP[key].short }}
            </span>
            <span v-if="item.impact" class="news-item__impact" :class="item.impact > 0 ? 'is-up' : 'is-down'">
              {{ item.impact > 0 ? '+' : '−' }}{{ Math.abs(item.impact) }} pts
            </span>
          </div>
        </div>
      </li>
    </ul>

    <p v-if="!visible.length" class="news__empty">No stories here right now. That's usually a good sign.</p>
  </div>
</template>

<style scoped>
.news {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.news__list {
  display: flex;
  flex-direction: column;
}
.news-item {
  display: flex;
  gap: 14px;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
}
.news-item:first-child {
  padding-top: 4px;
}
.news-item:last-child {
  border-bottom: 0;
}
.news-item__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: var(--bg-tint);
  color: var(--muted);
}
.news-item--positive .news-item__icon {
  background: var(--score-great-bg);
  color: var(--score-great);
}
.news-item--negative .news-item__icon {
  background: var(--score-low-bg);
  color: var(--score-low);
}
.news-item__body {
  flex: 1;
  min-width: 0;
}
.news-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12.5px;
  color: var(--muted);
}
.news-item__tone {
  font-weight: 700;
  color: var(--ink-2);
}
.news-item--positive .news-item__tone {
  color: var(--score-great);
}
.news-item--negative .news-item__tone {
  color: var(--score-low);
}
.news-item__title {
  display: inline;
  margin-top: 4px;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--ink);
  transition: color 0.2s;
}
.news-item__title:hover {
  color: var(--brand-600);
}
.news-item__ext {
  display: inline;
  vertical-align: -2px;
  color: var(--subtle);
}
.news-item__summary {
  margin-top: 4px;
  font-size: 14.5px;
  color: var(--ink-2);
}
.news-item__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.news-item__tag {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 9px;
  border-radius: var(--radius-pill);
  font-size: 11.5px;
  font-weight: 700;
}
.news-item__impact {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 9px;
  border-radius: var(--radius-pill);
  font-size: 11.5px;
  font-weight: 750;
}
.news-item__impact.is-up {
  background: var(--score-great-bg);
  color: var(--score-great);
}
.news-item__impact.is-down {
  background: var(--score-low-bg);
  color: var(--score-low);
}
.news__empty {
  padding: 24px 0;
  color: var(--muted);
  text-align: center;
}
</style>
