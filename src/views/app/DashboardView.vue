<script setup>
// The dashboard is one route with five states, each a Figma frame:
// first visit, scanning, result (conflicts), zero conflicts, data unavailable.
import { useLinesStore } from '@/stores/lines'
import { checkFund } from '@/utils/lines'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardFirstVisit from './dashboard/DashboardFirstVisit.vue'
import DashboardResult from './dashboard/DashboardResult.vue'
import DashboardScanning from './dashboard/DashboardScanning.vue'
import DashboardUnavailable from './dashboard/DashboardUnavailable.vue'
import DashboardZero from './dashboard/DashboardZero.vue'

const SCAN_MS = 1600
const STATES = ['first-visit', 'scanning', 'result', 'zero', 'unavailable']
// The fund pinned states talk about when the user has not picked one yet.
const REVIEW_FUND = 'VOO'

const route = useRoute()
const router = useRouter()
const store = useLinesStore()
const { lineKeys, fundSymbol } = storeToRefs(store)

// The fund being scanned. It only becomes the user's fund when the scan finishes,
// so cancelling leaves things as they were.
const pending = ref(null)
let timer = null
onBeforeUnmount(() => clearTimeout(timer))

// ?state=… pins a state for design review and screenshots.
const forced = computed(() => (STATES.includes(route.query.state) ? route.query.state : null))

const symbol = computed(() => pending.value ?? fundSymbol.value ?? (forced.value ? REVIEW_FUND : null))
const result = computed(() => (symbol.value ? checkFund(symbol.value, lineKeys.value) : null))

const state = computed(() => {
  if (forced.value) {
    // A pinned result still needs data to show.
    if (['result', 'zero'].includes(forced.value) && !result.value) return 'unavailable'
    return forced.value
  }
  if (pending.value) return 'scanning'
  if (!fundSymbol.value) return 'first-visit'
  if (!result.value) return 'unavailable'
  return result.value.crossers.length ? 'result' : 'zero'
})

function unpin() {
  if (forced.value) router.replace({ query: {} })
}
function scan(next = symbol.value) {
  unpin()
  pending.value = next
  clearTimeout(timer)
  timer = setTimeout(() => {
    store.setFund(pending.value)
    pending.value = null
  }, SCAN_MS)
}
function cancelScan() {
  unpin()
  clearTimeout(timer)
  pending.value = null
}
function changeFund() {
  cancelScan()
  store.setFund(null)
}
</script>

<template>
  <Transition name="fade" mode="out-in">
    <DashboardFirstVisit v-if="state === 'first-visit'" key="first-visit" @continue="scan" />
    <DashboardScanning v-else-if="state === 'scanning'" key="scanning" :symbol="symbol" @cancel="cancelScan" />
    <DashboardUnavailable v-else-if="state === 'unavailable'" key="unavailable" :symbol="symbol" @retry="scan()" @change-fund="changeFund" />
    <DashboardZero v-else-if="state === 'zero'" key="zero" :result="result" @rescan="scan()" />
    <DashboardResult v-else key="result" :result="result" @rescan="scan()" />
  </Transition>
</template>
