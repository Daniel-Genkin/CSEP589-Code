<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FlowShell from '../components/FlowShell.vue'
import Receipt from '../components/Receipt.vue'
import Stamp from '../components/Stamp.vue'
import LinePill from '../components/LinePill.vue'
import Modal from '../components/Modal.vue'
import ShareCard from '../components/ShareCard.vue'
import Row from '../components/Row.vue'
import Field from '../components/Field.vue'
import { state } from '../data.js'

const route = useRoute()
const router = useRouter()
const dialog = computed(() => route.query.dialog)
const close = () => router.replace('/check/receipt')
const email = ref('')
const body = computed(() =>
  state.amount
    ? `That’s $${Math.round(state.amount * 0.13).toLocaleString('en-US')} of your $${state.amount.toLocaleString('en-US')} in VOO, across 5 companies. Every flag has a source.`
    : 'That’s $13 of every $100 in VOO, across 5 companies. Every flag has a source.',
)
</script>

<template>
  <FlowShell close="/home" label=" " :body="body">
    <template #title><h1 class="display title"><span>13%</span> crosses<br />your lines.</h1></template>
    <template #left>
      <div class="btns">
        <RouterLink to="/check/receipt?dialog=share" class="btn btn-primary btn-block">Share Your Receipt</RouterLink>
        <RouterLink to="/check/receipt?dialog=save" class="btn btn-secondary btn-block">See What’s Inside</RouterLink>
      </div>
    </template>
    <div class="visual">
      <Receipt :rotate="3" />
      <Stamp class="stamp" />
      <LinePill class="s1" label="Data privacy" color="var(--pink)" size="md" :flag="false" :rotate="-10" />
      <LinePill class="s2" label="Environment & climate" color="var(--sun)" size="md" :flag="false" :rotate="6" />
    </div>
  </FlowShell>

  <Modal v-if="dialog === 'share'" title="Share your receipt" @close="close">
    <div class="preview"><ShareCard /></div>
    <button class="btn btn-primary btn-block" @click="close">Share…</button>
    <button class="btn btn-secondary btn-block" @click="close">Save Image</button>
    <p class="caption center">Shows holdings and lines only, never balances or returns.</p>
  </Modal>

  <Modal v-if="dialog === 'save'" title="Save your lines" @close="router.push('/home')">
    <p class="dim save-body">Make a free account to keep your {{ state.lines.length }} lines and hear when a company you own has something new on file.</p>
    <div class="list">
      <Row :title="`Your ${state.lines.length} lines, saved`" icon="check" />
      <Row title="Updates when something new is on file" icon="check" />
      <Row title="Check another fund any time" icon="check" />
    </div>
    <Field v-model="email" label="Email" placeholder="you@example.com" type="email" />
    <RouterLink to="/signin/code" class="btn btn-primary btn-block">Continue with Email</RouterLink>
    <RouterLink to="/home" class="btn-link" style="align-self: flex-start">Not Now</RouterLink>
    <p class="caption">Free. No password needed.</p>
  </Modal>
</template>

<style scoped>
.title { font-size: 112px; color: var(--cream); }
.title span { color: var(--flare); }
.btns { margin-top: 30px; width: 440px; display: flex; flex-direction: column; gap: 10px; }
.visual { position: relative; display: flex; justify-content: center; padding: 40px 0 20px 40px; }
.stamp { position: absolute; top: 8px; right: 30px; }
.s1 { position: absolute; left: 30px; top: 120px; }
.s2 { position: absolute; left: 10px; bottom: 60px; }
.preview { display: flex; justify-content: center; }
.center { text-align: center; }
.save-body { font-size: 15px; line-height: 1.45; }
</style>
