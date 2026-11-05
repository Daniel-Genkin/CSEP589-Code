<script setup>
import { ERROR_CODES, thesesService } from '@/api'
import CopilotProgress from '@/components/thesis/CopilotProgress.vue'
import PromptBar from '@/components/thesis/PromptBar.vue'
import { useSessionStore } from '@/stores/session'
import { EXAMPLE_IDEAS } from '@/utils/thesis'
import { CalendarClock, Info, Leaf, Target, Wrench } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()

const idea = ref(typeof route.query.idea === 'string' ? route.query.idea.slice(0, 280) : '')
const welcome = route.query.welcome === '1'
const status = ref('idle')
const created = ref(null)
const error = ref(null)

const tips = [
  { icon: Target, title: 'Name the shift', text: 'Say what changes and why the market is missing it.' },
  { icon: CalendarClock, title: 'Add a timeline', text: '“By 2030” or “in five years” makes the thesis easier to test.' },
  { icon: Wrench, title: 'Bring what you know', text: 'Work in the industry? That’s your edge. The community will ask.' },
]

async function build(text) {
  status.value = 'working'
  error.value = null
  created.value = null
  try {
    created.value = await thesesService.create(text)
  } catch (err) {
    status.value = 'idle'
    error.value = {
      message: err.message,
      field: err.details?.idea ?? null,
      suggestions: err.code === ERROR_CODES.OFF_THEME ? (err.details?.suggestions ?? []) : [],
    }
  }
}

function onFinished() {
  router.replace(`/app/theses/${created.value.id}`)
}

function useSuggestion(text) {
  idea.value = text
  build(text)
}

onMounted(() => {
  // Ideas carried over from the landing page or sign-up start building right away.
  if (route.query.idea || route.query.welcome) router.replace({ query: {} })
  if (idea.value.trim()) build(idea.value.trim())
})
</script>

<template>
  <div class="page pitch">
    <CopilotProgress
      v-if="status === 'working'"
      active
      :done="Boolean(created)"
      title="The copilot is building your thesis"
      class="pitch__progress fade-up"
      @finished="onFinished"
    />

    <template v-else>
      <header class="pitch__head">
        <span class="eyebrow"><Leaf :size="15" /> Climate collection</span>
        <h1 class="page-title">{{ welcome ? `Welcome, ${session.firstName}. What’s your hot take?` : 'What’s your hot take?' }}</h1>
        <p class="page-sub">
          Say it the way you’d say it to a friend. No forms, no tickers. The copilot turns it into a thesis you can test.
        </p>
      </header>

      <div class="pitch__card card">
        <PromptBar
          v-model="idea"
          size="lg"
          :examples="EXAMPLE_IDEAS"
          :error="error?.field ?? ''"
          :autofocus="!idea"
          @submit="build"
        />
        <div v-if="error && !error.field" class="callout callout-sun pitch__error">
          <Info :size="18" />
          <div>
            <p class="strong">{{ error.message }}</p>
            <div v-if="error.suggestions.length" class="pitch__suggestions">
              <button v-for="s in error.suggestions" :key="s" type="button" class="chip" @click="useSuggestion(s)">{{ s }}</button>
            </div>
          </div>
        </div>
      </div>

      <ul class="tips">
        <li v-for="tip in tips" :key="tip.title" class="tip">
          <span class="tip__icon"><component :is="tip.icon" :size="18" /></span>
          <span>
            <strong>{{ tip.title }}</strong>
            <span class="muted">{{ tip.text }}</span>
          </span>
        </li>
      </ul>
      <p class="pitch__themes">
        <span class="topic-chip">Climate</span> is the first collection. More themes are on the way.
      </p>
    </template>
  </div>
</template>

<style scoped>
.pitch {
  max-width: 860px;
  margin: 0 auto;
}
.pitch__head {
  margin: 12px 0 24px;
}
.pitch__head .page-title {
  margin-top: 10px;
}
.pitch__card {
  padding: 24px;
  border-radius: 28px;
}
.pitch__error {
  margin-top: 16px;
}
.pitch__suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.pitch__progress {
  max-width: 720px;
  margin: 32px auto 0;
}
.tips {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 22px;
}
.tip {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
  border: var(--outline-thin);
  background: var(--surface-muted);
  font-size: 14px;
}
.tip > span:last-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tip__icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border: 1.5px solid var(--ink-solid);
  border-radius: 11px;
  background: var(--sun);
  color: var(--ink);
}
.pitch__themes {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 22px;
  font-size: 14px;
  color: var(--muted);
}
@media (max-width: 760px) {
  .tips {
    grid-template-columns: minmax(0, 1fr);
  }
  .pitch__card {
    padding: 16px;
    border-radius: 22px;
  }
}
</style>
