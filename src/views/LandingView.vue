<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Check, Plus, Minus } from '@lucide/vue'
import LinePill from '@/components/v7/LinePill.vue'
import BrowserWindow from '@/components/v7/BrowserWindow.vue'
import BasketCompare from '@/components/v7/BasketCompare.vue'
import UpdateCard from '@/components/v7/UpdateCard.vue'
import ShareCard from '@/components/v7/ShareCard.vue'
import LiveCheck from '@/components/v7/LiveCheck.vue'
import HowSteps from '@/components/v7/HowSteps.vue'
import StatCount from '@/components/v7/StatCount.vue'
import HomeView from '@/components/v7/previews/SampleHome.vue'
import ExploreView from '@/components/v7/previews/SampleExplore.vue'
import { TICKER } from '@/landing/sample.js'
import { useCheckStore } from '@/state/check'
import { startScroll, scrollY, useInView, pageProgress, clamp, reduced } from '@/v7/scroll.js'

const router = useRouter()
const sections = { how: ref(null), explore: ref(null), sources: ref(null), faq: ref(null) }
const go = (k) => sections[k].value?.scrollIntoView({ behavior: 'smooth', block: 'start' })

// Fund search with suggestions
const SUGGEST = [
  { tk: 'VOO', name: 'Vanguard S&P 500 ETF' },
  { tk: 'VTI', name: 'Vanguard Total Stock Market ETF' },
  { tk: 'QQQ', name: 'Invesco QQQ Trust' },
  { tk: 'SCHD', name: 'Schwab US Dividend Equity ETF' },
  { tk: 'IVV', name: 'iShares Core S&P 500 ETF' },
  { tk: 'SPY', name: 'SPDR S&P 500 ETF Trust' },
  { tk: 'VXUS', name: 'Vanguard Total International Stock ETF', unsupported: true },
]
const query = ref('VOO')
const open = ref(false)
const matches = computed(() => {
  const q = query.value.trim().toUpperCase()
  return SUGGEST.filter((f) => !q || f.tk.startsWith(q) || f.name.toUpperCase().includes(q)).slice(0, 5)
})
const picked = computed(() => SUGGEST.find((f) => f.tk === query.value.trim().toUpperCase()))
function choose(f) {
  query.value = f.tk
  open.value = false
}
const checkFlow = useCheckStore()
function check(tk = query.value) {
  const t = (tk || '').trim().toUpperCase()
  if (!t) return
  checkFlow.input = t
  router.push('/check/lines')
}

// Pills drift on their own and lean toward the mouse; blurred ones sit further back.
const heroPills = [
  { label: 'Environment & climate', color: 'var(--sun)', x: 92, y: 134, r: -7, d: 18, dur: 7 },
  { label: 'Military & defense', color: 'var(--flare)', x: 1150, y: 132, r: 8, d: 22, dur: 8 },
  { label: 'Labor practices', color: 'var(--link)', x: 18, y: 392, r: 6, blur: 7, d: 8, dur: 9 },
  { label: 'Data privacy', color: 'var(--pink)', x: 1204, y: 386, r: -8, blur: 7, d: 8, dur: 10 },
  { label: 'Human rights & conflict', color: 'var(--violet)', x: 120, y: 574, r: -4, d: 26, dur: 7.5 },
  { label: 'Political donations', color: 'var(--cream)', x: 1020, y: 578, r: 5, d: 20, dur: 8.5 },
]
const hero = ref(null)
const mx = ref(0)
const my = ref(0)
function onMove(e) {
  if (reduced) return
  const r = hero.value.getBoundingClientRect()
  mx.value = (e.clientX - r.left) / r.width - 0.5
  my.value = (e.clientY - r.top) / r.height - 0.5
}

// Scroll-linked motion. Everything reads one shared scroll position.
onMounted(startScroll)
const sy = computed(() => (reduced ? 0 : scrollY.value))
const tilt = computed(() => Math.max(0, 14 - sy.value / 28))
const msgStyle = computed(() => ({ transform: `translateY(${sy.value * 0.32}px)`, opacity: clamp(1 - sy.value / 620) }))
const pillStyle = (p, i) => ({
  left: p.x + 'px',
  top: p.y + 'px',
  transform: `translate3d(${mx.value * p.d * 2}px, ${my.value * p.d * 2 - sy.value * (p.d / 36)}px, 0)`,
  animationDuration: p.dur + 's',
  animationDelay: -i * 1.3 + 's',
})
const tickerShift = computed(() => `translateX(${-sy.value * 0.3}px)`)

// Held back until you start scrolling: the product window rises in, the glass cards slide in.
const winK = computed(() => (reduced ? 1 : clamp(sy.value / 340)))
const winStyle = computed(() => ({
  transform: `perspective(1800px) translateY(${(1 - winK.value) * 240}px) rotateX(${tilt.value}deg) scale(${0.9 + winK.value * 0.1})`,
  opacity: 0.12 + winK.value * 0.88,
}))
const cardK = computed(() => (reduced ? 1 : clamp((sy.value - 110) / 260)))
const cardStyle = (side) => ({
  transform: `translateX(${(1 - cardK.value) * 320 * side}px) rotate(${(1 - cardK.value) * 10 * side}deg)`,
  opacity: cardK.value,
})
const hintOp = computed(() => clamp(1 - sy.value / 140))

const exploreSeen = useInView(sections.explore)
const exploreK = computed(() => clamp(exploreSeen.value * 2.4))
const closingRef = ref(null)
const closingSeen = useInView(closingRef)
const closeK = computed(() => clamp((closingSeen.value - 0.08) * 2.6))
const giantRef = ref(null)
const giantSeen = useInView(giantRef)

const faqs = ref([
  { q: 'Does Rally tell me what to buy?', a: 'No. Rally shows what’s in your fund and where each flag comes from. What you do with it is up to you.', open: true },
  { q: 'Where does the data come from?', a: 'Public records: federal contracts, company filings, and agency or court records. Each flag links to the record it came from.', open: true },
  { q: 'Do I need an account?', a: 'No. You can check a fund without one. Make a free account if you want to save your lines and get updates.', open: false },
  { q: 'If I build a basket, who holds my money?', a: 'Alpaca Securities, a registered broker. Rally never holds your money.', open: false },
  { q: 'What gets shared when I share my receipt?', a: 'Only your holdings and your lines. Never your balance or returns.', open: false },
])

const footer = [
  { h: 'Product', links: [['Check a fund', '/check'], ['Explore', '/explore'], ['Basket', '/basket'], ['Updates', '/receipts']] },
  { h: 'Company', links: [['About'], ['Survey results'], ['Contact'], ['Careers']] },
  { h: 'Resources', links: [['Sources and methods', 'sources'], ['FAQ', 'faq'], ['Help center']] },
  { h: 'Legal', links: [['Terms'], ['Privacy'], ['Disclosures']] },
]
function footLink(to) {
  if (!to) return
  if (to.startsWith('/')) router.push(to)
  else go(to)
}
</script>

<template>
  <div class="landing">
    <!-- Nav stays on top while you scroll -->
    <nav class="nav">
      <RouterLink to="/" class="display logo">Rally</RouterLink>
      <div class="links">
        <button @click="go('how')">How It Works</button>
        <button @click="go('explore')">Explore</button>
        <button @click="go('sources')">Sources</button>
        <RouterLink to="/plans">Pricing</RouterLink>
        <button @click="go('faq')">FAQ</button>
      </div>
      <div class="actions">
        <RouterLink to="/signin" class="signin">Sign In</RouterLink>
        <RouterLink to="/check" class="btn btn-primary" style="height: 48px">Check Your Fund</RouterLink>
      </div>
      <i class="prog" :style="{ transform: `scaleX(${pageProgress})` }" />
    </nav>

    <!-- Hero -->
    <section ref="hero" class="hero" @mousemove="onMove" @mouseleave="mx = 0; my = 0">
      <div class="glow" aria-hidden="true" :style="{ transform: `translateY(${sy * 0.4}px)` }" />
      <div class="stage">
        <span v-for="(p, i) in heroPills" :key="p.label" class="hp" :style="pillStyle(p, i)">
          <RouterLink to="/check/lines" class="pop-in" :style="{ animationDelay: 0.55 + i * 0.09 + 's' }"><LinePill :label="p.label" :color="p.color" :rotate="p.r" :blur="p.blur || 0" /></RouterLink>
        </span>

        <div class="message intro" :style="msgStyle">
          <RouterLink to="/explore" class="announce"><span class="new mono">New</span>Explore who’s linked to what <span class="dim">→</span></RouterLink>
          <h1 class="display h1">Who’s in <span>your fund?</span></h1>
          <p class="sub">Rally checks every company in your index fund against the issues you care about. It’s free, and you don’t need an account.</p>
          <form class="search" @submit.prevent="check()">
            <Search :size="20" color="var(--dim)" />
            <input
              v-model="query"
              aria-label="Fund ticker"
              class="fund"
              maxlength="6"
              autocomplete="off"
              @focus="open = true"
              @input="open = true"
              @blur="open = false"
            />
            <span class="fund-name">{{ picked ? picked.name : 'Type a ticker, like VOO' }}</span>
            <button class="btn btn-primary" type="submit" style="height: 56px; padding: 0 30px">Check Fund</button>
            <div v-if="open && matches.length" class="suggest" role="listbox">
              <button v-for="f in matches" :key="f.tk" type="button" class="sg" role="option" @mousedown.prevent="choose(f)">
                <span class="tk mono">{{ f.tk }}</span>
                <span class="sn">{{ f.name }}</span>
                <span v-if="f.unsupported" class="sb mono">Not yet</span>
                <span v-else class="sb mono ok">Ready</span>
              </button>
            </div>
          </form>
          <div class="popular">
            <span class="label">Popular</span>
            <button v-for="t in ['VTI', 'QQQ', 'SCHD', 'IVV', 'VXUS']" :key="t" class="pop mono" @click="check(t)">{{ t }}</button>
          </div>
        </div>

        <div class="hero-window" :style="winStyle">
          <BrowserWindow label="Rally · Home" :width="1200" :height="640"><HomeView /></BrowserWindow>
        </div>
        <div class="fade" />

        <div class="hint mono" :style="{ opacity: hintOp }" aria-hidden="true">Scroll<span class="mouse"><i /></span></div>

        <RouterLink to="/breakdown" class="glass g-left" :style="cardStyle(-1)">
          <p class="label"><i class="dot" style="background: var(--sun)" /> Environment &amp; climate</p>
          <p class="amt">$60.00</p>
          <p class="dim gs">ExxonMobil · 3.0% of your VOO</p>
          <hr class="rule" />
          <p class="gsrc"><span class="mono mute">Source</span> <span class="lnk">EPA ECHO →</span></p>
        </RouterLink>
        <RouterLink to="/receipts" class="glass g-right" :style="cardStyle(1)">
          <p class="label" style="color: var(--sun)"><i class="dot" style="background: var(--flare)" /> Updated today</p>
          <p class="gt">Lockheed Martin</p>
          <p class="dim gs">A new federal contract is on file. It’s on your Military &amp; defense line.</p>
          <p class="gsrc"><span class="mono mute">Source</span> <span class="lnk">USAspending.gov →</span></p>
        </RouterLink>
      </div>
    </section>

    <!-- Record ticker -->
    <section :ref="(el) => (sections.sources.value = el)" class="ticker-sec">
      <p v-reveal="{ y: 24 }" class="dim">Every flag links to the public record it came from.</p>
      <div v-reveal="{ x: 160, y: 0, delay: 0.1 }" class="marquee">
        <div :style="{ transform: tickerShift }">
        <div class="track">
          <span v-for="(t, i) in [...TICKER, ...TICKER]" :key="i" class="rec">
            <i class="dot" :style="{ background: t.color }" />
            <b class="mono">{{ t.tk }}</b>
            <span class="dim">{{ t.what }}</span>
            <span class="mono lnk">{{ t.src }} ↗</span>
          </span>
        </div>
        </div>
      </div>
    </section>

    <!-- Try it: the receipt reprints as you pick a fund, lines and an amount -->
    <section class="sec"><LiveCheck /></section>

    <!-- Feature: explore -->
    <section :ref="(el) => (sections.explore.value = el)" class="sec feature flip">
      <div class="visual" :style="{ transform: `perspective(1400px) rotateY(${(1 - exploreK) * 16}deg) scale(${0.82 + exploreK * 0.18})`, opacity: 0.3 + exploreK * 0.7 }">
        <BrowserWindow label="Rally · Explore" :width="581" :height="600"><ExploreView /></BrowserWindow>
      </div>
      <div v-stagger="{ x: 70, y: 0 }" class="text">
        <p class="eyebrow">Explore</p>
        <h2 class="h2">“Which funds hold Lockheed Martin?”</h2>
        <p class="lead">A searchable record of which companies are tied to which issues, and which funds hold them. Rally doesn’t score or rank anyone.</p>
        <ul class="points">
          <li><Check :size="14" /> Latest contracts and filings, each with its source</li>
          <li><Check :size="14" /> How much of each fund is tied to each issue</li>
          <li><Check :size="14" /> What the record shows, and what came back clean</li>
        </ul>
        <RouterLink to="/explore" class="arrow-link">Open Explore →</RouterLink>
      </div>
    </section>

    <!-- What you can do -->
    <section class="sec">
      <div v-stagger="{ y: 50 }" class="head2">
        <div>
          <p class="eyebrow">After the check</p>
          <h2 class="h2">What you can do next.</h2>
        </div>
        <p class="lead">Rally shows the record. If you want to act on it, these are here. If not, nothing changes.</p>
      </div>
      <div v-stagger="{ y: 110, scale: 0.9, step: 0.14 }" class="cards">
        <RouterLink to="/basket" class="tile">
          <div class="tv"><div class="tz" style="zoom: 0.74; width: 456px"><BasketCompare fund="VOO" :before="0.13" :after="0.103" :companies-before="503" :companies-after="502" :basket-pct="9.6" :benchmark-pct="10" note="Sample numbers. Past results don’t predict future returns." /></div></div>
          <h3>Build a basket without them</h3>
          <p>Leave out one company or all of them. The rest of your fund fills the gap.</p>
        </RouterLink>
        <RouterLink to="/receipts" class="tile">
          <div class="tv">
            <div class="tz" style="zoom: 0.74; width: 470px">
              <div class="card nu"><b>2 new updates</b><small class="dim">About ExxonMobil and Lockheed Martin</small></div>
              <UpdateCard line="Environment & climate" color="var(--sun)" text="ExxonMobil says it explores for and produces oil and natural gas." tk="XOM" held="3.0% of your VOO" source="corporate.exxonmobil.com" href="https://corporate.exxonmobil.com" style="margin-top: 12px" />
            </div>
          </div>
          <h3>Hear when it matters</h3>
          <p>A weekly digest, or an alert when a company you hold has a new filing.</p>
        </RouterLink>
        <RouterLink to="/check/receipt?dialog=share" class="tile">
          <div class="tv center"><div style="zoom: 0.7"><ShareCard /></div></div>
          <h3>Share your receipt</h3>
          <p>Post your result without showing your balance or returns.</p>
        </RouterLink>
      </div>
    </section>

    <!-- How it works -->
    <section :ref="(el) => (sections.how.value = el)" class="sec">
      <p v-reveal="{ y: 24 }" class="eyebrow">How it works</p>
      <h2 v-reveal="{ y: 60, blur: 6, delay: 0.08 }" class="h2" style="max-width: 640px">From fund to receipt in about a minute.</h2>
      <HowSteps />
    </section>

    <!-- Survey -->
    <section class="sec">
      <div v-stagger="{ y: 50 }" class="head2">
        <div>
          <p class="eyebrow">From our survey</p>
          <h2 class="h2">Built with the people it’s for.</h2>
        </div>
        <p class="lead">Before building Rally, we asked 54 young investors what they’d want from it. Here’s what stood out.</p>
      </div>
      <div v-stagger="{ y: 80, step: 0.12 }" class="stats">
        <div><StatCount class="s" value="61%" /><p>care about human rights, the top issue in the survey.</p></div>
        <div><StatCount class="s" value="63%" /><p>want a one-time check, not another app to watch.</p></div>
        <div><StatCount class="s" value="44%" /><p>would rather see this inside the investing app they already use.</p></div>
        <div><StatCount class="s" value="No. 1" /><p>worry was whether the data is right. So every flag links to its source.</p></div>
      </div>
      <p v-reveal="{ y: 20, delay: 0.5 }" class="caption" style="margin-top: 36px">Survey of 54 people run by the Rally team.</p>
    </section>

    <!-- FAQ -->
    <section :ref="(el) => (sections.faq.value = el)" class="sec faq">
      <div v-stagger="{ x: -50, y: 0 }" class="fl">
        <p class="eyebrow">FAQ</p>
        <h2 class="h2">Questions, answered.</h2>
        <p class="lead">Can’t find what you’re looking for? Write to us and we’ll get back to you.</p>
        <a class="arrow-link">Contact us →</a>
      </div>
      <div v-stagger="{ x: 70, y: 0, step: 0.08, delay: 0.1 }" class="qs">
        <div v-for="f in faqs" :key="f.q" class="q" :class="{ open: f.open }">
          <button class="qh" :aria-expanded="f.open" @click="f.open = !f.open">
            <span>{{ f.q }}</span>
            <Minus v-if="f.open" :size="18" />
            <Plus v-else :size="18" />
          </button>
          <p v-if="f.open" class="qa">{{ f.a }}</p>
        </div>
      </div>
    </section>

    <!-- Closing -->
    <section ref="closingRef" class="sec closing">
      <div class="panel" :style="{ transform: `scale(${0.9 + closeK * 0.1})`, borderRadius: 64 - closeK * 32 + 'px' }">
        <LinePill class="cp cp1" label="Labor practices" color="var(--link)" :rotate="10" :style="{ translate: `${(1 - closeK) * -220}px ${(1 - closeK) * 40}px` }" />
        <LinePill class="cp cp2" label="Human rights & conflict" color="var(--violet)" :rotate="-8" :style="{ translate: `${(1 - closeK) * 240}px ${(1 - closeK) * -30}px` }" />
        <LinePill class="cp cp3" label="Data privacy" color="var(--pink)" :rotate="-7" :style="{ translate: `${(1 - closeK) * -200}px ${(1 - closeK) * 60}px` }" />
        <LinePill class="cp cp4" label="Military & defense" color="var(--flare)" :rotate="9" :style="{ translate: `${(1 - closeK) * 220}px ${(1 - closeK) * 50}px` }" />
        <h2 v-reveal="{ y: 80, scale: 0.92, blur: 8, delay: 0.1 }" class="display ct">Know what you own.</h2>
        <p v-reveal="{ y: 30, delay: 0.25 }" class="cb">Pick your fund, choose your lines, and see your receipt in about a minute.</p>
        <div v-reveal="{ y: 30, delay: 0.35 }" class="cbtns">
          <RouterLink to="/check" class="btn btn-ink" style="height: 56px; padding: 0 30px">Check Your Fund</RouterLink>
          <button class="btn btn-outline-ink" style="height: 56px; padding: 0 30px" @click="go('how')">See How It Works</button>
        </div>
        <p class="fine mono">Free · No account needed · Not investment advice</p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="foot">
      <div class="ftop">
        <div v-reveal="{ y: 30 }" class="brand">
          <p class="display">Rally</p>
          <p class="dim">Know what’s in your fund, and where each flag comes from.</p>
        </div>
        <div v-stagger="{ y: 40, step: 0.08, delay: 0.1 }" class="cols">
          <div v-for="c in footer" :key="c.h">
            <p class="label">{{ c.h }}</p>
            <button v-for="l in c.links" :key="l[0]" class="fl-link" @click="footLink(l[1])">{{ l[0] }}</button>
          </div>
        </div>
      </div>
      <div class="disc">
        <p>Rally is a research tool, not an investment adviser. Nothing on this site is investment advice or a recommendation to buy or sell any security. Rally doesn’t score or rank companies; it shows public records and links to each source. Numbers on this page are sample data.</p>
        <p>Basket orders are placed through Alpaca Securities LLC, member FINRA/SIPC. Investing involves risk, including possible loss of principal. Past results don’t predict future returns.</p>
      </div>
      <p class="copy">© 2026 Rally</p>
      <div ref="giantRef" class="giant" aria-hidden="true"><span class="display" :style="{ transform: `translateY(${(1 - clamp(giantSeen * 2.2)) * 140}px)` }">Rally</span></div>
    </footer>
  </div>
</template>

<style scoped>
.landing { overflow-x: clip; }
.wrap, .sec, .foot { width: min(var(--site-w), calc(100% - 48px)); margin: 0 auto; }

/* nav */
.nav { position: fixed; top: 24px; left: 50%; transform: translateX(-50%); z-index: 50; width: min(var(--site-w), calc(100% - 48px)); height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 8px 0 29px; border-radius: 999px; background: rgba(33, 31, 41, 0.78); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35); }
.logo { font-size: 28px; color: var(--cream); width: 290px; }
.links { display: flex; gap: 36px; font-weight: 500; font-size: 15px; color: var(--dim); }
.links > *:hover { color: var(--white); }
.actions { display: flex; align-items: center; gap: 12px; width: 290px; justify-content: flex-end; }
.signin { font-weight: 600; font-size: 15px; color: var(--white); padding: 0 12px; }
.prog { position: absolute; left: 32px; right: 32px; bottom: -1px; height: 2px; border-radius: 1px; background: var(--sun); transform-origin: left; opacity: 0.9; }
.visual { transition: transform 0.08s linear; will-change: transform; }
.closing .panel { will-change: transform; }
.giant span { will-change: transform; }

/* hero */
.hero { position: relative; height: 1160px; overflow: hidden; }
.glow { position: absolute; inset: 0 0 auto; height: 1000px; background: radial-gradient(45% 55% at 30% -8%, rgba(247, 197, 78, 0.62), transparent 70%), radial-gradient(45% 55% at 72% -6%, rgba(232, 90, 42, 0.55), transparent 70%), radial-gradient(30% 25% at 50% 8%, rgba(255, 244, 214, 0.2), transparent 70%), radial-gradient(50% 22% at 50% 82%, rgba(232, 90, 42, 0.22), transparent 70%); }
.glow::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 35%, var(--ink) 62%, transparent 75%); opacity: 0.6; }
.stage { position: absolute; top: 0; left: 50%; width: 1440px; height: 1160px; transform: translateX(-50%); }
.hp { position: absolute; z-index: 1; transition: transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1); animation: bob 8s ease-in-out infinite; }
.hp a { display: block; transition: scale 0.2s; }
.hp a:hover { scale: 1.06; }
@keyframes bob { 0%, 100% { translate: 0 0; } 50% { translate: 0 -12px; } }
.search { position: relative; }
.suggest { position: absolute; top: calc(100% + 10px); left: 0; right: 0; z-index: 10; padding: 6px; border-radius: 20px; background: rgba(28, 27, 34, 0.97); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5); text-align: left; animation: drop 0.16s ease-out; }
.sg { width: 100%; display: flex; align-items: center; gap: 14px; height: 48px; padding: 0 14px; border-radius: 14px; }
.sg:hover { background: rgba(255, 255, 255, 0.06); }
.sg .tk { width: 46px; font-weight: 500; font-size: 14px; color: var(--cream); }
.sg .sn { flex: 1; font-size: 15px; color: var(--white); }
.sg .sb { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--flare); }
.sg .sb.ok { color: var(--green); }
@keyframes drop { from { opacity: 0; transform: translateY(-6px); } }
.message { position: absolute; top: 150px; left: 0; right: 0; display: flex; flex-direction: column; align-items: center; text-align: center; z-index: 2; }
.announce { display: inline-flex; align-items: center; gap: 10px; height: 38px; padding: 0 14px 0 6px; border-radius: 999px; background: rgba(33, 31, 41, 0.85); border: 1px solid rgba(255, 255, 255, 0.1); font-weight: 500; font-size: 14px; color: var(--white); }
.new { background: var(--sun); color: var(--ink); font-weight: 500; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 9px; border-radius: 999px; }
.h1 { margin-top: 28px; font-size: 138px; color: var(--cream); white-space: nowrap; }
.h1 span { color: var(--sun); }
.sub { margin-top: 26px; max-width: 690px; font-size: 21px; line-height: 1.5; color: rgba(255, 244, 214, 0.82); }
.search { margin-top: 30px; width: 600px; height: 72px; display: flex; align-items: center; gap: 12px; padding: 0 8px 0 24px; border-radius: 999px; background: rgba(28, 27, 34, 0.92); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35); }
.fund { width: 62px; background: none; border: 0; outline: none; font-weight: 500; font-size: 20px; color: var(--white); text-transform: uppercase; border-right: 2px solid var(--sun); }
.fund-name { flex: 1; text-align: left; font-size: 17px; color: var(--dim); }
.popular { margin-top: 26px; display: flex; align-items: center; gap: 10px; }
.pop { height: 32px; padding: 0 14px; border-radius: 999px; border: 1px solid #4a4654; font-weight: 500; font-size: 13px; color: var(--white); }
.pop:hover { border-color: var(--sun); color: var(--sun); }
.hero-window { position: absolute; top: 665px; left: 120px; transform-origin: 50% 0; transition: transform 0.15s linear; will-change: transform; }
.fade { position: absolute; left: 0; right: 0; top: 900px; height: 260px; background: linear-gradient(180deg, transparent, var(--ink) 90%); pointer-events: none; }
.glass { position: absolute; display: flex; flex-direction: column; gap: 10px; padding: 20px 22px; border-radius: 20px; background: rgba(33, 31, 41, 0.72); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 24px 48px rgba(0, 0, 0, 0.45); z-index: 3; transition: translate 0.2s; will-change: transform, opacity; }
.glass:hover { translate: 0 -3px; }

/* hero intro on load */
.intro > * { animation: rise 1s cubic-bezier(0.16, 0.8, 0.2, 1) backwards; }
.intro > :nth-child(1) { animation-delay: 0.05s; }
.intro > :nth-child(2) { animation: rise-big 1.2s cubic-bezier(0.16, 0.8, 0.2, 1) 0.15s backwards; }
.intro > :nth-child(3) { animation-delay: 0.35s; }
.intro > :nth-child(4) { animation-delay: 0.45s; }
.intro > :nth-child(5) { animation-delay: 0.55s; }
@keyframes rise { from { opacity: 0; transform: translateY(30px); } }
@keyframes rise-big { from { opacity: 0; transform: translateY(70px) scale(0.94); filter: blur(10px); } }
.pop-in { animation: pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) backwards; }
@keyframes pop { from { opacity: 0; scale: 0.3; } }
.hint { position: absolute; top: calc(100vh - 110px); left: 50%; transform: translateX(-50%); z-index: 4; display: flex; flex-direction: column; align-items: center; gap: 10px; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--dim); pointer-events: none; }
.mouse { width: 22px; height: 34px; border-radius: 12px; border: 1.5px solid var(--dim); display: flex; justify-content: center; padding-top: 6px; }
.mouse i { width: 3px; height: 7px; border-radius: 2px; background: var(--sun); animation: wheel 1.6s ease-in-out infinite; }
@keyframes wheel { 0% { transform: translateY(0); opacity: 1; } 70% { transform: translateY(10px); opacity: 0; } 100% { opacity: 0; } }
.glass .label { display: inline-flex; align-items: center; gap: 8px; color: var(--dim); font-size: 12px; }
.g-left { left: 52px; top: 958px; width: 264px; }
.g-right { left: 1112px; top: 876px; width: 284px; }
.amt { font-weight: 600; font-size: 34px; letter-spacing: -0.02em; color: var(--cream); }
.gt { font-weight: 600; font-size: 20px; color: var(--cream); }
.gs { font-size: 14px; line-height: 1.45; }
.gsrc { display: flex; gap: 10px; font-size: 14px; }
.gsrc .mono { font-size: 12px; }
.lnk { color: var(--link); font-weight: 500; }

/* ticker */
.ticker-sec { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 52px 0 56px; text-align: center; display: flex; flex-direction: column; gap: 24px; }
.ticker-sec > p { font-size: 15px; }
.marquee { overflow: hidden; mask-image: linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent); -webkit-mask-image: linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent); }
.track { display: flex; gap: 12px; width: max-content; animation: scroll 48s linear infinite; }
.marquee:hover .track { animation-play-state: paused; }
.rec { display: inline-flex; align-items: center; gap: 10px; height: 44px; padding: 0 18px 0 14px; border-radius: 999px; background: var(--surf); border: 1px solid var(--line); font-size: 15px; white-space: nowrap; }
.rec b { font-weight: 500; font-size: 14px; color: var(--cream); }
.rec .lnk { font-size: 13px; font-weight: 400; }
@keyframes scroll { to { transform: translateX(-50%); } }

/* sections */
.sec { padding-top: 136px; }
.eyebrow { margin-bottom: 20px; }
.h2 { font-weight: 600; font-size: 52px; line-height: 58px; letter-spacing: -0.02em; color: var(--cream); }
.lead { font-size: 19px; line-height: 30px; color: var(--dim); }
.feature { display: grid; grid-template-columns: 486px 588px; justify-content: space-between; align-items: center; }
.feature.flip { grid-template-columns: 588px 486px; }
.text { display: flex; flex-direction: column; }
.text .lead { margin-top: 20px; }
.points { list-style: none; padding: 0; margin: 32px 0 0; display: flex; flex-direction: column; gap: 14px; font-size: 16px; color: var(--white); }
.points li { display: flex; align-items: center; gap: 12px; }
.points :deep(svg) { width: 22px; height: 22px; padding: 4px; border-radius: 50%; background: rgba(247, 197, 78, 0.16); color: var(--sun); flex: none; }
.arrow-link { margin-top: 32px; font-weight: 500; font-size: 16px; color: var(--link); cursor: pointer; }
.arrow-link:hover { text-decoration: underline; text-underline-offset: 4px; }
.visual { position: relative; height: 540px; display: flex; align-items: center; justify-content: center; }
.receipt-visual .float { position: relative; transform: translateX(30px); }
.receipt-visual .stamp { position: absolute; top: -48px; right: -70px; }
.st { position: absolute; }
.st1 { left: -96px; top: 64px; }
.st2 { left: -130px; bottom: 26px; }

.head2 { display: grid; grid-template-columns: 588px 486px; justify-content: space-between; align-items: end; }
.cards { margin-top: 56px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.tile { display: flex; flex-direction: column; gap: 10px; padding: 16px 16px 24px; border-radius: 24px; background: var(--surf); border: 1px solid var(--line); }
.tile:hover { border-color: #4a4654; translate: 0 -4px; }
.tv { position: relative; height: 280px; border-radius: 16px; background: var(--ink); overflow: hidden; padding: 16px; margin-bottom: 12px; }
.tv::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 80px; background: linear-gradient(180deg, transparent, var(--ink)); }
.tv.center { display: flex; justify-content: center; }
.nu { display: flex; flex-direction: column; gap: 4px; padding: 16px 20px; }
.nu b { color: var(--white); font-weight: 600; font-size: 17px; }
.tile h3 { font-weight: 600; font-size: 20px; color: var(--white); padding: 0 6px; }
.tile p { font-size: 15px; line-height: 1.5; color: var(--dim); padding: 0 6px; }

.steps { margin-top: 64px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.step { border-top: 1px solid var(--line); padding-top: 24px; display: flex; flex-direction: column; gap: 12px; }
.step .n { color: var(--sun); font-weight: 500; font-size: 14px; }
.step h3 { font-weight: 600; font-size: 22px; color: var(--white); }
.step p:last-child { font-size: 16px; line-height: 1.5; color: var(--dim); max-width: 330px; }

.stats { margin-top: 64px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
.stats > div { border-top: 1px solid var(--line); padding-top: 24px; }
.stats .s { font-size: 72px; color: var(--cream); line-height: 1; margin-bottom: 14px; }
.stats p:last-child { font-size: 16px; line-height: 1.5; color: var(--dim); max-width: 240px; }

.faq { display: grid; grid-template-columns: 384px 690px; justify-content: space-between; }
.fl { display: flex; flex-direction: column; }
.fl .lead { margin-top: 20px; }
.qs { border-top: 1px solid var(--line); }
.q { border-bottom: 1px solid var(--line); }
.qh { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 24px 4px; font-weight: 500; font-size: 19px; color: var(--white); text-align: left; }
.qa { padding: 0 60px 26px 4px; font-size: 16px; line-height: 1.6; color: var(--dim); margin-top: -8px; }

.closing .panel { position: relative; overflow: hidden; border-radius: 32px; background: var(--sun); padding: 100px 40px 90px; text-align: center; color: var(--ink); }
.ct { font-size: 104px; color: var(--ink); }
.cb { margin-top: 24px; font-size: 19px; color: rgba(23, 22, 29, 0.74); }
.cbtns { margin-top: 46px; display: flex; justify-content: center; gap: 12px; }
.fine { margin-top: 30px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(23, 22, 29, 0.6); }
.cp { position: absolute; box-shadow: 0 10px 24px rgba(23, 22, 29, 0.18); }
.cp1 { left: -34px; top: 64px; }
.cp2 { right: 24px; top: 34px; }
.cp3 { left: -40px; bottom: 60px; }
.cp4 { right: 40px; bottom: 26px; }

.foot { padding-top: 112px; }
.ftop { display: flex; justify-content: space-between; gap: 40px; }
.brand .display { font-size: 34px; color: var(--cream); }
.brand p:last-child { margin-top: 14px; font-size: 15px; max-width: 290px; line-height: 1.5; }
.cols { display: grid; grid-template-columns: repeat(4, 150px); gap: 24px; }
.cols .label { margin-bottom: 18px; }
.fl-link { display: block; font-size: 15px; color: var(--white); margin-bottom: 14px; text-align: left; }
.fl-link:hover { color: var(--link); }
.disc { margin-top: 56px; padding: 24px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); display: flex; flex-direction: column; gap: 12px; font-size: 12px; line-height: 1.6; color: var(--mute); }
.copy { margin-top: 24px; font-size: 13px; color: var(--mute); }
.giant { height: 250px; overflow: hidden; margin-top: 40px; }
.giant span { display: block; font-size: 440px; line-height: 1; color: var(--surf); text-align: center; margin-top: -22px; }
</style>
