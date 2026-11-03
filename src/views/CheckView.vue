<script setup>
import LinePicker from '@/components/receipt/LinePicker.vue'
import LineupTable from '@/components/receipt/LineupTable.vue'
import ReceiptStats from '@/components/receipt/ReceiptStats.vue'
import { getDemoKey, readHoldingsFromScreenshot, setDemoKey } from '@/utils/claudeVision'
import { EXAMPLE_PORTFOLIOS, checkPortfolio, parseHoldings } from '@/utils/lines'
import { useLinesStore } from '@/stores/lines'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

const tabs = [
  { key: 'example', label: 'Pick an example' },
  { key: 'type', label: 'Type them in' },
  { key: 'upload', label: 'Upload a screenshot' },
]
const tab = ref('example')

const positions = ref(EXAMPLE_PORTFOLIOS[0].positions)
const source = ref(EXAMPLE_PORTFOLIOS[0].name)
const { lineKeys } = storeToRefs(useLinesStore())

const result = computed(() => checkPortfolio(positions.value, lineKeys.value))

function useExample(ex) {
  positions.value = ex.positions
  source.value = ex.name
}

// Type them in
const typed = ref('VOO 60%\nQQQ 25%\nLOOP 15%')
const typedError = ref('')
function checkTyped() {
  const parsed = parseHoldings(typed.value)
  if (!parsed.length) {
    typedError.value = 'Try tickers like "VOO 60%, QQQ 40%", one per line or separated by commas.'
    return
  }
  typedError.value = ''
  positions.value = parsed
  source.value = 'Your list'
}

// Upload a screenshot
const apiKey = ref(getDemoKey())
const showKey = ref(false)
const uploading = ref(false)
const uploadNote = ref('')
const uploadError = ref('')
function saveKey() {
  setDemoKey(apiKey.value)
  showKey.value = false
}
async function onFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  uploadError.value = ''
  uploadNote.value = ''
  if (!apiKey.value) {
    // Demo fallback: pretend the screenshot held the "brand-loyal app account" example.
    const ex = EXAMPLE_PORTFOLIOS[1]
    positions.value = ex.positions
    source.value = `${file.name} (sample result)`
    uploadNote.value = 'Demo mode: showing a sample result. Add a Claude API key below to read the real screenshot.'
    return
  }
  uploading.value = true
  try {
    const found = await readHoldingsFromScreenshot(file, apiKey.value)
    if (!found.length) throw new Error("We couldn't spot any holdings in that image.")
    const text = found.map((h) => (h.value ? `${h.symbol} ${h.value}` : h.symbol)).join('\n')
    positions.value = parseHoldings(text)
    source.value = file.name
    uploadNote.value = `Read ${found.length} holdings: ${found.map((h) => h.symbol).join(', ')}.`
  } catch (err) {
    uploadError.value = err.message
  } finally {
    uploading.value = false
  }
}

const portfolioLabel = computed(() => (positions.value.length === 1 ? `your ${positions.value[0].symbol}` : 'your portfolio'))
</script>

<template>
  <div class="check ground-blue">
    <section class="container check__head">
      <p class="label-mono check__eyebrow">Quick check · no account, nothing linked</p>
      <h1 class="h-1 shout-shadow">What's actually in <span class="pink">your portfolio?</span></h1>
      <p class="check__lead">Pick an example, type a few tickers, or drop in a screenshot. We look inside your funds and show who crosses your lines.</p>
    </section>

    <section class="container">
      <div class="panel sticker">
        <div class="tabs-row" role="tablist">
          <button v-for="t in tabs" :key="t.key" type="button" role="tab" class="tab-btn" :class="{ 'is-on': tab === t.key }" :aria-selected="tab === t.key" @click="tab = t.key">
            {{ t.label }}
          </button>
        </div>

        <div v-if="tab === 'example'" class="examples">
          <button
            v-for="ex in EXAMPLE_PORTFOLIOS"
            :key="ex.key"
            type="button"
            class="example"
            :class="{ 'is-on': source === ex.name }"
            :aria-pressed="source === ex.name"
            @click="useExample(ex)"
          >
            <span class="example__name">{{ ex.name }}</span>
            <span class="example__blurb">{{ ex.blurb }}</span>
            <span class="example__tickers mono">{{ ex.positions.map((p) => `${p.symbol} ${p.weight}%`).join(' · ') }}</span>
          </button>
        </div>

        <div v-else-if="tab === 'type'" class="typed">
          <label class="label" for="typed">Your holdings</label>
          <textarea id="typed" v-model="typed" class="input mono" rows="5" />
          <p class="field-hint">One per line or comma-separated. Add % or $ amounts, or leave them off for equal slices.</p>
          <p v-if="typedError" class="field-error">{{ typedError }}</p>
          <button type="button" class="btn btn-primary" @click="checkTyped">Check these ↗</button>
        </div>

        <div v-else class="upload">
          <label class="drop">
            <input type="file" accept="image/*" class="sr-only" @change="onFile" />
            <span class="drop__title">{{ uploading ? 'Reading your screenshot…' : 'Drop a screenshot of your holdings' }}</span>
            <span class="drop__sub">From Robinhood, Fidelity, Schwab, anything. It stays on this computer except for the read.</span>
          </label>
          <p v-if="uploadNote" class="callout callout-sun">{{ uploadNote }}</p>
          <p v-if="uploadError" class="callout callout-coral">{{ uploadError }}</p>
          <div class="keybox">
            <button type="button" class="link-btn" @click="showKey = !showKey">
              {{ apiKey ? 'Claude API key saved in this browser' : 'Demo setting: add a Claude API key' }} {{ showKey ? '▴' : '▾' }}
            </button>
            <div v-if="showKey" class="keybox__form">
              <input v-model="apiKey" type="password" class="input" placeholder="sk-ant-…" autocomplete="off" />
              <button type="button" class="btn btn-dark" @click="saveKey">Save</button>
              <p class="field-hint">Saved only in this browser for live demos. Never put a key in the code.</p>
            </div>
          </div>
        </div>

        <div class="current">
          <span class="label-mono">Checking:</span>
          <strong>{{ source }}</strong>
          <span class="current__chips">
            <span v-for="p in positions" :key="p.symbol" class="chip">{{ p.symbol }} {{ Math.round(p.weight) }}%</span>
          </span>
        </div>
        <p v-if="result.unknown.length" class="current__unknown">
          Not in our sample data yet: {{ result.unknown.join(', ') }}. Their slices are left out.
        </p>
      </div>
    </section>

    <section class="container check__lines">
      <h2 class="h-2 shout-shadow">Draw your lines.</h2>
      <LinePicker v-model="lineKeys" />
    </section>

    <section class="container check__result">
      <ReceiptStats :result="result" :label="portfolioLabel" :has-lines="lineKeys.length > 0" eyebrow="Your receipt" />
      <LineupTable :result="result" note="Your biggest companies after looking inside your funds" class="check__lineup" />
    </section>

    <section class="container check__next">
      <RouterLink to="/browse" class="btn btn-primary">Browse every company ↗</RouterLink>
      <RouterLink :to="{ path: '/login', query: { demo: 1 } }" class="check__snoop">See the full dashboard →</RouterLink>
    </section>
  </div>
</template>

<style scoped>
.check {
  padding-bottom: 72px;
}
.pink {
  color: var(--bubblegum);
}
.check__head {
  padding-top: 40px;
  padding-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.check__eyebrow {
  color: var(--sun);
}
.check__head h1 {
  max-width: 1000px;
  font-size: clamp(52px, 7vw, 112px);
}
.check__lead {
  max-width: 640px;
  font-size: 20px;
  font-weight: 500;
}
.panel {
  background: var(--cream);
  color: var(--ink);
  padding: 24px 28px 22px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.tabs-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.tab-btn {
  min-height: 44px;
  padding: 0 18px;
  border: var(--outline-thin);
  border-radius: 999px;
  font-weight: 700;
  background: var(--surface);
}
.tab-btn.is-on {
  background: var(--ink-solid);
  color: var(--cream);
  box-shadow: 3px 3px 0 var(--sun);
}
.examples {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 14px;
}
.example {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 16px 18px;
  border: var(--outline-thin);
  border-radius: 18px;
  background: var(--surface);
  text-align: left;
}
.example:hover {
  background: var(--sun-100);
}
.example.is-on {
  background: var(--sun);
  box-shadow: var(--shadow-sm);
}
.example__name {
  font-family: var(--font-display);
  font-size: 24px;
  line-height: 1.05;
  text-transform: uppercase;
}
.example__blurb {
  font-size: 15px;
}
.example__tickers {
  font-size: 12.5px;
  font-weight: 600;
}
.typed {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  max-width: 560px;
}
.typed textarea {
  font-size: 16px;
}
.upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.drop {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 36px 24px;
  border: 3px dashed var(--ink-solid);
  border-radius: 20px;
  background: var(--surface);
  text-align: center;
  cursor: pointer;
}
.drop:hover {
  background: var(--sun-100);
}
.drop__title {
  font-family: var(--font-display);
  font-size: 30px;
  text-transform: uppercase;
}
.drop__sub {
  color: var(--muted);
}
.link-btn {
  font-weight: 700;
  font-size: 14px;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.keybox__form {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  max-width: 560px;
}
.keybox__form .input {
  flex: 1 1 280px;
}
.current {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding-top: 16px;
  border-top: 2px solid var(--ink-solid);
}
.current__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.current__unknown {
  font-size: 14px;
  color: var(--muted);
}
.check__lines {
  padding-top: 64px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.check__lines h2 {
  color: var(--cream);
  font-size: clamp(44px, 6vw, 88px);
}
.check__result {
  padding-top: 56px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}
.check__next {
  padding-top: 48px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
}
.check__snoop {
  font-weight: 700;
  font-size: 18px;
  text-decoration: underline;
  text-underline-offset: 4px;
}
</style>
