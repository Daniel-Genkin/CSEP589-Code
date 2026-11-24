<script setup lang="ts">
// F9 Values settings. A switch for every category in the data, the seven featured values
// categories first, plus select all and select none. The choice is persisted, and every other
// screen follows it without a reload. No Figma frame: built from docs/STYLE.md.
import UiToggle from '@/components/ui/UiToggle.vue'
import { useCatalogStore } from '@/state/catalog'
import { useDemoStore } from '@/state/demo'
import { plural } from '@/utils/format'
import { computed, onMounted } from 'vue'

const demo = useDemoStore()
const catalog = useCatalogStore()

/** A failed load shows the error card, which offers this again. */
const load = () => catalog.load().catch(() => {})
onMounted(load)

const selected = computed(() => new Set(catalog.selectedIds))
const count = computed(() => catalog.selectedIds.length)
const total = computed(() => catalog.categories.length)
/** Whether exactly the featured seven are on, which is also the state before any choice is made. */
const usingDefaults = computed(() => count.value === catalog.featuredIds.length && catalog.featuredIds.every((id) => selected.value.has(id)))

const selectAll = () => demo.setCategories(catalog.categories.map((c) => c.id))
const selectNone = () => demo.setCategories([])
const selectFeatured = () => demo.setCategories(catalog.featuredIds)
</script>

<template>
  <div class="page">
    <header class="page-head">
      <p class="eyebrow">Your Rally · Values · {{ count }} of {{ total }} selected</p>
      <h1 class="page-title">Your lines.<br />Your call.</h1>
      <p class="lead">Choose the sector lines you care about. Portfolio and What-if follow this choice straight away.</p>
    </header>

    <div v-if="catalog.status === 'error'" class="card card-pad failed" role="alert">
      <span class="tag"><span class="dot" style="--dot: var(--flare)" />Categories unavailable</span>
      <h2 class="title-lg">The categories didn’t load.</h2>
      <button type="button" class="btn btn-primary" @click="load">Try again</button>
    </div>

    <div v-else class="page-cols">
      <div class="col-main">
        <div class="actions">
          <button type="button" class="btn btn-outline btn-sm" :disabled="count === total" @click="selectAll">Select all</button>
          <button type="button" class="btn btn-outline btn-sm" :disabled="count === 0" @click="selectNone">Select none</button>
          <button type="button" class="btn btn-outline btn-sm" :disabled="usingDefaults" @click="selectFeatured">Back to the featured seven</button>
          <p class="label-mono actions__count" role="status">{{ plural(count, 'category', 'categories') }} selected · saved</p>
        </div>

        <section class="card card-pad group" aria-labelledby="group-values">
          <header class="row-between">
            <h2 id="group-values" class="title-card">Featured sector lines</h2>
            <p class="label-mono">{{ catalog.featured.filter((c) => selected.has(c.id)).length }} of {{ catalog.featured.length }} on</p>
          </header>
          <ul v-if="catalog.featured.length" class="switches">
            <li v-for="category in catalog.featured" :key="category.id" class="rule-top">
              <span class="dot dot-10" :style="{ '--dot': category.color }" />
              <UiToggle :model-value="selected.has(category.id)" :label="category.label" :description="`Tagged from: ${category.basis}`" @update:model-value="catalog.toggle(category.id)" />
            </li>
          </ul>
          <div v-else class="skeleton" style="height: 420px" />
        </section>

        <section class="card card-pad group" aria-labelledby="group-sectors">
          <header class="row-between">
            <h2 id="group-sectors" class="title-card">Sectors</h2>
            <p class="label-mono">{{ catalog.others.filter((c) => selected.has(c.id)).length }} of {{ catalog.others.length }} on</p>
          </header>
          <p class="body-muted">Any sector works as a category, exactly like the seven above: switch one on to see how much of what you hold sits in it.</p>
          <ul class="switches switches--two">
            <li v-for="category in catalog.others" :key="category.id" class="rule-top">
              <span class="dot dot-10" :style="{ '--dot': category.color }" />
              <UiToggle :model-value="selected.has(category.id)" :label="category.label" :description="category.basis" @update:model-value="catalog.toggle(category.id)" />
            </li>
          </ul>
        </section>
      </div>

      <aside class="col-side">
        <section class="card card-pad notes">
          <h2 class="title-card">What a category does.</h2>
          <ul>
            <li class="rule-top"><b>It is your choice, not a verdict.</b><span>Rally shows which holdings are tagged in the categories you switch on. It does not say they are good or bad.</span></li>
            <li class="rule-top"><b>Every tag has a source.</b><span>Open a tag on the portfolio to see the reason and the link it rests on.</span></li>
            <li class="rule-top"><b>It changes every screen.</b><span>Exposure, the what-if, alternatives and alerts all count only what is switched on here.</span></li>
          </ul>
          <div class="notes__links">
            <RouterLink to="/portfolio" class="btn btn-primary btn-md">See your portfolio</RouterLink>
            <RouterLink to="/whatif" class="btn btn-outline btn-md">Open What-if</RouterLink>
          </div>
        </section>
        <p class="small">Sector lines come from TickerInside security profiles and are linked to their source. A company without a profile remains unclassified.</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.actions__count {
  margin-left: auto;
}
.group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.switches li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
}
.switches li:first-child {
  border-top: 0;
}
.switches :deep(.toggle) {
  flex: 1 1 0;
  min-width: 0;
}
.switches--two {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 40px;
}
.switches--two li:nth-child(2) {
  border-top: 0;
}
.failed {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}
.notes {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.notes li {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 0;
}
.notes li:first-child {
  border-top: 0;
  padding-top: 4px;
}
.notes b {
  font-size: 17px;
  font-weight: 600;
}
.notes span {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-muted);
}
.notes__links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
