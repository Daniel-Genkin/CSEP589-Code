<script setup lang="ts">
import Receipt from './Receipt.vue'
import LinePill from './LinePill.vue'

// The 9:16 card people post. Holdings and lines only: always per $100, never a balance.
// With no props it shows the landing's sample.
defineProps<{
  pct?: string
  fund?: string
  rows?: { label: string; sub?: string; amount: string }[]
  total?: string
  rest?: string
  stickers?: { label: string; color: string }[]
}>()
</script>

<template>
  <div class="share-card">
    <p class="display head"><span>{{ pct ?? '13%' }}</span> of my index fund crosses my lines.</p>
    <div class="paper">
      <Receipt
        mode="per100"
        :zoom="0.5"
        :rotate="-4"
        :meta="fund ? `Receipt · ${fund}` : undefined"
        :rows="rows"
        :total="total"
        :total-sub="fund ? `per $100 in ${fund}` : undefined"
        :rest="rest"
      />
      <template v-if="stickers">
        <LinePill v-for="(s, i) in stickers.slice(0, 2)" :key="s.label" class="st" :class="i ? 'st2' : 'st1'" :label="s.label" :color="s.color" size="sm" :flag="false" :rotate="i ? 6 : -6" />
      </template>
      <template v-else>
        <LinePill class="st st1" label="Data privacy" color="var(--pink)" size="sm" :flag="false" :rotate="-6" />
        <LinePill class="st st2" label="Environment & climate" color="var(--sun)" size="sm" :flag="false" :rotate="6" />
      </template>
    </div>
    <div class="foot">
      <span>What’s in yours?</span>
      <span class="display">Rally</span>
    </div>
  </div>
</template>

<style scoped>
.share-card { position: relative; width: 270px; height: 480px; border-radius: 22px; background: #1d1c23; border: 1px solid #34313d; padding: 22px 18px 16px; display: flex; flex-direction: column; overflow: hidden; }
.head { font-size: 30px; color: var(--cream); line-height: 0.98; }
.head span { color: var(--flare); }
.paper { position: relative; flex: 1; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 18px; }
.st { position: absolute; }
.st1 { right: 8px; top: 128px; }
.st2 { left: 4px; bottom: 18px; }
.foot { display: flex; justify-content: space-between; align-items: center; font-weight: 500; font-size: 13px; color: var(--white); }
.foot .display { font-size: 18px; color: var(--cream); }
</style>
