<script setup>
import { thesesService } from '@/api'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import { timeAgo } from '@/utils/format'
import { Check, Lightbulb, MessageSquare, MessageSquareWarning, X } from '@lucide/vue'
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import CompanyPicker from './CompanyPicker.vue'

const props = defineProps({
  thesis: { type: Object, required: true },
  canPost: { type: Boolean, default: false },
  busyId: { type: String, default: null },
})
const emit = defineEmits(['posted', 'accept', 'dismiss'])
const route = useRoute()

const KINDS = [
  { value: 'challenge', label: 'Challenge a claim', icon: MessageSquareWarning },
  { value: 'suggestion', label: 'Suggest a company', icon: Lightbulb },
  { value: 'comment', label: 'Comment', icon: MessageSquare },
]
const PLACEHOLDERS = {
  challenge: 'What makes you doubt this claim? Point to evidence if you can.',
  suggestion: 'Why does this company belong in the basket?',
  comment: 'Add to the discussion…',
}

const form = reactive({ kind: 'challenge', claimId: props.thesis.claims[0]?.id ?? '', company: null, text: '' })
const posting = ref(false)
const error = ref('')
const kind = computed(() => (props.thesis.isOwner ? 'comment' : form.kind))
const exclude = computed(() => props.thesis.basket.map((b) => b.symbol))

async function post() {
  error.value = ''
  if (kind.value === 'suggestion' && !form.company) {
    error.value = 'Pick a company to suggest.'
    return
  }
  if (form.text.trim().length < 2) {
    error.value = 'Add a note so the author knows what you mean.'
    return
  }
  posting.value = true
  try {
    const comment = await thesesService.comment(props.thesis.id, {
      kind: kind.value,
      text: form.text.trim(),
      claimId: kind.value === 'challenge' ? form.claimId : undefined,
      symbol: kind.value === 'suggestion' ? form.company.symbol : undefined,
    })
    form.text = ''
    form.company = null
    emit('posted', comment)
  } catch (err) {
    error.value = err.message
  } finally {
    posting.value = false
  }
}
</script>

<template>
  <div class="thread">
    <div v-if="canPost" class="composer">
      <SegmentedControl v-if="!thesis.isOwner" v-model="form.kind" :options="KINDS" label="What kind of note?" class="composer__kinds" />

      <div v-if="kind === 'challenge'" class="field">
        <label class="label" for="challenge-claim">Which claim?</label>
        <select id="challenge-claim" v-model="form.claimId" class="input">
          <option v-for="(claim, i) in thesis.claims" :key="claim.id" :value="claim.id">Claim {{ i + 1 }}: {{ claim.text }}</option>
        </select>
      </div>

      <div v-if="kind === 'suggestion'" class="field">
        <span class="label">Which company?</span>
        <div v-if="form.company" class="picked">
          <SecurityLogo :symbol="form.company.symbol" :name="form.company.name" :color="form.company.color" :size="32" />
          <span class="grow"><strong>{{ form.company.name }}</strong> <span class="muted text-sm">{{ form.company.symbol }}</span></span>
          <button type="button" class="btn btn-ghost btn-sm" @click="form.company = null">Change</button>
        </div>
        <CompanyPicker v-else :topic="thesis.topic.key" :exclude="exclude" action-label="Suggest" @select="form.company = $event" />
      </div>

      <div class="field">
        <label class="sr-only" for="thread-text">Your note</label>
        <textarea
          id="thread-text"
          v-model="form.text"
          class="input"
          maxlength="500"
          :placeholder="thesis.isOwner ? 'Reply to the community…' : PLACEHOLDERS[kind]"
        />
      </div>
      <p v-if="error" class="field-error">{{ error }}</p>
      <div class="composer__actions">
        <span class="muted text-xs">Notes are public and show your name and handle.</span>
        <button type="button" class="btn btn-primary btn-sm" :disabled="posting" @click="post">
          <span v-if="posting" class="spinner" />
          {{ thesis.isOwner ? 'Post reply' : kind === 'challenge' ? 'Post challenge' : kind === 'suggestion' ? 'Suggest company' : 'Post comment' }}
        </button>
      </div>
    </div>
    <div v-else class="join">
      <p><strong>Know this industry?</strong> Log in to challenge a claim, suggest a company or follow this thesis.</p>
      <div class="join__actions">
        <RouterLink :to="{ name: 'signup' }" class="btn btn-primary btn-sm">Join free</RouterLink>
        <RouterLink :to="{ name: 'login', query: { redirect: route.fullPath } }" class="btn btn-secondary btn-sm">Log in</RouterLink>
      </div>
    </div>

    <ul v-if="thesis.comments.length" class="comments">
      <li v-for="comment in thesis.comments" :key="comment.id" class="comment">
        <span class="avatar comment__avatar">{{ comment.author.initials }}</span>
        <div class="comment__body">
          <p class="comment__head">
            <RouterLink :to="`/u/${comment.author.handle}`" class="comment__name">{{ comment.author.name }}</RouterLink>
            <span class="muted">@{{ comment.author.handle }}</span>
            <span v-if="comment.author.isAuthor" class="badge badge-brand">Author</span>
            <span class="muted">· {{ timeAgo(comment.createdAt) }}</span>
          </p>
          <p v-if="comment.kind === 'challenge' && comment.claim" class="comment__kind comment__kind--challenge">
            <MessageSquareWarning :size="14" /> Challenges claim {{ comment.claim.number }}: “{{ comment.claim.text }}”
          </p>
          <p v-else-if="comment.kind === 'suggestion'" class="comment__kind comment__kind--suggestion">
            <Lightbulb :size="14" /> Suggests a company
          </p>
          <p class="comment__text">{{ comment.text }}</p>

          <div v-if="comment.kind === 'suggestion' && comment.company" class="suggested">
            <SecurityLogo :symbol="comment.company.symbol" :name="comment.company.name" :color="comment.company.color" :size="32" />
            <span class="grow">
              <strong>{{ comment.company.name }}</strong>
              <span class="muted text-sm"> {{ comment.company.symbol }} · {{ comment.company.sector }}</span>
            </span>
            <span v-if="comment.status === 'accepted'" class="suggested__status is-accepted"><Check :size="14" /> Added to the basket</span>
            <span v-else-if="comment.status === 'dismissed'" class="suggested__status">Not added</span>
            <template v-else-if="thesis.isOwner">
              <button type="button" class="btn btn-soft btn-sm" :disabled="Boolean(busyId)" @click="emit('accept', comment)">
                <span v-if="busyId === comment.id" class="spinner" />
                <Check v-else :size="15" />
                Add to basket
              </button>
              <button type="button" class="btn btn-ghost btn-sm btn-icon" :disabled="Boolean(busyId)" aria-label="Dismiss suggestion" @click="emit('dismiss', comment)">
                <X :size="15" />
              </button>
            </template>
            <span v-else class="suggested__status">Waiting on the author</span>
          </div>
        </div>
      </li>
    </ul>
    <p v-else class="empty">No notes yet. Challenges and company suggestions from members show up here.</p>
  </div>
</template>

<style scoped>
.composer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
  border: var(--outline-thin);
  background: var(--surface-muted);
}
.composer__kinds {
  align-self: flex-start;
}
.composer textarea.input {
  min-height: 84px;
}
.composer__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.picked {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 14px;
  border: var(--outline-thin);
  background: var(--surface);
}
.join {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding: 16px 18px;
  border: var(--outline-thin);
  border-radius: 18px;
  background: var(--lilac-100);
  color: var(--deep-violet);
}
.join__actions {
  display: flex;
  gap: 8px;
}
.comments {
  display: flex;
  flex-direction: column;
  margin-top: 8px;
}
.comment {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 2px dashed var(--line);
}
.comment:last-child {
  border-bottom: 0;
}
.comment__avatar {
  width: 34px;
  height: 34px;
  font-size: 13px;
}
.comment__body {
  flex: 1;
  min-width: 0;
}
.comment__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
}
.comment__name {
  font-weight: 700;
}
.comment__name:hover {
  color: var(--brand-700);
}
.comment__kind {
  display: inline-flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 6px;
  font-size: 13px;
  font-weight: 650;
}
.comment__kind svg {
  flex-shrink: 0;
  margin-top: 2px;
}
.comment__kind--challenge {
  color: var(--lilac-700);
}
.comment__kind--suggestion {
  color: var(--sun-700);
}
.comment__text {
  margin-top: 4px;
  color: var(--ink-2);
}
.suggested {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: var(--outline-thin);
  background: var(--surface);
  box-shadow: var(--shadow-xs);
}
.suggested__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 650;
  color: var(--muted);
}
.suggested__status.is-accepted {
  color: var(--score-great);
}
.empty {
  margin-top: 14px;
  color: var(--muted);
  font-size: 14.5px;
}
</style>
