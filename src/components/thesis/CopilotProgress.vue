<script setup>
import BrandLogo from '@/components/ui/BrandLogo.vue'
import { Check, LoaderCircle } from '@lucide/vue'
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  active: { type: Boolean, default: false },
  done: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
  title: { type: String, default: 'The copilot is working on your idea' },
})
const emit = defineEmits(['finished'])

const STEPS = [
  'Breaking your idea into claims',
  'Checking company filings',
  'Checking government policy',
  'Checking adoption data',
  'Finding the most exposed companies',
  'Looking for the strongest arguments against',
  'Backtesting against the S&P 500',
]

// Steps tick along while the request runs, then race to the end once the answer arrives.
const index = ref(0)
let timer = null
let finishTimer = null

function stop() {
  clearInterval(timer)
  clearTimeout(finishTimer)
  timer = null
}

function start() {
  stop()
  index.value = 0
  timer = setInterval(() => {
    if (index.value < STEPS.length - 1) index.value++
  }, props.compact ? 230 : 340)
}

function finish() {
  stop()
  const tick = () => {
    if (index.value < STEPS.length) {
      index.value++
      finishTimer = setTimeout(tick, 70)
    } else {
      finishTimer = setTimeout(() => emit('finished'), 200)
    }
  }
  tick()
}

watch(
  () => props.active,
  (active) => (active ? start() : stop()),
  { immediate: true },
)
watch(
  () => props.done,
  (done) => done && finish(),
  { immediate: true },
)
onBeforeUnmount(stop)
</script>

<template>
  <div class="progress" :class="{ 'progress--compact': compact }" role="status" aria-live="polite">
    <div class="progress__head">
      <span class="progress__orb" aria-hidden="true">
        <span class="progress__wave" />
        <BrandLogo :size="compact ? 30 : 40" :show-wordmark="false" />
      </span>
      <div>
        <p class="progress__title">{{ title }}</p>
        <p class="progress__sub">{{ STEPS[Math.min(index, STEPS.length - 1)] }}…</p>
      </div>
    </div>
    <ol class="progress__steps">
      <li
        v-for="(step, i) in STEPS"
        :key="step"
        class="progress__step"
        :class="{ 'is-done': i < index, 'is-active': i === index }"
      >
        <span class="progress__icon">
          <Check v-if="i < index" :size="13" :stroke-width="3" />
          <LoaderCircle v-else-if="i === index" :size="15" class="progress__spin" />
        </span>
        {{ step }}
      </li>
    </ol>
  </div>
</template>

<style scoped>
.progress {
  padding: 26px;
  border: var(--outline);
  border-radius: 28px;
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-lg);
}
.progress__head {
  display: flex;
  align-items: center;
  gap: 16px;
}
.progress__orb {
  position: relative;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
}
.progress__wave {
  position: absolute;
  inset: 4px;
  border: var(--outline-thin);
  border-radius: 50%;
  background: var(--bubblegum);
  animation: breathe 2.2s ease-in-out infinite;
}
.progress__orb :deep(.brand) {
  position: relative;
}
.progress__orb :deep(.brand__tile) {
  animation: wobble 1.4s ease-in-out infinite;
}
.progress__title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 400;
  line-height: 1;
  text-transform: uppercase;
}
.progress__sub {
  margin-top: 6px;
  font-family: var(--font-mono);
  font-size: 13.5px;
  color: var(--muted);
}
.progress__steps {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 20px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 2px dashed var(--ink-solid);
}
.progress__step {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--subtle);
  transition: color 0.3s;
}
.progress__step.is-active {
  color: var(--ink);
}
.progress__step.is-done {
  color: var(--ink-2);
}
.progress__icon {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid currentColor;
  transition: all 0.3s;
}
.is-active .progress__icon {
  border-color: transparent;
  color: var(--signal);
}
.is-done .progress__icon {
  border-color: var(--ink-solid);
  background: var(--sun);
  color: var(--ink);
}
.progress__spin {
  animation: spin 0.9s linear infinite;
}
.progress--compact {
  padding: 22px;
}
.progress--compact .progress__orb {
  width: 52px;
  height: 52px;
}
.progress--compact .progress__title {
  font-size: 24px;
}
@keyframes breathe {
  0%,
  100% {
    transform: scale(0.82);
  }
  50% {
    transform: scale(1.08);
  }
}
@keyframes wobble {
  0%,
  100% {
    transform: rotate(-8deg);
  }
  50% {
    transform: rotate(8deg);
  }
}
@media (max-width: 640px) {
  .progress {
    padding: 20px;
  }
  .progress__steps {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
