<script setup>
import { shareService } from '@/api'
import BrandLogo from '@/components/ui/BrandLogo.vue'
import ScoreBar from '@/components/ui/ScoreBar.vue'
import ScoreRing from '@/components/ui/ScoreRing.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import UiModal from '@/components/ui/UiModal.vue'
import { useToast } from '@/composables/useToast'
import { CATEGORIES, band } from '@/utils/scoring'
import { AtSign, Check, Copy, ExternalLink, Link2, Mail, MessageCircle, Send, Share, Share2 } from '@lucide/vue'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  scanId: { type: String, required: true },
  security: { type: Object, default: null },
})
const emit = defineEmits(['close'])
const toast = useToast()

const note = ref('')
const creating = ref(false)
const share = ref(null)
const copied = ref(false)

watch(
  () => props.open,
  (open) => {
    if (open) {
      note.value = ''
      share.value = null
      copied.value = false
    }
  },
)

const url = computed(() => (share.value ? `${window.location.origin}${share.value.path}` : ''))
const meta = computed(() => (props.security ? band(props.security.score) : null))
const message = computed(() =>
  props.security
    ? `I checked ${props.security.name} (${props.security.symbol}) on outvest: ${props.security.score}/100, ${meta.value.label.toLowerCase()}. Take a look before you invest:`
    : '',
)
const channels = computed(() => {
  const text = encodeURIComponent(`${message.value} ${url.value}`)
  return [
    { label: 'Messages', icon: MessageCircle, href: `sms:?&body=${text}` },
    { label: 'WhatsApp', icon: Send, href: `https://wa.me/?text=${text}` },
    {
      label: 'Email',
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(`${props.security?.name} on outvest`)}&body=${text}`,
    },
    {
      label: 'X',
      icon: AtSign,
      href: `https://x.com/intent/tweet?text=${encodeURIComponent(message.value)}&url=${encodeURIComponent(url.value)}`,
    },
  ]
})
const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

async function createLink() {
  creating.value = true
  try {
    share.value = await shareService.create({ scanId: props.scanId, symbol: props.security.symbol, note: note.value })
  } catch (err) {
    toast.error("Couldn't create a link", { description: err.message })
  } finally {
    creating.value = false
  }
}

async function copy() {
  try {
    await navigator.clipboard.writeText(url.value)
    copied.value = true
    toast.success('Link copied', { description: 'Paste it anywhere to share.' })
    setTimeout(() => (copied.value = false), 2400)
  } catch {
    toast.error('Copy failed', { description: 'Select the link and copy it manually.' })
  }
}

async function nativeShare() {
  try {
    await navigator.share({ title: `${props.security.name} on outvest`, text: message.value, url: url.value })
  } catch {
    // User cancelled the share sheet.
  }
}
</script>

<template>
  <UiModal :open="open" size="md" label="Share with a friend" @close="emit('close')">
    <div v-if="security" class="share">
      <p class="eyebrow"><Share2 :size="15" /> Share with a friend</p>
      <h2 class="share__title">Send {{ security.symbol }}'s values check</h2>
      <p class="muted">Friends see a clean summary, no account needed. Your portfolio and amounts stay private.</p>

      <div class="share-card" :style="{ '--accent': security.color }">
        <div class="share-card__top">
          <SecurityLogo :symbol="security.symbol" :name="security.name" :color="security.color" :type="security.type" :size="42" />
          <div class="share-card__id">
            <span class="share-card__name">{{ security.name }}</span>
            <span class="share-card__symbol">{{ security.symbol }} · {{ security.sector }}</span>
          </div>
          <ScoreRing :score="security.score" :size="58" />
        </div>
        <p class="share-card__band" :style="{ color: meta.color }">{{ meta.label }}</p>
        <div class="share-card__bars">
          <div v-for="cat in CATEGORIES" :key="cat.key" class="share-card__bar">
            <span>{{ cat.short }}</span>
            <ScoreBar :score="security.categories[cat.key].score" :height="5" />
          </div>
        </div>
        <div class="share-card__foot">
          <BrandLogo :size="18" />
          <span>Invest in what you believe in</span>
        </div>
      </div>

      <template v-if="!share">
        <div class="field">
          <label class="label" for="share-note">Add a note <span class="muted">(optional)</span></label>
          <textarea
            id="share-note"
            v-model="note"
            class="input"
            maxlength="280"
            rows="3"
            placeholder="Thought you'd want to see this before you buy…"
          />
          <span class="field-hint">{{ note.length }}/280</span>
        </div>
        <button type="button" class="btn btn-primary btn-lg btn-block" :disabled="creating" @click="createLink">
          <span v-if="creating" class="spinner" />
          <Link2 v-else :size="18" />
          {{ creating ? 'Creating link…' : 'Create share link' }}
        </button>
      </template>

      <template v-else>
        <div class="share__link">
          <input class="input" readonly :value="url" aria-label="Share link" @focus="$event.target.select()" />
          <button type="button" class="btn btn-primary" @click="copy">
            <Check v-if="copied" :size="17" />
            <Copy v-else :size="17" />
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
        </div>
        <div class="share__channels">
          <a v-for="channel in channels" :key="channel.label" :href="channel.href" target="_blank" rel="noopener noreferrer" class="share__channel">
            <span class="share__channel-icon"><component :is="channel.icon" :size="19" /></span>
            {{ channel.label }}
          </a>
          <button v-if="canNativeShare" type="button" class="share__channel" @click="nativeShare">
            <span class="share__channel-icon"><Share :size="19" /></span>
            More
          </button>
        </div>
        <a :href="share.path" target="_blank" rel="noopener" class="share__preview">
          Preview the page your friend will see <ExternalLink :size="15" />
        </a>
      </template>
    </div>
  </UiModal>
</template>

<style scoped>
.share {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.share__title {
  font-size: 28px;
}
.share > .muted {
  margin-top: -6px;
  font-size: 14.5px;
}
.share-card {
  margin: 6px 0;
  padding: 20px;
  border-radius: 22px;
  background:
    radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 55%),
    linear-gradient(160deg, #fffdf8, var(--brand-25));
  border: 1px solid var(--line);
  box-shadow: var(--shadow-sm);
}
.share-card__top {
  display: flex;
  align-items: center;
  gap: 12px;
}
.share-card__id {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.share-card__name {
  font-weight: 750;
  font-size: 16px;
}
.share-card__symbol {
  font-size: 13px;
  color: var(--muted);
}
.share-card__band {
  margin-top: 12px;
  font-family: var(--font-display);
  font-variation-settings: 'SOFT' 100;
  font-size: 20px;
  font-weight: 600;
}
.share-card__bars {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 14px;
  margin-top: 12px;
}
.share-card__bar {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 650;
  color: var(--muted);
}
.share-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed var(--line-strong);
  font-size: 12px;
  color: var(--muted);
}
.share__link {
  display: flex;
  gap: 8px;
}
.share__link .input {
  font-size: 14px;
}
.share__channels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 8px;
}
.share__channel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 6px;
  border: 1px solid var(--line);
  border-radius: 16px;
  font-size: 13px;
  font-weight: 650;
  color: var(--ink-2);
  transition:
    border-color 0.2s,
    background-color 0.2s;
}
.share__channel:hover {
  border-color: var(--line-strong);
  background: var(--surface-muted);
}
.share__channel-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--brand-50);
  color: var(--brand-700);
}
.share__preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 650;
  color: var(--brand-700);
}
.share__preview:hover {
  text-decoration: underline;
}
@media (max-width: 480px) {
  .share-card__bars {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
