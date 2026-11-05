<script setup>
import { communityService, copilotService, thesesService } from '@/api'
import ClaimStatusBadge from '@/components/thesis/ClaimStatusBadge.vue'
import CopilotPreview from '@/components/thesis/CopilotPreview.vue'
import CopilotProgress from '@/components/thesis/CopilotProgress.vue'
import PromptBar from '@/components/thesis/PromptBar.vue'
import ThesisCard from '@/components/thesis/ThesisCard.vue'
import AppStoreButtons from '@/components/ui/AppStoreButtons.vue'
import BrandSpiral from '@/components/ui/BrandSpiral.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { useSessionStore } from '@/stores/session'
import { EXAMPLE_IDEAS } from '@/utils/thesis'
import {
  ArrowRight,
  BellRing,
  Check,
  Info,
  Layers,
  Lightbulb,
  Megaphone,
  MessageCircle,
  MessageSquareWarning,
  Quote,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  Wallet,
} from '@lucide/vue'
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const session = useSessionStore()
const router = useRouter()
const toast = useToast()

const idea = ref('')
const status = ref('idle')
const pending = ref(null)
const preview = ref(null)
const error = ref(null)
const resultEl = ref(null)
const heroEl = ref(null)
const promptBar = ref(null)
const continuing = ref(false)

const { data: featured } = useAsync(() => communityService.list({ sort: 'trending', limit: 3 }))
const { data: topTheses } = useAsync(() => communityService.list({ sort: 'top', limit: 8 }))

watch(idea, () => {
  if (error.value?.field) {
    error.value = null
    status.value = 'idle'
  }
})

function revealResult() {
  nextTick(() => {
    const el = resultEl.value
    if (el && el.getBoundingClientRect().top > window.innerHeight * 0.55) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

async function runPreview(text) {
  status.value = 'loading'
  error.value = null
  pending.value = null
  revealResult()
  try {
    pending.value = await copilotService.preview(text)
  } catch (err) {
    status.value = 'error'
    error.value = {
      message: err.message,
      field: err.details?.idea ?? null,
      suggestions: err.details?.suggestions ?? [],
    }
  }
}

function onProgressFinished() {
  preview.value = pending.value
  status.value = 'ready'
  revealResult()
}

function useSuggestion(text) {
  idea.value = text
  runPreview(text)
}

function reset() {
  status.value = 'idle'
  preview.value = null
  idea.value = ''
  heroEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  setTimeout(() => promptBar.value?.focus(), 350)
}

async function continueWorkshop() {
  const text = preview.value.idea
  if (!session.isAuthed) {
    router.push({ name: 'signup', query: { idea: text } })
    return
  }
  continuing.value = true
  try {
    const thesis = await thesesService.create(text)
    router.push(`/app/theses/${thesis.id}`)
  } catch (err) {
    toast.error('Couldn’t save your thesis', { description: err.message })
  } finally {
    continuing.value = false
  }
}

// The tape interleaves the community's most-followed theses with slogans; until they load it runs on slogans alone.
const SLOGANS = ['Pitch it', 'Test it', 'Own it', 'From $10', 'Show your work', 'No tickers needed']
const tapeItems = computed(() => {
  const theses = topTheses.value ?? []
  const items = []
  for (let i = 0; i < Math.max(SLOGANS.length, theses.length); i++) {
    const t = theses[i]
    if (t) items.push({ key: t.id, topic: t.topic.short, handle: t.author.handle, followers: t.followers.toLocaleString('en-US') })
    if (SLOGANS[i]) items.push({ key: `slogan-${i}`, slogan: SLOGANS[i] })
  }
  return items
})

const steps = [
  {
    icon: Megaphone,
    title: 'Pitch your idea',
    text: 'Describe your hot take in your own words. No forms to fill out and no ticker symbols to look up.',
  },
  {
    icon: Sparkles,
    title: 'Workshop it with AI',
    text: 'The copilot breaks it into the claims that must be true, checks each one, and finds the companies most exposed to it.',
  },
  {
    icon: Users,
    title: 'Workshop it with the community',
    text: 'Publish it. Members question your assumptions, suggest companies and follow how it holds up.',
  },
  {
    icon: Wallet,
    title: 'Invest in one tap',
    text: 'Buy the finished basket in fractional shares from $10, rebalanced on the schedule you pick.',
  },
]

const options = [
  {
    icon: Layers,
    title: 'Buy a broad clean energy fund',
    text: 'Someone else picked the holdings, and they often include companies you’d never choose.',
    tag: 'Someone else’s picks',
    tone: 'flare',
  },
  {
    icon: Search,
    title: 'Pick stocks on your own',
    text: 'Hours of research on a trading app, with no one to check your reasoning.',
    tag: 'No one checks your work',
    tone: 'sun',
  },
  {
    icon: MessageCircle,
    title: 'Talk about it with friends',
    text: 'A great take that never turns into an investment.',
    tag: 'Never invested',
    tone: 'pink',
  },
]

const demoClaims = [
  { text: 'Heat pumps keep taking share from gas furnaces.', status: 'supported', source: 'Adoption data' },
  { text: 'Running a heat pump costs less than heating with gas for most households.', status: 'mixed', source: 'Adoption data · Policy' },
  { text: 'Makers and installers can grow without crushing their margins.', status: 'supported', source: 'Company filings' },
]

const demoAllocations = [
  { symbol: 'AIRW', name: 'Airwell Climate', sector: 'Ductless heat pumps', color: '#E85A2A', weight: '22.3%', dollars: '$11.15', shares: '0.0715' },
  { symbol: 'THRM', name: 'Thermiq Systems', sector: 'HVAC equipment', color: '#354BF4', weight: '17.0%', dollars: '$8.52', shares: '0.0363' },
  { symbol: 'HOMR', name: 'HomeRev Services', sector: 'Home retrofits', color: '#3A2A9E', weight: '15.1%', dollars: '$7.55', shares: '0.0394' },
  { symbol: 'COIL', name: 'Coilbridge Components', sector: 'Compressors & coils', color: '#F07AB6', weight: '13.2%', dollars: '$6.59', shares: '0.0987' },
]
</script>

<template>
  <div class="landing ground-blue">
    <!-- Hero: the prompt bar is the first thing on the page, and the copilot answers inline. -->
    <section ref="heroEl" class="hero">
      <div class="container hero__inner">
        <div class="hero__copy">
          <span class="eyebrow fade-up">New · the Climate collection</span>
          <h1 class="hero__title shout-shadow fade-up" style="animation-delay: 0.04s">
            <span>Turn your climate</span>
            <span>hot take</span>
            <span class="pink">into a real portfolio.</span>
          </h1>
          <p class="hero__lead fade-up" style="animation-delay: 0.08s">
            Pitch an idea in plain words. Outvest’s AI co-investor turns it into a testable thesis and a basket of public
            companies. Pressure-test it with the community, then invest from <span class="wink">$10</span>.
          </p>
          <div class="hero__prompt fade-up" style="animation-delay: 0.12s">
            <PromptBar
              ref="promptBar"
              v-model="idea"
              size="lg"
              submit-label="Test my idea"
              :busy="status === 'loading'"
              :examples="EXAMPLE_IDEAS.slice(0, 3)"
              :error="error?.field ?? ''"
              @submit="runPreview"
            />
          </div>
          <ul class="hero__trust fade-up" style="animation-delay: 0.16s">
            <li><Check :size="13" :stroke-width="3" /> No sign-up to try</li>
            <li><Check :size="13" :stroke-width="3" /> Free to build, workshop and publish</li>
            <li><Check :size="13" :stroke-width="3" /> Invest from $10</li>
          </ul>
        </div>

        <div class="hero__art" aria-hidden="true">
          <BrandSpiral class="hero__spiral" :size="400" :tile="false" spin />
          <div class="ticket">
            <span class="ticket__sample">Sample</span>
            <p class="ticket__brand">Copilot readout</p>
            <p class="ticket__title">Heat pumps beat the furnace</p>
            <p class="ticket__take">“{{ EXAMPLE_IDEAS[0] }}”</p>
            <ul class="ticket__rows">
              <li v-for="row in demoAllocations" :key="row.symbol">
                <span class="ticket__sym">{{ row.symbol }}</span>
                <span class="ticket__name">
                  {{ row.name }}
                  <small>{{ row.sector }}</small>
                </span>
                <span class="ticket__pct">{{ row.weight }}</span>
              </li>
            </ul>
            <p class="ticket__more">+ 4 more companies</p>
            <div class="ticket__total">
              <span>Risks you hadn’t<br />considered</span>
              <strong>2</strong>
            </div>
            <p class="ticket__foot">Sample data · Not investment advice</p>
          </div>
        </div>
      </div>

      <div ref="resultEl" class="container hero__result" aria-live="polite">
        <CopilotProgress
          v-if="status === 'loading'"
          active
          :done="Boolean(pending)"
          compact
          title="Your AI co-investor is on it"
          @finished="onProgressFinished"
        />
        <div v-else-if="status === 'error' && error && !error.field" class="callout callout-sun hero__error">
          <Info :size="18" />
          <div>
            <p class="strong">{{ error.message }}</p>
            <template v-if="error.suggestions.length">
              <p class="hero__error-hint">Try one of these:</p>
              <div class="hero__suggestions">
                <button v-for="s in error.suggestions" :key="s" type="button" class="chip" @click="useSuggestion(s)">{{ s }}</button>
              </div>
            </template>
          </div>
        </div>
        <CopilotPreview
          v-else-if="status === 'ready' && preview"
          :preview="preview"
          :authed="session.isAuthed"
          :continuing="continuing"
          class="fade-up"
          @continue="continueWorkshop"
          @reset="reset"
        />
      </div>
    </section>

    <!-- The tape: a ticker of the community's most-followed theses -->
    <div class="tape" aria-hidden="true">
      <div class="tape__live"><span class="tape__dot" /> Outvest tape</div>
      <div class="tape__inner">
        <div v-for="copy in 4" :key="copy" class="tape__track">
          <template v-for="item in tapeItems" :key="item.key">
            <span v-if="item.slogan" class="tk-slogan">{{ item.slogan }}</span>
            <span v-else class="tk">
              <span class="tk-sym">{{ item.topic }}</span>
              <span class="tk-val">@{{ item.handle }}</span>
              <span class="tk-chg">▲ {{ item.followers }} following</span>
            </span>
          </template>
        </div>
      </div>
    </div>

    <!-- How it works -->
    <section id="how-it-works" class="section">
      <div class="container">
        <div class="section__head">
          <span class="eyebrow">How it works</span>
          <h2 class="big-title shout-shadow">From hunch to holding <span class="pink">in four steps.</span></h2>
        </div>
        <ol class="steps">
          <li v-for="(step, i) in steps" :key="step.title" class="step" :class="`step--${i + 1}`">
            <span class="step__num">0{{ i + 1 }}</span>
            <span class="step__icon"><component :is="step.icon" :size="21" /></span>
            <h3 class="step__title">{{ step.title }}</h3>
            <p class="step__text">{{ step.text }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- The gap -->
    <section class="section">
      <div class="container">
        <div class="section__head">
          <span class="eyebrow">Why Outvest</span>
          <h2 class="big-title shout-shadow">
            You can see the shift coming. <span class="pink">Acting on it shouldn’t take a fund manager.</span>
          </h2>
        </div>
        <div class="lineup card">
          <div class="lineup__head">
            <p class="lineup__title">Until now, a specific climate bet came down to <span class="accent">three options.</span></p>
            <span class="label-mono lineup__meta">None of them are yours</span>
          </div>
          <ol class="lineup__rows">
            <li v-for="option in options" :key="option.title" class="lineup__row" :class="`lineup__row--${option.tone}`">
              <span class="lineup__icon"><component :is="option.icon" :size="20" /></span>
              <span class="lineup__body">
                <span class="lineup__name">{{ option.title }}</span>
                <span class="lineup__text">{{ option.text }}</span>
              </span>
              <span class="lineup__tag">{{ option.tag }}</span>
            </li>
          </ol>
        </div>
        <p class="gap-line shout-shadow">Outvest closes the gap between having an idea and <span class="pink">owning it.</span></p>
      </div>
    </section>

    <!-- AI workshop -->
    <section id="workshop" class="section">
      <div class="container split">
        <div class="split__copy">
          <span class="eyebrow"><Sparkles :size="15" /> Workshop it with AI</span>
          <h2 class="big-title shout-shadow">An AI co-investor <span class="pink">that shows its work.</span></h2>
          <p class="lead">
            The copilot breaks your idea into the claims that must be true for it to pay off, then checks each one against
            company filings, government policy and adoption data.
          </p>
          <ul class="checks">
            <li><Check :size="14" :stroke-width="3" /> See the companies most exposed to your idea</li>
            <li><Check :size="14" :stroke-width="3" /> Get the strongest arguments against it, not just for it</li>
            <li><Check :size="14" :stroke-width="3" /> Compare a similar basket against the S&P 500</li>
            <li><Check :size="14" :stroke-width="3" /> Push back, swap companies and update your thesis as you go</li>
          </ul>
        </div>
        <div class="visual">
          <div class="workshop card tilt-r">
            <p class="visual__label">What must be true</p>
            <ol class="workshop__claims">
              <li v-for="(claim, i) in demoClaims" :key="claim.text">
                <span class="workshop__num">{{ i + 1 }}</span>
                <span class="grow">
                  <span class="workshop__claim">{{ claim.text }}</span>
                  <span class="workshop__source">{{ claim.source }}</span>
                </span>
                <ClaimStatusBadge :status="claim.status" />
              </li>
            </ol>
            <div class="workshop__chat">
              <p class="bubble bubble--user">Why is Chillwell in here? I think of them as an AC company.</p>
              <p class="bubble bubble--copilot">
                <span class="bubble__who"><Sparkles :size="13" /> Copilot</span>
                Its newer units run as heat pumps in winter, about a quarter of sales. That’s indirect exposure, so ask me to drop
                it if you want a purer basket.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Community -->
    <section id="community" class="section">
      <div class="container split split--reverse">
        <div class="split__copy">
          <span class="eyebrow"><Users :size="15" /> Workshop it with the community</span>
          <h2 class="big-title shout-shadow">Get challenged by people <span class="pink">who know the industry.</span></h2>
          <p class="lead">
            When your thesis is ready, publish it. Members question your assumptions, suggest companies and follow your
            thesis to see how it holds up over time.
          </p>
          <ul class="checks">
            <li><Check :size="14" :stroke-width="3" /> Challenges point at the exact claim they doubt</li>
            <li><Check :size="14" :stroke-width="3" /> Add a suggested company to your basket in one tap</li>
            <li><Check :size="14" :stroke-width="3" /> Every author builds a public track record, good calls and bad</li>
          </ul>
        </div>
        <div class="visual">
          <div class="thread card tilt-l">
            <div class="thread__thesis">
              <span class="topic-chip">Heat pumps</span>
              <p class="thread__title">Heat pumps beat the furnace</p>
              <p class="muted text-sm">by Maya Okafor · @mayaokafor</p>
            </div>
            <div class="thread__note">
              <span class="avatar">DP</span>
              <div class="grow">
                <p class="thread__who"><strong>Devon Park</strong> <span class="muted">@devonbuilds</span></p>
                <p class="thread__kind thread__kind--suggest"><Lightbulb :size="13" /> Suggests a company</p>
                <p class="thread__text">
                  Have you looked at Coilbridge? They make the compressors inside half the heat pumps I install.
                </p>
                <div class="thread__company">
                  <SecurityLogo symbol="COIL" name="Coilbridge" color="#F07AB6" :size="28" />
                  <span class="grow strong text-sm">Coilbridge Components</span>
                  <span class="thread__added"><Check :size="14" /> Added to the basket</span>
                </div>
              </div>
            </div>
            <div class="thread__note">
              <span class="avatar avatar--sun">PR</span>
              <div class="grow">
                <p class="thread__who"><strong>Priya Raman</strong> <span class="muted">@priyagrid</span></p>
                <p class="thread__kind thread__kind--challenge"><MessageSquareWarning :size="13" /> Challenges claim 2</p>
                <p class="thread__text">Winter peaks worry me. Grid upgrades for heat pump load could mean rate hikes.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured community theses (live) -->
    <section v-if="featured?.length" class="section">
      <div class="container">
        <div class="section__head section__head--row">
          <div>
            <span class="eyebrow">From the community</span>
            <h2 class="big-title shout-shadow">Theses people <span class="pink">are following.</span></h2>
          </div>
          <RouterLink :to="session.isAuthed ? '/app/community' : '/signup'" class="btn btn-primary btn-lg">
            {{ session.isAuthed ? 'Browse the community' : 'Join to follow them' }} <ArrowRight :size="18" />
          </RouterLink>
        </div>
        <div class="featured">
          <ThesisCard v-for="thesis in featured" :key="thesis.id" :thesis="thesis" :to="`/t/${thesis.id}`" />
        </div>
      </div>
    </section>

    <!-- Invest -->
    <section id="invest" class="section">
      <div class="container split">
        <div class="split__copy">
          <span class="eyebrow"><Wallet :size="15" /> Invest in one tap</span>
          <h2 class="big-title shout-shadow">Own the idea, <span class="pink">not just the opinion.</span></h2>
          <p class="lead">
            Buy the finished basket in fractional shares, starting at $10, through Outvest’s registered brokerage partner.
          </p>
          <ul class="checks">
            <li><Check :size="14" :stroke-width="3" /> Rebalanced on the schedule you pick</li>
            <li><Check :size="14" :stroke-width="3" /> Alerts only when news affects your thesis</li>
            <li><Check :size="14" :stroke-width="3" /> Opening a brokerage account takes about five minutes</li>
          </ul>
        </div>
        <div class="visual visual--invest">
          <div class="order card tilt-l">
            <p class="visual__label">Buy the basket</p>
            <p class="order__title">Heat pumps beat the furnace</p>
            <p class="order__amount num">$50<span>.00</span></p>
            <ul class="order__rows">
              <li v-for="row in demoAllocations" :key="row.symbol">
                <SecurityLogo :symbol="row.symbol" :name="row.name" :color="row.color" :size="30" />
                <span class="grow">{{ row.name }}</span>
                <span class="num strong">{{ row.dollars }}</span>
                <span class="num muted text-sm">{{ row.shares }} sh</span>
              </li>
              <li class="order__more muted text-sm">+ 4 more companies</li>
            </ul>
            <p class="order__schedule"><RefreshCw :size="15" /> Rebalances quarterly</p>
            <span class="btn btn-primary btn-block order__btn">Buy $50 of this basket</span>
          </div>
          <div class="float-alert">
            <span class="float-alert__icon"><BellRing :size="16" /></span>
            <span>
              <span class="float-alert__label">Weakens claim 4</span>
              <span class="float-alert__text">Thermiq warns compressor costs are squeezing margins</span>
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Quotes -->
    <section class="section">
      <div class="container quotes">
        <figure class="quote quote--feature">
          <Quote :size="34" class="quote__mark" />
          <blockquote>
            “I spend my workday specifying heat pumps, and I could see demand climbing long before it showed up on earnings
            calls. I never invested in it because I didn’t know where to start. Outvest turned my hunch into a basket of
            eight companies in about twenty minutes and showed me two risks I hadn’t considered. Someone in the community
            pointed me to a supplier I’d never heard of. Now I own the idea I’ve been talking about for three years.”
          </blockquote>
          <figcaption>
            <span class="avatar">MO</span>
            <span>
              <strong>Maya Okafor, 27</strong>
              <span class="quote__role">Building energy engineer in Seattle · early tester</span>
            </span>
          </figcaption>
        </figure>
        <div class="quotes__side">
          <div class="stat-sticker">
            <p class="stat-sticker__big">20 min</p>
            <p class="stat-sticker__text">From Maya’s hunch to a basket of eight companies.</p>
          </div>
          <figure class="quote quote--founder">
            <Quote :size="24" class="quote__mark" />
            <blockquote>
              “Every climate investor I know has a thesis they believe in more than the index fund sitting in their account.
              What they lack is a fast way to test that thesis and act on it without becoming a full-time analyst. Outvest
              gives them that, and it asks them to show their work before they put money behind it.”
            </blockquote>
            <figcaption>
              <span class="avatar avatar--sun">RS</span>
              <span>
                <strong>Ricky Shell</strong>
                <span class="quote__role">Co-founder, Outvest</span>
              </span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- Pricing teaser -->
    <section class="section">
      <div class="container">
        <div class="section__head section__head--center">
          <span class="eyebrow">Pricing</span>
          <h2 class="big-title shout-shadow">Free to build. <span class="pink">Invest from $10.</span></h2>
        </div>
        <div class="prices">
          <article class="price card tilt-l">
            <p class="price__name">Build, workshop and publish</p>
            <p class="price__amount">Free</p>
            <p class="price__text">Pitch ideas, work them with the copilot and the community, and build your public track record.</p>
          </article>
          <article class="price price--invest card tilt-r">
            <p class="price__name">Invest</p>
            <p class="price__amount">From $10</p>
            <p class="price__text">
              Open a brokerage account in the app in about five minutes, then buy your basket in fractional shares.
            </p>
          </article>
        </div>
        <p class="center"><RouterLink to="/pricing" class="link">See pricing details and FAQs →</RouterLink></p>
      </div>
    </section>

    <!-- Download -->
    <section id="get-the-app" class="section final">
      <div class="container final__inner">
        <span class="eyebrow">Available today on iOS and Android</span>
        <h2 class="final__title shout-shadow">Your hot take <span class="pink">belongs in your portfolio.</span></h2>
        <p class="final__lead">Outvest is a free download. Climate is the first collection, with more themes on the way.</p>
        <AppStoreButtons inverse />
        <div class="final__actions">
          <RouterLink :to="session.isAuthed ? '/app' : '/signup'" class="btn btn-flare big-cta">
            {{ session.isAuthed ? 'Open Outvest' : 'Start on the web' }} ↗
          </RouterLink>
          <p class="final__fine">
            Building, workshopping and publishing a thesis is free. Investing requires a brokerage account, which takes about
            five minutes to open.
          </p>
        </div>
        <BrandSpiral class="final__spiral" :size="230" :tile="false" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing {
  position: relative;
  overflow-x: clip;
  padding-bottom: 24px;
}

/* Hero */
.hero {
  position: relative;
  padding: 28px 0 72px;
}
.hero__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 350px;
  align-items: start;
  gap: 56px;
  max-width: 1388px;
}
.hero__copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}
.hero__title {
  font-size: clamp(44px, 6.6vw, 104px);
  line-height: 0.88;
  color: var(--cream);
}
.hero__title span {
  display: block;
}
.hero__lead {
  max-width: 640px;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.45;
}
.hero__lead .wink {
  font-size: 1.3em;
  line-height: 1;
}
.hero__prompt {
  max-width: 880px;
  margin-top: 8px;
}
.hero__trust {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  font-size: 14.5px;
  font-weight: 600;
}
.hero__trust li {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.hero__trust svg,
.checks svg {
  box-sizing: content-box;
  flex-shrink: 0;
  padding: 3px;
  border: 1.5px solid var(--ink-solid);
  border-radius: 50%;
  background: var(--sun);
  color: var(--ink);
}

.hero__art {
  position: relative;
  margin-top: 12px;
}
.hero__spiral {
  position: absolute;
  top: 150px;
  left: -150px;
}
.ticket {
  position: relative;
  z-index: 1;
  padding: 24px 22px 20px;
  border: var(--outline);
  border-radius: 18px;
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-lg);
  transform: rotate(3deg);
}
.ticket__sample {
  position: absolute;
  top: -17px;
  right: 18px;
  padding: 6px 14px;
  border: var(--outline);
  border-radius: 999px;
  background: var(--bubblegum);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transform: rotate(5deg);
}
.ticket__brand {
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  text-align: center;
  color: var(--deep-violet);
}
.ticket__title {
  margin-top: 8px;
  font-family: var(--font-display);
  font-size: 38px;
  line-height: 0.95;
  text-transform: uppercase;
  text-align: center;
}
.ticket__take {
  margin-top: 14px;
  padding: 12px 0;
  border-block: 2px dashed var(--ink-solid);
  font-family: var(--font-wink);
  font-size: 19px;
  font-style: italic;
  line-height: 1.25;
  text-align: center;
}
.ticket__rows {
  display: flex;
  flex-direction: column;
  gap: 11px;
  margin-top: 14px;
}
.ticket__rows li {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ticket__sym {
  flex-shrink: 0;
  min-width: 50px;
  padding: 3px 6px;
  border-radius: 6px;
  background: var(--ink-solid);
  color: var(--sun);
  font-family: var(--font-display);
  font-size: 16px;
  line-height: 1.15;
  text-align: center;
}
.ticket__name {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  font-size: 13.5px;
  font-weight: 700;
  line-height: 1.2;
}
.ticket__name small {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
}
.ticket__pct {
  font-family: var(--font-display);
  font-size: 22px;
}
.ticket__more {
  margin-top: 10px;
  font-size: 13px;
  font-weight: 650;
  color: var(--muted);
}
.ticket__total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 2px dashed var(--ink-solid);
}
.ticket__total span {
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.ticket__total strong {
  font-family: var(--font-display);
  font-size: 54px;
  font-weight: 400;
  line-height: 0.85;
  color: var(--flare);
}
.ticket__foot {
  margin-top: 14px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-align: center;
  color: var(--muted);
}

.hero__result {
  position: relative;
  z-index: 2;
  max-width: 1388px;
  margin-top: 40px;
  scroll-margin-top: 24px;
}
.hero__result:empty {
  display: none;
}
.hero__result > .progress,
.hero__error {
  max-width: 880px;
}
.hero__result > .preview {
  max-width: 1120px;
}
.hero__error-hint {
  margin-top: 8px;
}
.hero__suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

/* Tape */
.tape {
  position: relative;
  z-index: 2;
  width: calc(100% + 82px);
  margin: -26px -41px 13px;
  padding: 22px 0;
  border-block: 4px solid var(--bubblegum);
  background: #0e0d12;
  overflow: clip;
  transform: rotate(-1.5deg);
}
.tape::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.28) 0 1px, transparent 1px 3px);
}
.tape__live {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 41px;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 40px 0 24px;
  background: linear-gradient(90deg, #0e0d12 78%, rgba(14, 13, 18, 0));
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 2.4px;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--sun);
}
.tape__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ff4f4f;
  box-shadow: 0 0 10px #ff4f4f;
  animation: tape-blink 1.2s step-end infinite;
}
.tape__inner {
  display: flex;
  width: max-content;
  animation: tape-slide 60s linear infinite;
}
.tape__track {
  display: flex;
  flex: none;
  align-items: center;
  gap: 44px;
  padding-right: 44px;
}
.tk,
.tk-slogan {
  font-family: var(--font-mono);
  font-size: 30px;
  font-weight: 600;
  line-height: 50px;
  white-space: nowrap;
  text-shadow: 0 0 12px;
}
.tk {
  display: inline-flex;
  align-items: baseline;
  gap: 14px;
  color: var(--cream);
  text-transform: uppercase;
}
.tk-sym {
  letter-spacing: 1px;
}
.tk-val {
  color: rgba(255, 244, 214, 0.8);
  text-transform: none;
}
.tk-chg {
  font-size: 22px;
  letter-spacing: 1px;
  color: #6fe07f;
}
.tk-slogan {
  padding: 0 18px;
  border-inline: 2px solid rgba(255, 244, 214, 0.25);
  font-family: var(--font-display);
  font-size: 40px;
  font-weight: 400;
  text-transform: uppercase;
  text-shadow: none;
  color: var(--sun);
}
@keyframes tape-slide {
  to {
    transform: translateX(-25%);
  }
}
@keyframes tape-blink {
  50% {
    opacity: 0.2;
  }
}

/* Sections */
.section {
  position: relative;
  padding: 88px 0;
}
.section__head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  max-width: 1040px;
  margin-bottom: 48px;
}
.section__head--center {
  align-items: center;
  margin-inline: auto;
  text-align: center;
}
.section__head--row {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  max-width: none;
}
.section__head--row > div {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}
.big-title {
  font-size: clamp(42px, 5.8vw, 86px);
  line-height: 0.92;
  color: var(--cream);
}
.center {
  margin-top: 36px;
  font-size: 17px;
  text-align: center;
}

/* Steps */
.steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
}
.step {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 24px;
  border: var(--outline);
  border-radius: 24px;
  color: var(--ink);
  box-shadow: var(--shadow);
}
.step--1 {
  background: var(--surface);
  transform: rotate(-1.2deg);
}
.step--2 {
  background: var(--sun);
  transform: rotate(1deg);
}
.step--3 {
  background: var(--bubblegum);
  transform: rotate(-0.8deg);
}
.step--4 {
  background: var(--flare);
  transform: rotate(1.2deg);
}
.step__num {
  font-family: var(--font-display);
  font-size: 68px;
  line-height: 0.85;
}
.step__icon {
  position: absolute;
  top: 22px;
  right: 22px;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border: var(--outline-thin);
  border-radius: 50%;
  background: var(--ink-solid);
  color: var(--cream);
}
.step__title {
  margin-top: 20px;
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.005em;
  text-transform: uppercase;
}
.step__text {
  margin-top: 10px;
  font-size: 15px;
  line-height: 1.5;
  color: var(--ink-2);
}

/* Old options lineup */
.lineup {
  overflow: hidden;
  border-radius: 28px;
  box-shadow: var(--shadow-lg);
}
.lineup__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px 24px;
  padding: 28px 28px 22px;
}
.lineup__title {
  max-width: 760px;
  font-family: var(--font-display);
  font-size: clamp(30px, 3.4vw, 46px);
  line-height: 0.95;
  text-transform: uppercase;
}
.lineup__title .accent {
  color: var(--signal);
}
.lineup__meta {
  color: var(--deep-violet);
}
.lineup__rows {
  border-top: var(--outline);
}
.lineup__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  padding: 20px 28px;
  border-top: var(--outline-thin);
}
.lineup__row:first-child {
  border-top: 0;
}
.lineup__row--flare {
  background: var(--peach-50);
}
.lineup__row--sun {
  background: var(--sun-50);
}
.lineup__row--pink {
  background: color-mix(in srgb, var(--bubblegum) 14%, var(--surface));
}
.lineup__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: var(--outline-thin);
  border-radius: 12px;
  background: var(--ink-solid);
  color: var(--sun);
}
.lineup__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.lineup__name {
  font-size: 17px;
  font-weight: 700;
}
.lineup__text {
  font-size: 14.5px;
  color: var(--ink-2);
}
.lineup__tag {
  padding: 6px 13px;
  border: var(--outline-thin);
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}
.lineup__row--flare .lineup__tag {
  background: var(--flare);
}
.lineup__row--sun .lineup__tag {
  background: var(--sun);
}
.lineup__row--pink .lineup__tag {
  background: var(--bubblegum);
}
.gap-line {
  max-width: 1000px;
  margin: 64px auto 0;
  font-family: var(--font-display);
  font-size: clamp(34px, 4.4vw, 62px);
  line-height: 0.95;
  text-align: center;
  text-transform: uppercase;
  color: var(--cream);
}

/* Split feature sections */
.split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: 72px;
}
.split--reverse .split__copy {
  order: 2;
}
.split__copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 18px;
}
.split__copy .big-title {
  font-size: clamp(40px, 4.8vw, 72px);
}
.split__copy .lead {
  font-size: 19px;
  font-weight: 500;
}
.checks {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 6px;
  font-size: 16px;
  font-weight: 600;
}
.checks li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.visual {
  position: relative;
}
.visual__label {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--deep-violet);
}
.workshop,
.thread,
.order {
  padding: 24px;
  border-radius: 28px;
  box-shadow: var(--shadow-lg);
}

.workshop__claims {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}
.workshop__claims li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: var(--outline-thin);
  border-radius: 16px;
  background: var(--surface-muted);
}
.workshop__num {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border: 1.5px solid var(--ink-solid);
  border-radius: 8px;
  background: var(--sun);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
}
.workshop__claim {
  display: block;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
}
.workshop__source {
  display: block;
  margin-top: 2px;
  font-size: 12.5px;
  color: var(--muted);
}
.workshop__chat {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
  padding: 14px;
  border: 2px dashed var(--ink-solid);
  border-radius: 18px;
  background: var(--bg);
}
.bubble {
  max-width: 88%;
  padding: 10px 13px;
  border: var(--outline-thin);
  border-radius: 16px;
  font-size: 13.5px;
  line-height: 1.5;
  box-shadow: var(--shadow-xs);
}
.bubble--user {
  align-self: flex-end;
  border-top-right-radius: 6px;
  background: var(--signal);
  color: var(--cream);
}
.bubble--copilot {
  align-self: flex-start;
  border-top-left-radius: 6px;
  background: var(--surface);
}
.bubble__who {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 2px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--deep-violet);
}

.thread__thesis {
  padding-bottom: 16px;
  border-bottom: 2px dashed var(--ink-solid);
}
.thread__title {
  margin-top: 10px;
  font-family: var(--font-display);
  font-size: 32px;
  line-height: 1;
  text-transform: uppercase;
}
.thread__note {
  display: flex;
  gap: 12px;
  padding-top: 16px;
}
.thread__note + .thread__note {
  margin-top: 16px;
  border-top: 2px dashed var(--line);
}
.avatar--sun {
  background: var(--sun);
}
.thread__who {
  font-size: 13.5px;
}
.thread__kind {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
  font-size: 12.5px;
  font-weight: 700;
}
.thread__kind--suggest {
  color: var(--sun-700);
}
.thread__kind--challenge {
  color: var(--lilac-700);
}
.thread__text {
  margin-top: 4px;
  font-size: 14px;
  color: var(--ink-2);
}
.thread__company {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 8px 10px;
  border: var(--outline-thin);
  border-radius: 14px;
  background: var(--sun-50);
}
.thread__added {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  font-weight: 700;
  white-space: nowrap;
  color: var(--score-great);
}

.featured {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.visual--invest {
  padding-bottom: 44px;
}
.order__title {
  margin-top: 6px;
  font-weight: 750;
}
.order__amount {
  margin-top: 8px;
  font-family: var(--font-display);
  font-size: 76px;
  line-height: 0.9;
}
.order__amount span {
  font-size: 38px;
  color: var(--muted);
}
.order__rows {
  margin-top: 16px;
}
.order__rows li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-top: 2px dashed var(--line);
  font-size: 14px;
  font-weight: 600;
}
.order__more {
  justify-content: center;
}
.order__schedule {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding: 10px 12px;
  border: var(--outline-thin);
  border-radius: 12px;
  background: var(--lilac-100);
  color: var(--deep-violet);
  font-size: 13.5px;
  font-weight: 650;
}
.order__btn {
  margin-top: 16px;
  pointer-events: none;
}
.float-alert {
  position: absolute;
  right: -18px;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 310px;
  padding: 12px 16px 12px 12px;
  border: var(--outline);
  border-radius: 18px;
  background: var(--bubblegum);
  color: var(--ink);
  box-shadow: var(--shadow);
  animation: float 6s ease-in-out infinite;
}
.float-alert > span:last-child {
  display: flex;
  flex-direction: column;
}
.float-alert__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: var(--outline-thin);
  border-radius: 12px;
  background: var(--ink-solid);
  color: var(--sun);
}
.float-alert__label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.float-alert__text {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.35;
}

/* Quotes */
.quotes {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  align-items: stretch;
  gap: 28px;
}
.quote {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 30px;
  border: var(--outline);
  border-radius: 28px;
  box-shadow: var(--shadow);
}
.quote blockquote {
  flex: 1;
  font-size: 16px;
  line-height: 1.6;
}
.quote figcaption {
  display: flex;
  align-items: center;
  gap: 10px;
}
.quote figcaption > span:last-child {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.quote__role {
  font-size: 13.5px;
  color: var(--muted);
}
.quote--feature {
  background: var(--ink-solid);
  color: var(--cream);
  box-shadow: 8px 8px 0 var(--sun);
  transform: rotate(-0.8deg);
}
.quote--feature .quote__mark {
  color: var(--sun);
}
.quote--feature blockquote {
  font-size: 21px;
  font-weight: 500;
  line-height: 1.5;
}
.quote--feature .quote__role {
  color: #d8d3dd;
}
.quotes__side {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.stat-sticker {
  padding: 22px 26px;
  border: var(--outline);
  border-radius: 24px;
  background: var(--bubblegum);
  color: var(--ink);
  box-shadow: var(--shadow);
  transform: rotate(1deg);
}
.stat-sticker__big {
  font-family: var(--font-display);
  font-size: 78px;
  line-height: 0.85;
  text-transform: uppercase;
}
.stat-sticker__text {
  margin-top: 10px;
  font-family: var(--font-display);
  font-size: 23px;
  line-height: 1;
  text-transform: uppercase;
}
.quote--founder {
  flex: 1;
  background: var(--surface);
  color: var(--ink);
}
.quote--founder .quote__mark {
  color: var(--signal);
}

/* Pricing teaser */
.prices {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 32px;
  max-width: 900px;
  margin: 0 auto;
}
.price {
  padding: 30px;
  border-radius: 28px;
}
.price--invest {
  background: var(--sun);
}
.price__name {
  font-family: var(--font-mono);
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--deep-violet);
}
.price--invest .price__name {
  color: var(--ink);
}
.price__amount {
  margin-top: 10px;
  font-family: var(--font-display);
  font-size: 76px;
  line-height: 0.9;
  text-transform: uppercase;
}
.price__text {
  margin-top: 10px;
  color: var(--ink-2);
}

/* Final call to action */
.final {
  padding-bottom: 104px;
}
.final__inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
}
.final__title {
  max-width: 1040px;
  font-size: clamp(54px, 8.6vw, 136px);
  line-height: 0.88;
  color: var(--cream);
}
.final__lead {
  max-width: 560px;
  font-size: 20px;
  font-weight: 500;
}
.final__actions {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px 28px;
  margin-top: 8px;
}
.big-cta {
  --btn-h: 76px;
  padding: 0 40px;
  border-width: 3px;
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 400;
  text-transform: uppercase;
  box-shadow: 8px 8px 0 var(--ink-solid);
}
.final__fine {
  max-width: 520px;
  padding: 12px 18px;
  border-radius: 12px;
  background: var(--ink-solid);
  font-size: 15px;
}
.final__spiral {
  position: absolute;
  right: 24px;
  bottom: -24px;
  transform: rotate(10deg);
}

@media (max-width: 1180px) {
  .hero__inner {
    grid-template-columns: minmax(0, 1fr);
  }
  .hero__art {
    display: none;
  }
}
@media (max-width: 1100px) {
  .final__spiral {
    display: none;
  }
}
@media (max-width: 1023px) {
  .split,
  .quotes {
    grid-template-columns: minmax(0, 1fr);
    gap: 48px;
  }
  .split--reverse .split__copy {
    order: 0;
  }
  .visual {
    width: 100%;
    max-width: 560px;
    margin: 0 auto;
  }
  .steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .featured {
    grid-template-columns: minmax(0, 1fr);
  }
  .float-alert {
    right: 0;
  }
}
@media (max-width: 900px) {
  .tk,
  .tk-slogan {
    font-size: 22px;
    line-height: 38px;
  }
  .tk-chg {
    font-size: 16px;
  }
  .tk-slogan {
    font-size: 30px;
  }
  .tape__live {
    gap: 7px;
    padding: 0 28px 0 16px;
    font-size: 11px;
    letter-spacing: 1.6px;
  }
}
@media (max-width: 640px) {
  .hero {
    padding: 20px 0 64px;
  }
  .hero__lead {
    font-size: 17px;
  }
  .hero__trust {
    flex-direction: column;
    gap: 8px;
  }
  .section {
    padding: 64px 0;
  }
  .section__head {
    margin-bottom: 36px;
  }
  .steps,
  .prices {
    grid-template-columns: minmax(0, 1fr);
  }
  .lineup__head,
  .lineup__row {
    padding-inline: 18px;
  }
  .lineup__row {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 10px 14px;
  }
  .lineup__tag {
    grid-column: 2;
    justify-self: start;
  }
  .workshop,
  .thread,
  .order,
  .quote {
    padding: 20px;
  }
  .quote--feature blockquote {
    font-size: 18px;
  }
  .stat-sticker__big,
  .price__amount,
  .order__amount {
    font-size: 60px;
  }
  .big-cta {
    --btn-h: 64px;
    padding: 0 26px;
    font-size: 24px;
  }
  .final {
    padding-bottom: 80px;
  }
}
</style>
