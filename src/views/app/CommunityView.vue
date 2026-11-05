<script setup>
import { communityService, copilotService, thesesService } from '@/api'
import ThesisCard from '@/components/thesis/ThesisCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { Flame, Clock, SearchX, Trophy } from '@lucide/vue'
import { ref, watch } from 'vue'

const toast = useToast()

const SORTS = [
  { value: 'trending', label: 'Trending', icon: Flame },
  { value: 'new', label: 'New', icon: Clock },
  { value: 'top', label: 'Top calls', icon: Trophy },
]
const sort = ref('trending')
const topic = ref('')
const items = ref([])
const loading = ref(true)
const busyId = ref(null)
const { data: themes } = useAsync(() => copilotService.themes())
let sequence = 0

async function load() {
  const mine = ++sequence
  loading.value = true
  try {
    const result = await communityService.list({ sort: sort.value, topic: topic.value, limit: 30 })
    if (mine === sequence) items.value = result
  } finally {
    if (mine === sequence) loading.value = false
  }
}
watch([sort, topic], load, { immediate: true })

async function toggleFollow(thesis) {
  busyId.value = thesis.id
  try {
    const result = thesis.isFollowing ? await thesesService.unfollow(thesis.id) : await thesesService.follow(thesis.id)
    items.value = items.value.map((t) => (t.id === thesis.id ? { ...t, ...result } : t))
    if (result.isFollowing) toast.success('Following', { description: 'Find it in My theses → Following.' })
  } catch (err) {
    toast.error('Couldn’t update', { description: err.message })
  } finally {
    busyId.value = null
  }
}
</script>

<template>
  <div class="page community">
    <header class="page-head">
      <div>
        <h1 class="page-title">Community</h1>
        <p class="page-sub">
          Climate theses from members. Challenge their assumptions, suggest companies, and follow the ones you want to track.
        </p>
      </div>
    </header>

    <div class="controls">
      <SegmentedControl v-model="sort" :options="SORTS" label="Sort theses" />
      <div class="topics" role="group" aria-label="Filter by topic">
        <button type="button" class="chip" :class="{ 'is-active': !topic }" @click="topic = ''">All topics</button>
        <button
          v-for="t in themes?.themes[0].topics ?? []"
          :key="t.key"
          type="button"
          class="chip"
          :class="{ 'is-active': topic === t.key }"
          @click="topic = t.key"
        >
          {{ t.short }}
        </button>
      </div>
    </div>
    <p v-if="sort === 'top'" class="muted text-sm hint">Ranked by how each basket has done against the S&P 500 since it was published.</p>

    <div v-if="loading" class="grid">
      <div v-for="n in 4" :key="n" class="skeleton" style="height: 260px" />
    </div>
    <div v-else-if="items.length" class="grid">
      <ThesisCard
        v-for="thesis in items"
        :key="thesis.id"
        :thesis="thesis"
        :to="`/app/theses/${thesis.id}`"
        followable
        :busy="busyId === thesis.id"
        @follow="toggleFollow"
      />
    </div>
    <div v-else class="card">
      <EmptyState :icon="SearchX" title="No published theses on this topic yet" text="Be the first: pitch an idea and publish it.">
        <RouterLink to="/app/pitch" class="btn btn-primary">Pitch an idea</RouterLink>
      </EmptyState>
    </div>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 18px;
}
.topics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.hint {
  margin: -6px 0 16px;
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
  .topics {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
  }
  .topics .chip {
    flex-shrink: 0;
  }
}
</style>
