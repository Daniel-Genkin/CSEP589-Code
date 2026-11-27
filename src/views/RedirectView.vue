<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/v7/AppShell.vue'
import Row from '@/components/v7/Row.vue'
import Modal from '@/components/v7/Modal.vue'

const route = useRoute()
const router = useRouter()
const setup = computed(() => route.query.dialog === 'setup')
</script>

<template>
  <AppShell active="home" back-label="Redirect Deposits" title="Change where new money goes." body="Keep VOO as it is and send future deposits to your basket instead.">
    <div class="col">
      <div class="card-pad">
        <p class="label">Each month</p>
        <p class="display amt">$100</p>
      </div>
      <div class="list">
        <Row title="From" right="VOO" />
        <Row title="To" right="Your basket" />
        <Row title="Starts" right="Not set up" />
      </div>
      <RouterLink to="/redirect?dialog=setup" class="btn btn-primary btn-block">Set Up</RouterLink>
      <p class="caption center">Demo only. No money moves.</p>
    </div>
  </AppShell>
  <Modal v-if="setup" title="Turn on redirect" @close="router.replace('/redirect')">
    <p class="dim body">Starting Dec 1, your $100 monthly deposit goes to your basket instead of VOO. Your VOO shares stay where they are.</p>
    <div class="list" style="background: var(--ink)">
      <Row title="Each month" right="$100" />
      <Row title="From" right="VOO" />
      <Row title="To" right="Your basket" />
      <Row title="Starts" right="Dec 1" />
    </div>
    <RouterLink to="/home" class="btn btn-primary btn-block">Turn On</RouterLink>
    <button class="btn-link" style="align-self: flex-start" @click="router.replace('/redirect')">Cancel</button>
    <p class="caption">You can turn this off any time.</p>
  </Modal>
</template>

<style scoped>
.col { width: 600px; display: flex; flex-direction: column; gap: 14px; }
.amt { font-size: 96px; color: var(--cream); margin-top: 6px; }
.center { text-align: center; }
.body { font-size: 15px; line-height: 1.45; }
</style>
