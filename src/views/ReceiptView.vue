<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FlowShell from '@/components/v7/FlowShell.vue'
import Receipt from '@/components/v7/Receipt.vue'
import Stamp from '@/components/v7/Stamp.vue'
import LinePill from '@/components/v7/LinePill.vue'
import Modal from '@/components/v7/Modal.vue'
import ShareCard from '@/components/v7/ShareCard.vue'
import Row from '@/components/v7/Row.vue'
import Field from '@/components/v7/Field.vue'
import { usePortfolioData } from '@/composables/usePortfolioData'
import { bigPct, money, useLinesResult, whole } from '@/composables/useLinesResult'
import { useDemoStore } from '@/state/demo'
import { useCatalogStore } from '@/state/catalog'

const route = useRoute()
const router = useRouter()
const demo = useDemoStore()
const catalog = useCatalogStore()
const data = usePortfolioData()
const r = useLinesResult(data)

const dialog = computed(() => route.query.dialog)
const close = () => router.replace('/check/receipt')
const email = ref(demo.account?.email ?? '')

const pct = computed(() => bigPct(r.flagged.value.share))
const body = computed(() =>
  r.flagged.value.count
    ? `That’s ${whole(r.flagged.value.usd)} of your ${whole(r.totalUsd.value)} in ${r.fund.value}, across ${r.flagged.value.count} companies. Every flag has a source.`
    : `None of your ${whole(r.totalUsd.value)} in ${r.fund.value} goes to companies that cross your lines.`,
)
const per100 = computed(() => r.lines.value.slice(0, 3).map((l) => ({ label: l.label, sub: l.top[0] ? data.nameOf(l.top[0].ticker) : '', amount: money(l.share * 100) })))
const stickers = computed(() => r.lines.value.slice(0, 2).map((l) => ({ label: l.label, color: l.color })))

function seeInside() {
  if (demo.hasAccount) router.push('/home')
  else router.replace('/check/receipt?dialog=save')
}
function save() {
  if (!email.value.includes('@')) return
  demo.createAccount(email.value)
  router.push('/home')
}
</script>

<template>
  <FlowShell close="/home" label=" " :body="r.ready.value ? body : 'Reading your fund…'">
    <template #title>
      <h1 class="display title"><span>{{ r.ready.value ? pct : '…' }}</span> crosses<br />your lines.</h1>
    </template>
    <template #left>
      <div class="btns">
        <RouterLink to="/check/receipt?dialog=share" class="btn btn-primary btn-block">Share Your Receipt</RouterLink>
        <button class="btn btn-secondary btn-block" @click="seeInside">See What’s Inside</button>
      </div>
    </template>
    <div v-if="r.ready.value" class="visual">
      <Receipt
        :rotate="3"
        :meta="`Receipt · ${r.fund.value} · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`"
        :rows="r.receiptRows.value.length ? r.receiptRows.value : [{ label: 'Nothing flagged', sub: 'on your lines', amount: '$0.00' }]"
        :total="money(r.flagged.value.usd)"
        :total-sub="`of your ${whole(r.totalUsd.value)} in ${r.fund.value}`"
        :rest="money(r.totalUsd.value - r.flagged.value.usd)"
        :total-color="r.flagged.value.count ? 'var(--flare)' : 'var(--ink)'"
      />
      <Stamp class="stamp" :value="pct" />
      <LinePill v-for="(s, i) in stickers" :key="s.label" :class="i ? 's2' : 's1'" :label="s.label" :color="s.color" size="md" :flag="false" :rotate="i ? 6 : -10" />
    </div>
    <div v-else-if="data.status.value === 'error'" class="card-pad"><p class="dim">The data didn’t come through. <RouterLink to="/check/printing" class="lnk">Try again</RouterLink>.</p></div>
  </FlowShell>

  <Modal v-if="dialog === 'share' && r.ready.value" title="Share your receipt" @close="close">
    <div class="preview">
      <ShareCard :pct="pct" :fund="r.fund.value" :rows="per100" :total="money(r.flagged.value.share * 100)" :rest="money(100 - r.flagged.value.share * 100)" :stickers="stickers" />
    </div>
    <button class="btn btn-primary btn-block" @click="close">Share…</button>
    <button class="btn btn-secondary btn-block" @click="close">Save Image</button>
    <p class="caption center">Shows holdings and lines only, never balances or returns.</p>
  </Modal>

  <Modal v-if="dialog === 'save'" title="Save your lines" @close="router.push('/home')">
    <p class="dim save-body">Make a free account to keep your {{ catalog.selectedIds.length }} lines and hear when a company you own has something new on file.</p>
    <div class="list">
      <Row :title="`Your ${catalog.selectedIds.length} lines, saved`" icon="check" />
      <Row title="Updates when something new is on file" icon="check" />
      <Row title="Check another fund any time" icon="check" />
    </div>
    <Field v-model="email" label="Email" placeholder="you@example.com" type="email" />
    <button class="btn btn-primary btn-block" :class="{ off: !email.includes('@') }" @click="save">Create Free Account</button>
    <RouterLink to="/home" class="btn-link" style="align-self: flex-start">Not Now</RouterLink>
    <p class="caption">Free. This demo keeps your email on this device only.</p>
  </Modal>
</template>

<style scoped>
.title { font-size: 112px; color: var(--cream); }
.title span { color: var(--flare); }
.btns { margin-top: 30px; width: 440px; display: flex; flex-direction: column; gap: 10px; }
.visual { position: relative; display: flex; justify-content: center; padding: 40px 0 20px 40px; }
.stamp { position: absolute; top: 8px; right: 30px; }
.s1 { position: absolute; left: -10px; top: 120px; }
.s2 { position: absolute; left: -20px; bottom: 50px; }
.preview { display: flex; justify-content: center; }
.center { text-align: center; }
.save-body { font-size: 15px; line-height: 1.45; }
.lnk { color: var(--link); }
.off { opacity: 0.45; pointer-events: none; }
</style>
