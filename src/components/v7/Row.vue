<script setup>
import { computed } from 'vue'
import { Check, X, ChevronRight } from '@lucide/vue'

const props = defineProps({
  tk: String,
  title: String,
  sub: String,
  dot: String,
  ring: Boolean,
  icon: String, // check | close | pending | chev
  right: String,
  rightSub: String,
  rightTone: String, // link | flare
  to: String,
})
const tag = computed(() => (props.to ? 'RouterLink' : 'div'))
</script>

<template>
  <component :is="tag" :to="to" class="row" :class="{ link: !!to }">
    <span v-if="tk" class="tk mono">{{ tk }}</span>
    <span class="stack">
      <span class="title">{{ title }}</span>
      <span v-if="sub || dot || ring" class="sub">
        <span v-if="dot" class="dot" :style="{ background: dot }" />
        <span v-else-if="ring" class="ring" />
        {{ sub }}
      </span>
    </span>
    <slot name="right">
      <span v-if="right" class="right" :class="rightTone">
        <span>{{ right }}</span>
        <span v-if="rightSub" class="rsub">{{ rightSub }}</span>
      </span>
    </slot>
    <Check v-if="icon === 'check'" class="ic" :size="20" color="var(--link)" />
    <X v-else-if="icon === 'close'" class="ic" :size="20" color="var(--white)" />
    <span v-else-if="icon === 'pending'" class="pending" />
    <ChevronRight v-else-if="icon === 'chev'" class="ic" :size="18" color="var(--mute)" />
  </component>
</template>

<style scoped>
.row { display: flex; align-items: center; gap: 12px; padding: 11px 16px 11px 0; min-height: 62px; border-bottom: 1px solid var(--line); }
.row:last-child { border-bottom: 0; }
.row.link:hover .title { color: var(--link); }
.tk { width: 40px; height: 40px; border-radius: 10px; background: #34313d; display: grid; place-items: center; font-weight: 500; font-size: 11px; color: var(--cream); flex: none; }
.stack { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.title { font-weight: 600; font-size: 16px; color: var(--white); }
.sub { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; color: var(--dim); }
.right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; font-weight: 500; font-size: 16px; color: var(--cream); white-space: nowrap; }
.right.link { color: var(--link); font-weight: 600; }
.right.flare { color: var(--flare); font-weight: 600; }
.rsub { font-size: 12px; color: var(--mute); font-weight: 400; }
.ic { flex: none; }
.pending { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid #5b5764; flex: none; }
</style>
