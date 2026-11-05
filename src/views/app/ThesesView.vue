<script setup>
import { thesesService } from '@/api'
import ThesisCard from '@/components/thesis/ThesisCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { Eye, Lightbulb, Plus } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const tab = ref(route.query.tab === 'following' ? 'following' : 'mine')
const { data: mine, loading: loadingMine } = useAsync(() => thesesService.list('mine'))
const { data: following, loading: loadingFollowing } = useAsync(() => thesesService.list('following'))
const busyId = ref(null)

watch(tab, (value) => router.replace({ query: value === 'following' ? { tab: 'following' } : {} }))

const options = computed(() => [
  { value: 'mine', label: 'Mine', count: mine.value?.length ?? undefined },
  { value: 'following', label: 'Following', count: following.value?.length ?? undefined },
])
const list = computed(() => (tab.value === 'mine' ? mine.value : following.value) ?? [])
const loading = computed(() => (tab.value === 'mine' ? loadingMine.value : loadingFollowing.value))

async function unfollow(thesis) {
  busyId.value = thesis.id
  try {
    await thesesService.unfollow(thesis.id)
    following.value = following.value.filter((t) => t.id !== thesis.id)
    toast.info(`Unfollowed “${thesis.title}”`)
  } catch (err) {
    toast.error('Couldn’t unfollow', { description: err.message })
  } finally {
    busyId.value = null
  }
}
</script>

<template>
  <div class="page theses">
    <header class="page-head">
      <div>
        <h1 class="page-title">My theses</h1>
        <p class="page-sub">Drafts you’re workshopping, calls you’ve published, and theses you follow.</p>
      </div>
      <RouterLink to="/app/pitch" class="btn btn-primary"><Plus :size="18" /> New thesis</RouterLink>
    </header>

    <SegmentedControl v-model="tab" :options="options" label="Which theses" class="theses__tabs" />

    <div v-if="loading" class="grid">
      <div v-for="n in 4" :key="n" class="skeleton" style="height: 240px" />
    </div>

    <div v-else-if="list.length" class="grid">
      <ThesisCard
        v-for="thesis in list"
        :key="thesis.id"
        :thesis="thesis"
        :to="`/app/theses/${thesis.id}`"
        :show-author="tab === 'following'"
        :followable="tab === 'following'"
        :busy="busyId === thesis.id"
        @follow="unfollow"
      />
    </div>

    <div v-else class="card">
      <EmptyState
        v-if="tab === 'mine'"
        :icon="Lightbulb"
        title="No theses yet"
        text="Pitch a climate idea in plain words. The copilot turns it into claims, a basket and a backtest."
      >
        <RouterLink to="/app/pitch" class="btn btn-primary">Pitch your first idea</RouterLink>
      </EmptyState>
      <EmptyState
        v-else
        :icon="Eye"
        title="You’re not following any theses"
        text="Follow theses in the community to see how they hold up over time."
      >
        <RouterLink to="/app/community" class="btn btn-primary">Browse the community</RouterLink>
      </EmptyState>
    </div>
  </div>
</template>

<style scoped>
.theses__tabs {
  margin-bottom: 20px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
@media (max-width: 760px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
