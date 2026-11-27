<script setup>
import Receipt from './Receipt.vue'
import LinePill from './LinePill.vue'
</script>

<template>
  <div class="share-card">
    <p class="display head"><span>13%</span> of my index fund crosses my lines.</p>
    <div class="paper">
      <Receipt mode="per100" :zoom="0.5" :rotate="-4" />
      <LinePill class="st st1" label="Data privacy" color="var(--pink)" size="sm" :flag="false" :rotate="-6" />
      <LinePill class="st st2" label="Environment & climate" color="var(--sun)" size="sm" :flag="false" :rotate="6" />
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
.st2 { left: 0; bottom: 18px; }
.foot { display: flex; justify-content: space-between; align-items: center; font-weight: 500; font-size: 13px; color: var(--white); }
.foot .display { font-size: 18px; color: var(--cream); }
</style>
