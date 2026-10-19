<script setup>
import { scansService } from '@/api'
import BrandLogo from '@/components/ui/BrandLogo.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import { Check, Lightbulb, LoaderCircle, TriangleAlert } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const scan = ref(null)
const error = ref(null)
const tipIndex = ref(0)
let pollTimer = null
let tipTimer = null
let active = true

const tips = [
  "An ETF can hold hundreds of companies. We check every single one, so you don't have to.",
  'Each value gets a 0–100 score. Your combined score blends all six.',
  'Good news counts too. We flag positive changes, not just problems.',
  "There's no perfect company. The goal is progress you feel good about.",
  'This is research, not financial advice. You stay in control of every decision.',
]

const complete = computed(() => scan.value?.status === 'complete')
const progress = computed(() => scan.value?.progress ?? 0)
const stage = computed(() => (complete.value ? Infinity : (scan.value?.stage ?? 0)))

async function poll() {
  try {
    scan.value = await scansService.get(route.params.scanId)
    if (!active) return
    if (scan.value.status === 'complete') {
      setTimeout(() => active && router.replace(`/app/scan/${scan.value.id}`), 1000)
      return
    }
    pollTimer = setTimeout(poll, 650)
  } catch (err) {
    error.value = err
  }
}

onMounted(() => {
  poll()
  tipTimer = setInterval(() => (tipIndex.value = (tipIndex.value + 1) % tips.length), 4000)
})
onBeforeUnmount(() => {
  active = false
  clearTimeout(pollTimer)
  clearInterval(tipTimer)
})
</script>

<template>
  <div class="scanning">
    <div v-if="error" class="card">
      <EmptyState :icon="TriangleAlert" title="We couldn't find that scan" :text="error.message">
        <RouterLink to="/app/scan/new" class="btn btn-primary">Start a new scan</RouterLink>
      </EmptyState>
    </div>

    <template v-else>
      <div class="orb" :class="{ 'is-done': complete }" aria-hidden="true">
        <span class="orb__wave" />
        <span class="orb__wave orb__wave--2" />
        <span class="orb__core">
          <Check v-if="complete" :size="40" :stroke-width="2.6" />
          <BrandLogo v-else :size="56" :show-wordmark="false" />
        </span>
      </div>

      <h1 class="scanning__title">
        {{ complete ? 'All done. Here’s what we found.' : 'Doing the homework so you don’t have to' }}
      </h1>
      <p class="scanning__sub">
        <template v-if="scan">
          Checking {{ scan.holdingsCount }} {{ scan.holdingsCount === 1 ? 'holding' : 'holdings' }}
          and {{ scan.companiesCovered.toLocaleString() }} {{ scan.companiesCovered === 1 ? 'company' : 'companies' }} inside them.
        </template>
        <template v-else>Getting started…</template>
      </p>

      <div v-if="scan" class="scanning__logos">
        <SecurityLogo
          v-for="(h, i) in scan.holdings"
          :key="h.symbol"
          :symbol="h.symbol"
          :name="h.name"
          :color="h.color"
          :type="h.type"
          :size="40"
          class="scanning__logo"
          :style="{ animationDelay: `${i * 0.08}s` }"
        />
      </div>

      <div class="meter" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
        <span class="meter__fill" :style="{ width: `${progress}%` }" />
      </div>
      <p class="meter__label num">{{ progress }}%</p>

      <ol class="stages">
        <li
          v-for="(label, i) in scan?.stages ?? []"
          :key="label"
          class="stage"
          :class="{ 'is-done': i < stage, 'is-active': i === stage }"
        >
          <span class="stage__icon">
            <Check v-if="i < stage" :size="14" :stroke-width="3" />
            <LoaderCircle v-else-if="i === stage" :size="16" class="stage__spin" />
          </span>
          {{ label }}
        </li>
      </ol>

      <div class="tip">
        <Lightbulb :size="18" />
        <Transition name="fade" mode="out-in">
          <p :key="tipIndex">{{ tips[tipIndex] }}</p>
        </Transition>
      </div>
    </template>
  </div>
</template>

<style scoped>
.scanning {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 560px;
  margin: 0 auto;
  padding: 32px 0 48px;
  text-align: center;
}
.orb {
  position: relative;
  display: grid;
  place-items: center;
  width: 168px;
  height: 168px;
  margin-bottom: 28px;
}
.orb__wave {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(128, 197, 157, 0.45), rgba(128, 197, 157, 0) 70%);
  animation: breathe 3.2s ease-in-out infinite;
}
.orb__wave--2 {
  inset: 18px;
  background: radial-gradient(circle, rgba(196, 186, 255, 0.5), rgba(196, 186, 255, 0) 70%);
  animation-delay: -1.6s;
}
.orb__core {
  position: relative;
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: var(--surface);
  box-shadow: var(--shadow-lg);
  color: var(--brand-600);
  transition: transform 0.4s var(--ease);
}
.orb.is-done .orb__core {
  background: var(--brand-600);
  color: #fff;
  transform: scale(1.06);
}
@keyframes breathe {
  0%,
  100% {
    transform: scale(0.85);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.08);
    opacity: 1;
  }
}
.scanning__title {
  font-size: clamp(26px, 3.4vw, 34px);
}
.scanning__sub {
  margin-top: 10px;
  color: var(--muted);
}
.scanning__logos {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 22px;
}
.scanning__logo {
  animation: fade-up 0.5s var(--ease) both;
}
.meter {
  width: 100%;
  height: 10px;
  margin-top: 30px;
  border-radius: var(--radius-pill);
  background: var(--bg-tint);
  overflow: hidden;
}
.meter__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--brand-300), var(--brand-600));
  transition: width 0.6s var(--ease);
}
.meter__label {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
}
.stages {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 22px;
  padding: 20px 22px;
  border: 1px solid var(--line);
  border-radius: 22px;
  background: var(--surface);
  text-align: left;
}
.stage {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--subtle);
  transition: color 0.3s;
}
.stage.is-active {
  color: var(--ink);
}
.stage.is-done {
  color: var(--ink-2);
}
.stage__icon {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid var(--line-strong);
  transition: all 0.3s;
}
.is-active .stage__icon {
  border-color: transparent;
  color: var(--brand-600);
}
.is-done .stage__icon {
  border-color: var(--brand-500);
  background: var(--brand-500);
  color: #fff;
}
.stage__spin {
  animation: spin 0.9s linear infinite;
}
.tip {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  min-height: 74px;
  margin-top: 18px;
  padding: 16px 18px;
  border-radius: 18px;
  background: var(--sun-50);
  color: #5c4209;
  text-align: left;
  font-size: 14.5px;
}
.tip svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--sun-500);
}
</style>
