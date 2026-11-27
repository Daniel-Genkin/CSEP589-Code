<script setup>
import { computed, ref } from 'vue'
import BrowserWindow from './BrowserWindow.vue'
import FirstVisitView from '../views/FirstVisitView.vue'
import PickLinesView from '../views/PickLinesView.vue'
import ReceiptView from '../views/ReceiptView.vue'
import { usePinned, reduced } from '../scroll.js'

// Scroll-driven walkthrough: the section pins while you scroll, and each step's bar fills
// with your scroll before the next screen slides in. Tapping a step jumps to it.
const steps = [
  { n: '01', t: 'Pick your fund', d: 'Search for the ETF you own, or start with VOO. No account needed.', view: FirstVisitView, label: 'Rally · Pick your fund' },
  { n: '02', t: 'Choose your lines', d: 'Tap the issues you care about. Add your own if it’s missing.', view: PickLinesView, label: 'Rally · Your lines' },
  { n: '03', t: 'Get your receipt', d: 'See what crosses your lines, how much of your money is there, and the source for each.', view: ReceiptView, label: 'Rally · Your receipt' },
]
const root = ref(null)
const p = usePinned(root)
const picked = ref(0)
const active = computed(() => (reduced ? picked.value : Math.min(steps.length - 1, Math.floor(p.value * steps.length * 0.999))))
const fill = (i) => (reduced ? (i <= picked.value ? 1 : 0) : Math.min(1, Math.max(0, p.value * steps.length - i)))

function jump(i) {
  picked.value = i
  if (reduced || !root.value) return
  const top = root.value.getBoundingClientRect().top + window.scrollY
  const span = root.value.offsetHeight - window.innerHeight
  window.scrollTo({ top: top + span * ((i + 0.35) / steps.length), behavior: 'smooth' })
}
</script>

<template>
  <div ref="root" class="how" :class="{ still: reduced }">
    <div class="pin">
      <div class="tabs" role="tablist">
        <button v-for="(s, i) in steps" :key="s.n" role="tab" :aria-selected="i === active" class="tab" :class="{ on: i === active }" @click="jump(i)">
          <span class="track"><i class="fill" :style="{ transform: `scaleX(${fill(i)})` }" /></span>
          <span class="mono n">{{ s.n }}</span>
          <b>{{ s.t }}</b>
          <span class="d">{{ s.d }}</span>
        </button>
      </div>
      <div class="stage">
        <Transition name="swap" mode="out-in">
          <BrowserWindow :key="active" :label="steps[active].label" :width="1040" :height="520">
            <component :is="steps[active].view" />
          </BrowserWindow>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.how { height: 300vh; margin-top: 40px; }
.how.still { height: auto; }
.pin { position: sticky; top: 104px; }
.tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.tab { display: flex; flex-direction: column; gap: 10px; text-align: left; opacity: 0.5; transition: opacity 0.3s; }
.tab.on, .tab:hover { opacity: 1; }
.track { height: 2px; background: var(--line); position: relative; overflow: hidden; border-radius: 1px; margin-bottom: 10px; }
.fill { position: absolute; inset: 0; background: var(--sun); transform-origin: left; transform: scaleX(0); }
.n { color: var(--sun); font-weight: 500; font-size: 14px; }
.tab b { font-weight: 600; font-size: 22px; color: var(--white); }
.d { font-size: 15px; line-height: 1.5; color: var(--dim); max-width: 330px; }
.stage { margin-top: 32px; display: flex; justify-content: center; height: 540px; }
.swap-enter-active, .swap-leave-active { transition: opacity 0.3s ease, transform 0.4s cubic-bezier(0.2, 0.7, 0.2, 1); }
.swap-enter-from { opacity: 0; transform: translateY(40px) scale(0.98); }
.swap-leave-to { opacity: 0; transform: translateY(-30px) scale(0.98); }
</style>
