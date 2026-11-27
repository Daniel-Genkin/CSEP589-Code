<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import FlowShell from '@/components/v7/FlowShell.vue'
import Row from '@/components/v7/Row.vue'
import { brokerById } from '@/config/brokers'
import { useDemoStore } from '@/state/demo'

const route = useRoute()
const demo = useDemoStore()
const broker = computed(() => brokerById(demo.portfolio?.brokerId))
/** `?list=1`: the trades were handed over as a list rather than sent. */
const asList = computed(() => route.query.list === '1' || !broker.value || broker.value.listOnly)
const live = computed(() => demo.portfolio?.live === true)
</script>

<template>
  <FlowShell
    :steps="3"
    :step="3"
    label="Basket · Done"
    :back="false"
    logo-to="/home"
    :title="asList ? 'Your list is ready.' : 'Your trades are in.'"
    :body="
      asList
        ? `Place the trades at ${broker?.name ?? 'your broker'} when you’re ready. Rally doesn’t send anything for you.`
        : live
          ? `Your orders went to your ${broker?.name} paper account. Outside market hours they wait for the next open.`
          : `Your approved trades went to ${broker?.name} (simulated). No real money moves in this demo.`
    "
  >
    <div class="section-head"><h3>What happens next</h3></div>
    <div v-if="asList" class="list">
      <Row title="Trade list made" sub="Copied or downloaded" icon="check" />
      <Row :title="`Place them at ${broker?.name ?? 'your broker'}`" sub="Sells first, then buys" icon="pending" />
      <Row title="Check your fund again" sub="Rally shows what crosses your lines after" icon="pending" />
    </div>
    <div v-else class="list">
      <Row title="Trades approved" sub="Today" icon="check" />
      <Row title="Orders filled" :sub="live ? 'At the next market price' : 'Simulated'" icon="pending" />
      <Row title="Updates on what you hold" sub="Rally tells you when something new is on file" icon="pending" />
    </div>
    <RouterLink to="/home" class="btn btn-primary btn-block">Back to Home</RouterLink>
    <RouterLink to="/trades" class="btn-link" style="align-self: flex-start">See the Trades Again</RouterLink>
    <p class="caption">Rally is not a broker and never holds your money.</p>
  </FlowShell>
</template>
