<script setup lang="ts">
// The upgrade wall. This PR only wires the gate: "Start paid plan (demo)" sets the plan and
// returns to where the user was going. The pricing card is built with F5.
import { safeNext } from '@/router/gate'
import { useDemoStore } from '@/state/demo'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const demo = useDemoStore()
const route = useRoute()
const router = useRouter()

const next = computed(() => safeNext(route.query.next))

function start() {
  demo.upgrade()
  router.replace(next.value)
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <p class="eyebrow">Your Rally · Upgrade</p>
      <h1 class="page-title">Let Rally keep watch.</h1>
      <p class="lead">Connecting a brokerage, live monitoring and approval-gated trades are on the paid plan.</p>
    </header>
    <section class="card card-pad wall">
      <p class="label-mono">{{ demo.isPaid ? 'You are on the paid plan (demo)' : 'Simulated upgrade · no payment form' }}</p>
      <div class="wall__actions">
        <button v-if="!demo.isPaid" type="button" class="btn btn-primary" @click="start">Start paid plan (demo)</button>
        <RouterLink v-else :to="next" class="btn btn-primary">Continue</RouterLink>
        <RouterLink to="/portfolio" class="btn btn-outline">Not now</RouterLink>
      </div>
      <p class="small">The pricing comparison arrives with F5 in a later pull request.</p>
    </section>
  </div>
</template>

<style scoped>
.wall {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 18px;
}
.wall__actions {
  display: flex;
  gap: 12px;
}
</style>
