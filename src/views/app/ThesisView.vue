<script setup>
import { thesesService } from '@/api'
import AddCompanyModal from '@/components/thesis/AddCompanyModal.vue'
import AuthorLine from '@/components/thesis/AuthorLine.vue'
import BacktestCard from '@/components/thesis/BacktestCard.vue'
import BasketList from '@/components/thesis/BasketList.vue'
import ClaimList from '@/components/thesis/ClaimList.vue'
import CommunityThread from '@/components/thesis/CommunityThread.vue'
import CopilotChat from '@/components/thesis/CopilotChat.vue'
import CounterArguments from '@/components/thesis/CounterArguments.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import UiModal from '@/components/ui/UiModal.vue'
import { useToast } from '@/composables/useToast'
import { formatDate, formatMoney } from '@/utils/format'
import { WEIGHTINGS, formatPts, formatReturn, scheduleLabel } from '@/utils/thesis'
import {
  ArrowLeft,
  Clock,
  FileQuestion,
  Globe,
  Info,
  Link2,
  Megaphone,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const thesis = ref(null)
const loading = ref(true)
const error = ref(null)

const chatBusy = ref(false)
const pendingMessage = ref(null)
const chatOpen = ref(false)
const draftSeed = ref(typeof route.query.ask === 'string' ? route.query.ask.slice(0, 500) : '')

const editing = ref(false)
const draft = reactive({ title: '', statement: '' })
const editErrors = reactive({})
const saving = ref(false)

const addOpen = ref(false)
const addingSymbol = ref(null)
const removingSymbol = ref(null)
const weightingBusy = ref(false)
const publishOpen = ref(false)
const publishing = ref(false)
const followBusy = ref(false)
const busyCommentId = ref(null)

const id = computed(() => route.params.thesisId)
const isOwner = computed(() => Boolean(thesis.value?.isOwner))
const isPublished = computed(() => thesis.value?.status === 'published')
const back = computed(() => (isOwner.value ? { to: '/app/theses', label: 'My theses' } : { to: '/app/community', label: 'Community' }))
const weightingHint = computed(() => WEIGHTINGS.find((w) => w.value === thesis.value?.weighting)?.hint ?? '')
const chatSuggestions = computed(() => {
  const top = thesis.value?.basket[0]
  return ['What would prove me wrong?', top ? `Why is ${top.name} in here?` : null, 'Make it steadier', 'How does it compare to the S&P 500?'].filter(Boolean)
})

async function load() {
  loading.value = true
  error.value = null
  try {
    thesis.value = await thesesService.get(id.value)
    if (draftSeed.value) {
      chatOpen.value = true
      router.replace({ query: {} })
    }
  } catch (err) {
    error.value = err
  } finally {
    loading.value = false
  }
}
onMounted(load)

function onKeydown(event) {
  if (event.key === 'Escape') chatOpen.value = false
}
watch(chatOpen, (open) => {
  if (open) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

async function run(task, failure) {
  try {
    return await task()
  } catch (err) {
    toast.error(failure, { description: err.message })
    return null
  }
}

async function sendMessage(text) {
  chatBusy.value = true
  pendingMessage.value = text
  draftSeed.value = ''
  const updated = await run(() => thesesService.sendMessage(id.value, text), 'The copilot didn’t answer')
  if (updated) thesis.value = updated
  chatBusy.value = false
  pendingMessage.value = null
}

async function removeCompany(item) {
  removingSymbol.value = item.symbol
  const updated = await run(() => thesesService.removeCompany(id.value, item.symbol), `Couldn’t remove ${item.name}`)
  if (updated) {
    thesis.value = updated
    toast.info(`Removed ${item.name}`, { description: 'Weights and the backtest updated.' })
  }
  removingSymbol.value = null
}

async function addCompany(symbol) {
  addingSymbol.value = symbol
  const updated = await run(() => thesesService.addCompany(id.value, symbol), 'Couldn’t add that company')
  if (updated) {
    thesis.value = updated
    addOpen.value = false
    const added = updated.basket.find((b) => b.symbol === symbol)
    toast.success(`Added ${added?.name ?? symbol}`, { description: `It’s ${added?.weight ?? 0}% of the basket now.` })
  }
  addingSymbol.value = null
}

async function setWeighting(value) {
  if (value === thesis.value.weighting) return
  weightingBusy.value = true
  const updated = await run(() => thesesService.update(id.value, { weighting: value }), 'Couldn’t change the weighting')
  if (updated) thesis.value = updated
  weightingBusy.value = false
}

function startEdit() {
  draft.title = thesis.value.title
  draft.statement = thesis.value.statement
  Object.keys(editErrors).forEach((key) => delete editErrors[key])
  editing.value = true
}

async function saveEdit() {
  saving.value = true
  Object.keys(editErrors).forEach((key) => delete editErrors[key])
  try {
    thesis.value = await thesesService.update(id.value, { title: draft.title, statement: draft.statement })
    editing.value = false
    toast.success('Thesis updated')
  } catch (err) {
    if (err.details) Object.assign(editErrors, err.details)
    else toast.error('Couldn’t save', { description: err.message })
  } finally {
    saving.value = false
  }
}

async function publish() {
  publishing.value = true
  const updated = await run(() => thesesService.publish(id.value), 'Couldn’t publish')
  if (updated) {
    thesis.value = updated
    publishOpen.value = false
    toast.success('Your thesis is live', {
      description: 'Your track record starts today.',
      action: { label: 'Public page', to: `/t/${id.value}` },
    })
  }
  publishing.value = false
}

async function toggleFollow() {
  followBusy.value = true
  const result = await run(
    () => (thesis.value.isFollowing ? thesesService.unfollow(id.value) : thesesService.follow(id.value)),
    'Couldn’t update',
  )
  if (result) thesis.value = { ...thesis.value, ...result }
  followBusy.value = false
}

async function copyLink() {
  const url = `${window.location.origin}${import.meta.env.BASE_URL}t/${id.value}`
  try {
    await navigator.clipboard.writeText(url)
    toast.success('Link copied', { description: 'Anyone with the link can see the published thesis.' })
  } catch {
    toast.info('Share this link', { description: url, timeout: 8000 })
  }
}

function onPosted(comment) {
  const claims = thesis.value.claims.map((c) => (comment.claim?.id === c.id ? { ...c, challenges: c.challenges + 1 } : c))
  thesis.value = { ...thesis.value, claims, comments: [comment, ...thesis.value.comments], commentsCount: thesis.value.commentsCount + 1 }
  toast.success('Posted')
}

async function acceptSuggestion(comment) {
  busyCommentId.value = comment.id
  const updated = await run(() => thesesService.acceptSuggestion(id.value, comment.id), 'Couldn’t add that company')
  if (updated) {
    thesis.value = updated
    toast.success(`Added ${comment.company.name}`, { description: 'The copilot noted it in your chat.' })
  }
  busyCommentId.value = null
}

async function dismissSuggestion(comment) {
  busyCommentId.value = comment.id
  const updated = await run(() => thesesService.dismissSuggestion(id.value, comment.id), 'Couldn’t dismiss')
  if (updated) thesis.value = updated
  busyCommentId.value = null
}

async function removeDraft() {
  if (!window.confirm('Delete this draft? This can’t be undone.')) return
  try {
    await thesesService.remove(id.value)
    toast.info('Draft deleted')
    router.replace('/app/theses')
  } catch (err) {
    toast.error('Couldn’t delete', { description: err.message })
  }
}
</script>

<template>
  <div class="page workshop">
    <div v-if="loading" class="workshop__loading">
      <div class="skeleton" style="height: 180px" />
      <div class="skeleton" style="height: 420px" />
    </div>

    <div v-else-if="error" class="card">
      <EmptyState :icon="FileQuestion" title="We couldn’t open that thesis" :text="error.message">
        <RouterLink to="/app/theses" class="btn btn-primary">Back to my theses</RouterLink>
      </EmptyState>
    </div>

    <template v-else-if="thesis">
      <RouterLink :to="back.to" class="back-link"><ArrowLeft :size="16" /> {{ back.label }}</RouterLink>

      <header class="head">
        <div class="head__chips">
          <span class="topic-chip">Climate · {{ thesis.topic.label }}</span>
          <span class="badge" :class="{ 'badge-brand': isPublished }">{{ isPublished ? 'Published' : 'Draft' }}</span>
          <span v-if="thesis.invested" class="badge badge-sky">Invested</span>
        </div>

        <form v-if="editing" class="edit" novalidate @submit.prevent="saveEdit">
          <div class="field">
            <label class="label" for="thesis-title">Title</label>
            <input id="thesis-title" v-model="draft.title" class="input" :class="{ 'is-invalid': editErrors.title }" maxlength="80" />
            <span v-if="editErrors.title" class="field-error">{{ editErrors.title }}</span>
          </div>
          <div class="field">
            <label class="label" for="thesis-statement">Thesis</label>
            <textarea id="thesis-statement" v-model="draft.statement" class="input" :class="{ 'is-invalid': editErrors.statement }" maxlength="500" />
            <span v-if="editErrors.statement" class="field-error">{{ editErrors.statement }}</span>
          </div>
          <div class="edit__actions">
            <button type="button" class="btn btn-ghost btn-sm" @click="editing = false">Cancel</button>
            <button type="submit" class="btn btn-primary btn-sm" :disabled="saving">
              <span v-if="saving" class="spinner" />
              Save changes
            </button>
          </div>
        </form>
        <template v-else>
          <h1 class="page-title head__title">{{ thesis.title }}</h1>
          <p class="head__statement">{{ thesis.statement }}</p>
          <p class="head__idea">{{ isOwner ? 'Your take' : 'Started as' }}: “{{ thesis.idea }}”</p>
        </template>

        <AuthorLine v-if="!isOwner" :author="thesis.author" class="head__author" />

        <div class="head__actions">
          <template v-if="isOwner">
            <button v-if="!editing" type="button" class="btn btn-ghost btn-sm" @click="startEdit"><Pencil :size="15" /> Edit thesis</button>
            <button v-if="!isPublished" type="button" class="btn btn-secondary" @click="publishOpen = true">
              <Megaphone :size="16" /> Publish
            </button>
            <template v-else>
              <RouterLink :to="`/t/${thesis.id}`" class="btn btn-secondary"><Globe :size="16" /> Public page</RouterLink>
              <button type="button" class="btn btn-ghost btn-icon" aria-label="Copy share link" @click="copyLink"><Link2 :size="17" /></button>
            </template>
            <RouterLink :to="`/app/theses/${thesis.id}/invest`" class="btn btn-primary">
              <Wallet :size="16" /> {{ thesis.position ? 'Add money' : 'Invest from $10' }}
            </RouterLink>
          </template>
          <template v-else>
            <button
              type="button"
              class="btn"
              :class="thesis.isFollowing ? 'btn-secondary' : 'btn-primary'"
              :disabled="followBusy"
              @click="toggleFollow"
            >
              <span v-if="followBusy" class="spinner" />
              {{ thesis.isFollowing ? 'Following' : 'Follow' }}
            </button>
            <RouterLink :to="`/t/${thesis.id}`" class="btn btn-ghost"><Globe :size="16" /> Public page</RouterLink>
          </template>
        </div>
      </header>

      <p v-if="thesis.notice" class="callout callout-sun notice"><Info :size="17" /> {{ thesis.notice }}</p>

      <div v-if="thesis.position" class="owned">
        <span class="owned__icon"><Wallet :size="18" /></span>
        <div class="grow">
          <p>
            <strong>You own this basket:</strong> {{ formatMoney(thesis.position.value) }}
            <span :class="thesis.position.gainPct >= 0 ? 'is-up' : 'is-down'">({{ formatReturn(thesis.position.gainPct) }})</span>
            · rebalances {{ scheduleLabel(thesis.position.schedule).toLowerCase() }}, next on
            {{ formatDate(thesis.position.nextRebalanceAt) }}
          </p>
          <p v-if="thesis.basketChangedSinceInvest" class="owned__note">
            You’ve changed the basket since investing. Your holdings switch to it at the next rebalance, or right away if you add money.
          </p>
        </div>
        <RouterLink to="/app/portfolio" class="link text-sm">Portfolio →</RouterLink>
      </div>

      <dl class="stats">
        <div class="stat">
          <dt>Claims that hold up</dt>
          <dd class="num">{{ thesis.claimCounts.supported }}<span> of {{ thesis.claimCounts.total }}</span></dd>
        </div>
        <div class="stat">
          <dt>Companies</dt>
          <dd class="num">{{ thesis.basket.length }}</dd>
        </div>
        <div class="stat">
          <dt>5-yr backtest vs S&P 500</dt>
          <dd class="num" :class="thesis.backtest.excess >= 0 ? 'is-up' : 'is-down'">{{ formatPts(thesis.backtest.excess) }}</dd>
        </div>
        <div v-if="isPublished" class="stat">
          <dt>Since published</dt>
          <dd v-if="thesis.record.tooEarly" class="num stat__early">Too early</dd>
          <dd v-else class="num" :class="thesis.record.excess >= 0 ? 'is-up' : 'is-down'">{{ formatPts(thesis.record.excess) }}</dd>
        </div>
        <div v-if="isPublished" class="stat">
          <dt>Following</dt>
          <dd class="num">{{ thesis.followers }}</dd>
        </div>
      </dl>

      <div class="layout" :class="{ 'layout--chat': isOwner }">
        <div class="main">
          <section>
            <div class="block-head">
              <h2 class="section-title">What must be true</h2>
              <p class="muted text-sm">The copilot checked each claim against company filings, government policy and adoption data.</p>
            </div>
            <ClaimList :claims="thesis.claims" show-challenges />
          </section>

          <section class="card card-pad">
            <div class="block-head block-head--row">
              <div>
                <h2 class="section-title">The basket</h2>
                <p class="muted text-sm">The {{ thesis.basket.length }} companies most exposed to the idea.</p>
              </div>
              <button v-if="isOwner" type="button" class="btn btn-secondary btn-sm" :disabled="thesis.basket.length >= 12" @click="addOpen = true">
                <Plus :size="15" /> Add company
              </button>
            </div>
            <div v-if="isOwner" class="weighting">
              <SegmentedControl :model-value="thesis.weighting" :options="WEIGHTINGS" label="Weighting" @update:model-value="setWeighting" />
              <span v-if="weightingBusy" class="spinner weighting__spin" />
              <span v-else class="muted text-xs">{{ weightingHint }}</span>
            </div>
            <BasketList :basket="thesis.basket" :editable="isOwner" :removing="removingSymbol" @remove="removeCompany" />
          </section>

          <section>
            <div class="block-head">
              <h2 class="section-title">Strongest arguments against</h2>
              <p class="muted text-sm">What would have to go wrong. Worth reading before you put money behind it.</p>
            </div>
            <CounterArguments :items="thesis.counterarguments" />
          </section>

          <section v-if="isPublished" class="card card-pad">
            <BacktestCard
              v-if="!thesis.record.tooEarly"
              :backtest="thesis.record"
              variant="record"
              title="Track record since publishing"
              :subtitle="`${formatDate(thesis.publishedAt, { month: 'short', day: 'numeric', year: 'numeric' })} to today · ${thesis.record.days} days`"
            />
            <div v-else class="early">
              <Clock :size="20" />
              <p>
                <strong>Too early to call.</strong>
                <span class="muted"> The track record starts scoring three weeks after publishing.</span>
              </p>
            </div>
            <p v-if="thesis.basketChangedSincePublish" class="muted text-xs record-note">
              The track record follows the basket as it was published, so later changes don’t rewrite the call.
            </p>
          </section>

          <section class="card card-pad">
            <BacktestCard :backtest="thesis.backtest" />
          </section>

          <section id="community" class="card card-pad">
            <div class="block-head">
              <h2 class="section-title">Community</h2>
              <p class="muted text-sm">Challenges, company suggestions and comments from members.</p>
            </div>
            <CommunityThread
              v-if="isPublished"
              :thesis="thesis"
              can-post
              :busy-id="busyCommentId"
              @posted="onPosted"
              @accept="acceptSuggestion"
              @dismiss="dismissSuggestion"
            />
            <div v-else class="publish-cta">
              <p>
                <strong>Publish to get the community’s take.</strong>
                Members can challenge your claims, suggest companies and follow how it holds up.
              </p>
              <button type="button" class="btn btn-secondary btn-sm" @click="publishOpen = true"><Megaphone :size="15" /> Publish</button>
            </div>
          </section>

          <div v-if="isOwner && !isPublished && !thesis.position" class="danger">
            <button type="button" class="btn btn-ghost btn-sm" @click="removeDraft"><Trash2 :size="15" /> Delete draft</button>
          </div>
        </div>

        <aside v-if="isOwner" class="rail" :class="{ 'is-open': chatOpen }">
          <button type="button" class="rail__close" aria-label="Close copilot" @click="chatOpen = false"><X :size="18" /></button>
          <CopilotChat
            :messages="thesis.messages"
            :busy="chatBusy"
            :pending="pendingMessage"
            :suggestions="chatSuggestions"
            :draft-seed="draftSeed"
            @send="sendMessage"
          />
        </aside>
      </div>

      <template v-if="isOwner">
        <button type="button" class="chat-fab" @click="chatOpen = true"><Sparkles :size="18" /> Ask the copilot</button>
        <Transition name="fade">
          <div v-if="chatOpen" class="rail-backdrop" @click="chatOpen = false" />
        </Transition>
        <AddCompanyModal :open="addOpen" :thesis="thesis" :busy-symbol="addingSymbol" @close="addOpen = false" @add="addCompany" />
        <UiModal :open="publishOpen" size="sm" label="Publish thesis" @close="publishOpen = false">
          <span class="publish__icon"><Megaphone :size="22" /></span>
          <h2 class="h-3 publish__title">Publish “{{ thesis.title }}”?</h2>
          <ul class="publish__list">
            <li>Members can challenge your claims, suggest companies and follow it.</li>
            <li>Your track record starts today, measured on the basket as it is right now.</li>
            <li>Published theses stay on your public profile, good calls and bad.</li>
          </ul>
          <div class="publish__actions">
            <button type="button" class="btn btn-ghost" @click="publishOpen = false">Not yet</button>
            <button type="button" class="btn btn-primary" :disabled="publishing" @click="publish">
              <span v-if="publishing" class="spinner" />
              Publish thesis
            </button>
          </div>
        </UiModal>
      </template>
    </template>
  </div>
</template>

<style scoped>
.workshop__loading {
  display: grid;
  gap: 18px;
}
.head {
  margin-bottom: 18px;
}
.head__chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.head__title {
  margin-top: 12px;
}
.head__statement {
  max-width: 820px;
  margin-top: 10px;
  font-size: 17px;
  line-height: 1.55;
  color: var(--ink-2);
}
.head__idea {
  margin-top: 8px;
  font-family: var(--font-wink);
  font-size: 19px;
  font-style: italic;
  color: var(--muted);
}
.head__author {
  margin-top: 16px;
}
.head__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}
.edit {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 820px;
  margin-top: 14px;
}
.edit textarea.input {
  min-height: 110px;
}
.edit__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.notice {
  margin-bottom: 18px;
}
.owned {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
  padding: 14px 16px;
  border: var(--outline-thin);
  border-radius: 18px;
  background: var(--sky-50);
  box-shadow: var(--shadow-xs);
  font-size: 14.5px;
}
.owned__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: 1.5px solid var(--ink-solid);
  border-radius: 12px;
  background: var(--signal);
  color: var(--cream);
}
.owned__note {
  margin-top: 4px;
  font-size: 13px;
  color: var(--muted);
}
.is-up {
  color: var(--score-great);
}
.is-down {
  color: var(--score-low);
}
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 28px;
}
.stat {
  flex: 1 1 150px;
  padding: 12px 16px;
  border: var(--outline-thin);
  border-radius: 16px;
  background: var(--surface);
}
.stat dt {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}
.stat dd {
  margin-top: 6px;
  font-family: var(--font-display);
  font-size: 32px;
  line-height: 0.95;
}
.stat dd span {
  font-size: 18px;
  color: var(--muted);
}
.stat dd.is-up {
  color: var(--score-great);
}
.stat dd.is-down {
  color: var(--score-low);
}
.stat__early {
  font-family: var(--font-sans) !important;
  font-size: 17px !important;
  font-weight: 700;
  color: var(--muted);
}
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}
.main {
  display: flex;
  flex-direction: column;
  gap: 26px;
  min-width: 0;
}
.block-head {
  margin-bottom: 14px;
}
.block-head .muted {
  margin-top: 2px;
}
.block-head--row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.weighting {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-bottom: 8px;
}
.weighting__spin {
  color: var(--brand-500);
}
.early {
  display: flex;
  align-items: center;
  gap: 12px;
}
.early svg {
  flex-shrink: 0;
  color: var(--flare);
}
.record-note {
  margin-top: 10px;
}
.publish-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px 18px;
  border: var(--outline-thin);
  border-radius: 16px;
  background: var(--lilac-100);
  color: var(--deep-violet);
}
.danger {
  display: flex;
  justify-content: center;
}
.publish__icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border: var(--outline-thin);
  border-radius: 18px;
  background: var(--sun);
  color: var(--ink);
  box-shadow: var(--shadow-xs);
}
.publish__title {
  margin-top: 16px;
}
.publish__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
  padding-left: 18px;
  list-style: disc;
  color: var(--ink-2);
  font-size: 14.5px;
}
.publish__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 22px;
}

/* Copilot rail: sticky column on wide screens, slide-over drawer below that. */
.rail {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 95;
  width: min(420px, 100%);
  padding: 12px;
  border-left: var(--outline);
  background: var(--bg);
  transform: translateX(105%);
  transition: transform 0.3s var(--ease);
}
.rail.is-open {
  transform: none;
}
.rail__close {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: var(--cream);
}
.rail__close:hover {
  background: rgba(23, 22, 29, 0.2);
}
.rail-backdrop {
  position: fixed;
  inset: 0;
  z-index: 94;
  background: rgba(23, 22, 29, 0.55);
}
.chat-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 46;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 52px;
  padding: 0 20px;
  border: var(--outline-thin);
  border-radius: var(--radius-pill);
  background: var(--ink);
  color: var(--cream);
  font-weight: 700;
  box-shadow: 4px 4px 0 var(--sun);
}
.chat-fab:active {
  box-shadow: none;
  transform: translate(2px, 2px);
}
@media (min-width: 1360px) {
  .layout--chat {
    grid-template-columns: minmax(0, 1fr) 360px;
  }
  .rail {
    position: sticky;
    top: 84px;
    z-index: auto;
    width: auto;
    height: calc(100vh - 108px);
    padding: 0;
    border-left: 0;
    background: none;
    transform: none;
    transition: none;
  }
  .rail__close,
  .rail-backdrop,
  .chat-fab {
    display: none;
  }
}
@media (max-width: 1023px) {
  .chat-fab {
    right: 16px;
    bottom: calc(92px + env(safe-area-inset-bottom));
  }
}
@media (max-width: 640px) {
  .rail {
    width: 100%;
    padding: 8px;
  }
  .rail__close {
    top: 18px;
    right: 18px;
  }
  .owned {
    flex-wrap: wrap;
  }
}
</style>
