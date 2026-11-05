<script setup>
import { timeAgo } from '@/utils/format'
import { SendHorizontal, Sparkles } from '@lucide/vue'
import { nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps({
  messages: { type: Array, required: true },
  busy: { type: Boolean, default: false },
  pending: { type: String, default: null },
  suggestions: { type: Array, default: () => [] },
  draftSeed: { type: String, default: '' },
})
const emit = defineEmits(['send'])

const draft = ref('')
const log = ref(null)

watch(
  () => props.draftSeed,
  (seed) => {
    if (seed) draft.value = seed
  },
  { immediate: true },
)

function scrollToEnd() {
  nextTick(() => {
    if (log.value) log.value.scrollTop = log.value.scrollHeight
  })
}

watch(() => [props.messages.length, props.busy, props.pending], scrollToEnd)
onMounted(scrollToEnd)

function send(text) {
  const message = String(text || '').trim()
  if (!message || props.busy) return
  emit('send', message)
  if (text === draft.value) draft.value = ''
}
</script>

<template>
  <section class="chat" aria-label="Copilot chat">
    <header class="chat__head">
      <span class="chat__avatar"><Sparkles :size="17" /></span>
      <div>
        <p class="chat__title">Copilot</p>
        <p class="chat__sub">Push back, ask why, or swap companies in and out.</p>
      </div>
    </header>

    <div ref="log" class="chat__log" aria-live="polite">
      <div v-for="message in messages" :key="message.id" class="msg" :class="`msg--${message.role}`">
        <p class="msg__text">{{ message.text }}</p>
        <span class="msg__time">{{ timeAgo(message.at) }}</span>
      </div>
      <div v-if="pending" class="msg msg--user">
        <p class="msg__text">{{ pending }}</p>
      </div>
      <div v-if="busy" class="msg msg--copilot msg--typing" aria-label="Copilot is typing">
        <span /><span /><span />
      </div>
    </div>

    <div v-if="suggestions.length" class="chat__suggestions">
      <button v-for="s in suggestions" :key="s" type="button" class="chip chat__chip" :disabled="busy" @click="send(s)">{{ s }}</button>
    </div>

    <form class="chat__composer" @submit.prevent="send(draft)">
      <textarea
        v-model="draft"
        class="chat__input"
        rows="1"
        maxlength="500"
        placeholder="Push back on the copilot…"
        aria-label="Message the copilot"
        @keydown.enter.exact.prevent="send(draft)"
      />
      <button type="submit" class="btn btn-primary btn-icon btn-sm" :disabled="busy || !draft.trim()" aria-label="Send">
        <SendHorizontal :size="16" />
      </button>
    </form>
  </section>
</template>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  border: var(--outline);
  border-radius: 24px;
  background: var(--surface);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.chat__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: var(--outline-thin);
  background: var(--signal);
  color: var(--cream);
}
.chat__avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: var(--outline-thin);
  border-radius: 12px;
  background: var(--sun);
  color: var(--ink);
  box-shadow: var(--shadow-xs);
}
.chat__title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 400;
  line-height: 1;
  text-transform: uppercase;
}
.chat__sub {
  margin-top: 2px;
  font-size: 13px;
  color: #dfe2ff;
}
.chat__log {
  flex: 1;
  min-height: 160px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--surface-muted);
}
.msg {
  max-width: 88%;
  padding: 10px 13px;
  border: var(--outline-thin);
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  box-shadow: var(--shadow-xs);
}
.msg__text {
  white-space: pre-line;
}
.msg__time {
  display: block;
  margin-top: 4px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  opacity: 0.65;
}
.msg--copilot {
  align-self: flex-start;
  border-top-left-radius: 6px;
  background: var(--surface);
  color: var(--ink);
}
.msg--user {
  align-self: flex-end;
  border-top-right-radius: 6px;
  background: var(--signal);
  color: var(--cream);
}
.msg--typing {
  display: inline-flex;
  gap: 4px;
  padding: 14px 16px;
}
.msg--typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--subtle);
  animation: typing 1.2s ease-in-out infinite;
}
.msg--typing span:nth-child(2) {
  animation-delay: 0.15s;
}
.msg--typing span:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}
.chat__suggestions {
  display: flex;
  gap: 6px;
  padding: 12px 12px 4px;
  border-top: var(--outline-thin);
  overflow-x: auto;
  scrollbar-width: none;
}
.chat__suggestions::-webkit-scrollbar {
  display: none;
}
.chat__chip {
  flex-shrink: 0;
  height: 30px;
  border-style: dashed;
  font-size: 12.5px;
}
.chat__chip:hover:not(:disabled) {
  border-style: solid;
}
.chat__composer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 12px 12px;
}
.chat__input {
  flex: 1;
  min-height: 40px;
  max-height: 120px;
  padding: 9px 14px;
  border: var(--outline-thin);
  border-radius: 14px;
  background: var(--surface);
  resize: none;
  font-size: 14.5px;
  line-height: 1.45;
  field-sizing: content;
  transition: box-shadow 0.2s;
}
.chat__input:focus {
  outline: none;
  box-shadow: var(--shadow-sm);
}
</style>
