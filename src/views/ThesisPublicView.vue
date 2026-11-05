<script setup>
import { thesesService } from '@/api'
import AuthorLine from '@/components/thesis/AuthorLine.vue'
import BacktestCard from '@/components/thesis/BacktestCard.vue'
import BasketList from '@/components/thesis/BasketList.vue'
import ClaimList from '@/components/thesis/ClaimList.vue'
import CommunityThread from '@/components/thesis/CommunityThread.vue'
import CounterArguments from '@/components/thesis/CounterArguments.vue'
import PromptBar from '@/components/thesis/PromptBar.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { useSessionStore } from '@/stores/session'
import { formatDate, formatDateLong } from '@/utils/format'
import { trackRecordLine } from '@/utils/thesis'
import { Clock, Info, Link2, Link2Off, Sparkles, Users } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const toast = useToast()

const { data: thesis, error, loading } = useAsync(() => thesesService.get(route.params.thesisId))
const following = ref(false)
const busyCommentId = ref(null)
const idea = ref('')

const record = computed(() => thesis.value?.record)

async function toggleFollow() {
  if (!session.isAuthed) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  following.value = true
  try {
    const result = thesis.value.isFollowing
      ? await thesesService.unfollow(thesis.value.id)
      : await thesesService.follow(thesis.value.id)
    thesis.value = { ...thesis.value, ...result }
    if (result.isFollowing) toast.success('Following this thesis', { description: 'It’s in My theses → Following.' })
  } catch (err) {
    toast.error('Couldn’t update', { description: err.message })
  } finally {
    following.value = false
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied')
  } catch {
    toast.info('Copy this page’s address to share it.')
  }
}

function onPosted(comment) {
  const claims = thesis.value.claims.map((c) =>
    comment.claim?.id === c.id ? { ...c, challenges: c.challenges + 1 } : c,
  )
  thesis.value = { ...thesis.value, claims, comments: [comment, ...thesis.value.comments], commentsCount: thesis.value.commentsCount + 1 }
  toast.success('Posted', { description: 'The author will see it in their workshop.' })
}

// Authors can act on suggestions here too, not just in the workshop.
async function handleSuggestion(comment, accept) {
  busyCommentId.value = comment.id
  try {
    thesis.value = accept
      ? await thesesService.acceptSuggestion(thesis.value.id, comment.id)
      : await thesesService.dismissSuggestion(thesis.value.id, comment.id)
    if (accept) toast.success(`Added ${comment.company.name}`, { description: 'The copilot noted it in your workshop chat.' })
  } catch (err) {
    toast.error(accept ? 'Couldn’t add that company' : 'Couldn’t dismiss', { description: err.message })
  } finally {
    busyCommentId.value = null
  }
}

function pitch(text) {
  router.push(session.isAuthed ? { path: '/app/pitch', query: { idea: text } } : { name: 'signup', query: { idea: text } })
}
</script>

<template>
  <div class="container public-thesis">
    <div v-if="loading" class="public-thesis__loading">
      <div class="skeleton" style="height: 220px" />
      <div class="skeleton" style="height: 420px" />
    </div>

    <div v-else-if="error" class="card">
      <EmptyState :icon="Link2Off" title="This thesis isn’t available" :text="error.message">
        <RouterLink to="/" class="btn btn-primary">Discover Outvest</RouterLink>
      </EmptyState>
    </div>

    <div v-else-if="thesis && thesis.status !== 'published'" class="card">
      <EmptyState :icon="Link2Off" title="This thesis is still a draft" text="Publish it from your workshop to give it a public page and start its track record.">
        <RouterLink :to="`/app/theses/${thesis.id}`" class="btn btn-primary">Open in my workshop</RouterLink>
      </EmptyState>
    </div>

    <template v-else-if="thesis">
      <header class="head card fade-up">
        <div class="head__main">
          <span class="topic-chip">Climate · {{ thesis.topic.label }}</span>
          <h1 class="h-1 head__title">{{ thesis.title }}</h1>
          <p class="lead head__statement">{{ thesis.statement }}</p>
          <p class="head__idea">Started as: “{{ thesis.idea }}”</p>
          <div class="head__meta">
            <AuthorLine :author="thesis.author" />
            <span class="head__fact">Published {{ formatDateLong(thesis.publishedAt) }}</span>
            <span class="head__fact"><Users :size="15" /> {{ thesis.followers }} following</span>
          </div>
        </div>
        <div class="head__actions">
          <RouterLink v-if="thesis.isOwner" :to="`/app/theses/${thesis.id}`" class="btn btn-primary">Open in my workshop</RouterLink>
          <button
            v-else
            type="button"
            class="btn"
            :class="thesis.isFollowing ? 'btn-secondary' : 'btn-primary'"
            :disabled="following"
            @click="toggleFollow"
          >
            <span v-if="following" class="spinner" />
            {{ thesis.isFollowing ? 'Following' : 'Follow this thesis' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="copyLink"><Link2 :size="16" /> Copy link</button>
        </div>
      </header>

      <div class="layout">
        <div class="main">
          <section class="card card-pad">
            <BacktestCard
              v-if="!record.tooEarly"
              :backtest="record"
              variant="record"
              title="Since it was published"
              :subtitle="`${formatDate(thesis.publishedAt, { month: 'short', day: 'numeric', year: 'numeric' })} to today · ${record.days} days`"
            />
            <div v-else class="early">
              <Clock :size="20" />
              <div>
                <p class="strong">Too early to call</p>
                <p class="muted">Published {{ record.days }} {{ record.days === 1 ? 'day' : 'days' }} ago. Track records start after three weeks.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 class="section-title block-title">What must be true</h2>
            <ClaimList :claims="thesis.claims" show-challenges />
          </section>

          <section class="card card-pad">
            <h2 class="section-title">The basket</h2>
            <p class="muted text-sm block-sub">{{ thesis.basket.length }} companies, weighted by how exposed they are to the idea.</p>
            <p v-if="thesis.basketChangedSincePublish" class="callout callout-lilac block-note">
              <Info :size="16" /> The author has changed the basket since publishing. The track record follows the basket as it was published.
            </p>
            <BasketList :basket="thesis.basket" />
          </section>

          <section>
            <h2 class="section-title block-title">Strongest arguments against</h2>
            <CounterArguments :items="thesis.counterarguments" />
          </section>

          <section class="card card-pad">
            <BacktestCard :backtest="thesis.backtest" />
          </section>

          <section class="card card-pad">
            <h2 class="section-title">Community</h2>
            <p class="muted text-sm block-sub">Challenges, company suggestions and comments from members.</p>
            <CommunityThread
              :thesis="thesis"
              :can-post="session.isAuthed"
              :busy-id="busyCommentId"
              @posted="onPosted"
              @accept="handleSuggestion($event, true)"
              @dismiss="handleSuggestion($event, false)"
            />
          </section>
        </div>

        <aside class="aside">
          <div class="pitch-card">
            <span class="pitch-card__icon"><Sparkles :size="18" /></span>
            <h2 class="pitch-card__title">Got your own climate hot take?</h2>
            <p class="pitch-card__text">The copilot turns it into a thesis like this one. Free to build, workshop and publish.</p>
            <PromptBar v-model="idea" submit-label="Test it" placeholder="What do you see coming?" @submit="pitch" />
          </div>
          <div class="card card-pad author-card">
            <AuthorLine :author="thesis.author" size="lg" :show-record="false" />
            <p v-if="thesis.author.bio" class="author-card__bio">{{ thesis.author.bio }}</p>
            <p class="author-card__record">{{ trackRecordLine(thesis.author.record) }}</p>
            <RouterLink :to="`/u/${thesis.author.handle}`" class="link text-sm">See every call →</RouterLink>
          </div>
        </aside>
      </div>
      <p class="disclaimer">Illustrative demo data. Outvest offers research tools, not investment advice.</p>
    </template>
  </div>
</template>

<style scoped>
.public-thesis {
  padding-top: 32px;
  padding-bottom: 72px;
}
.public-thesis__loading {
  display: grid;
  gap: 18px;
}
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 40px;
  padding: 30px;
  border: var(--outline);
  border-radius: 28px;
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-lg);
}
.head__main {
  max-width: 780px;
}
.head__title {
  margin-top: 14px;
  font-size: clamp(42px, 5.4vw, 76px);
}
.head__statement {
  margin-top: 14px;
}
.head__idea {
  margin-top: 10px;
  font-family: var(--font-wink);
  font-size: 20px;
  font-style: italic;
  color: var(--muted);
}
.head__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 22px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 2px dashed var(--ink-solid);
}
.head__fact {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-2);
}
.head__actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  flex-shrink: 0;
}
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 28px;
  align-items: start;
}
.main {
  display: flex;
  flex-direction: column;
  gap: 28px;
  min-width: 0;
}
.block-title {
  margin-bottom: 16px;
  font-family: var(--font-display);
  font-size: clamp(32px, 3.6vw, 46px);
  font-weight: 400;
  line-height: 0.95;
  letter-spacing: 0.005em;
  text-transform: uppercase;
  color: var(--cream);
  text-shadow: 4px 4px 0 var(--ink-solid);
}
.block-sub {
  margin: 2px 0 12px;
}
.block-note {
  margin-bottom: 8px;
}
.early {
  display: flex;
  align-items: center;
  gap: 14px;
  color: var(--ink-2);
}
.early svg {
  flex-shrink: 0;
  color: var(--flare);
}
.aside {
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.pitch-card {
  padding: 22px;
  border: var(--outline);
  border-radius: 24px;
  background: var(--ink-solid);
  color: var(--cream);
  box-shadow: 6px 6px 0 var(--sun);
}
.pitch-card__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: var(--outline-thin);
  border-radius: 12px;
  background: var(--sun);
  color: var(--ink);
}
.pitch-card__title {
  margin-top: 14px;
  font-size: 32px;
  line-height: 0.95;
  color: var(--cream);
}
.pitch-card__text {
  margin: 8px 0 16px;
  font-size: 14px;
  color: #d8d3dd;
}
.pitch-card :deep(.prompt) {
  flex-wrap: wrap;
  padding: 8px 8px 8px 14px;
  box-shadow: 4px 4px 0 var(--bubblegum);
}
.pitch-card :deep(.prompt__icon) {
  display: none;
}
.pitch-card :deep(.prompt__submit) {
  width: 100%;
}
.author-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.author-card__bio {
  color: var(--ink-2);
  font-size: 14.5px;
}
.author-card__record {
  font-size: 14px;
  font-weight: 650;
}
@media (max-width: 1023px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .aside {
    position: static;
  }
  .head {
    flex-direction: column;
  }
  .head__actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
@media (max-width: 640px) {
  .head {
    padding: 20px;
  }
}
</style>
