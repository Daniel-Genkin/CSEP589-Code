<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Check, Plus, X } from '@lucide/vue'
import FlowShell from '@/components/v7/FlowShell.vue'
import AddLineModal from '@/components/v7/AddLineModal.vue'
import { useCatalogStore } from '@/state/catalog'
import { useCheckStore } from '@/state/check'
import { useDemoStore } from '@/state/demo'

const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()
const demo = useDemoStore()
const check = useCheckStore()
onMounted(() => void catalog.load())

const adding = computed(() => route.query.dialog === 'add')
const mine = computed(() => catalog.categories.filter((c) => catalog.selectedIds.includes(c.id)))
const more = computed(() => catalog.categories.filter((c) => !catalog.selectedIds.includes(c.id)))
const count = computed(() => mine.value.length + check.customLines.length)
const removeCustom = (n: string) => check.customLines.splice(check.customLines.indexOf(n), 1)
function clearAll() {
  demo.setCategories([])
  check.customLines.splice(0)
}
</script>

<template>
  <FlowShell :steps="3" :step="2" back="/check" title="What won’t you fund?" body="Pick the issues you care about. Rally flags companies in your fund that are involved in them.">
    <div class="section-head">
      <h3>Your lines · {{ count }}</h3>
      <button class="btn-link" style="height: auto" @click="clearAll">Clear All</button>
    </div>
    <div v-if="count" class="opts">
      <button v-for="l in mine" :key="l.id" class="opt on" :aria-pressed="true" @click="catalog.toggle(l.id)">
        <i class="dot" :style="{ background: l.color }" />
        <span class="t"><b>{{ l.label }}</b><small>{{ l.description }}</small></span>
        <Check :size="18" />
      </button>
      <button v-for="n in check.customLines" :key="n" class="opt on" @click="removeCustom(n)">
        <i class="dot" style="background: var(--ink)" />
        <span class="t"><b>{{ n }}</b><small>Your own line. Rally has no records for it yet.</small></span>
        <X :size="17" />
      </button>
    </div>
    <p v-else class="caption">Pick at least one line to check your fund.</p>

    <div class="section-head" style="margin-top: 8px"><h3>Add more</h3></div>
    <div class="opts">
      <button v-for="l in more" :key="l.id" class="opt" :aria-pressed="false" @click="catalog.toggle(l.id)">
        <i class="ring" />
        <span class="t"><b>{{ l.label }}</b><small>{{ l.description }}</small></span>
        <Plus :size="18" />
      </button>
      <RouterLink to="/check/lines?dialog=add" class="opt own"><Plus :size="18" /><span class="t"><b>Add Your Own</b><small>Something we don’t list yet</small></span></RouterLink>
    </div>
    <RouterLink to="/check/amount" class="btn btn-primary btn-block" :class="{ off: !mine.length }" style="margin-top: 8px">Continue</RouterLink>
  </FlowShell>
  <AddLineModal v-if="adding" @close="router.replace('/check/lines')" />
</template>

<style scoped>
.opts { display: flex; flex-direction: column; gap: 8px; }
.opt { display: flex; align-items: center; gap: 14px; min-height: 62px; padding: 10px 16px; border-radius: 16px; border: 1px solid #3e3b48; text-align: left; transition: background 0.15s, border-color 0.15s; }
.opt:hover { border-color: var(--dim); }
.opt :deep(svg) { color: var(--dim); flex: none; }
.opt.on { background: var(--cream); border-color: var(--cream); }
.opt.on b { color: var(--ink); }
.opt.on small { color: #5b5764; }
.opt.on :deep(svg) { color: var(--ink); }
.t { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.t b { font-weight: 600; font-size: 16px; color: var(--white); }
.t small { font-size: 13px; color: var(--dim); }
.own { border-style: dashed; }
.own b, .own :deep(svg) { color: var(--link); }
.off { opacity: 0.4; pointer-events: none; }
</style>
