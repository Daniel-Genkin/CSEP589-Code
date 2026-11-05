<script setup>
import { ArrowRight, Sparkles } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const model = defineModel({ type: String, default: '' })
const props = defineProps({
  placeholder: { type: String, default: 'What climate shift do you see coming?' },
  submitLabel: { type: String, default: 'Build my thesis' },
  busy: { type: Boolean, default: false },
  size: { type: String, default: 'md' },
  examples: { type: Array, default: () => [] },
  examplesLabel: { type: String, default: 'Try one:' },
  autofocus: { type: Boolean, default: false },
  error: { type: String, default: '' },
  label: { type: String, default: 'Your climate hot take' },
})
const emit = defineEmits(['submit'])

const MAX = 280
const input = ref(null)
const focused = ref(false)
const trimmed = computed(() => model.value.trim())

function autosize() {
  const el = input.value
  if (!el) return
  el.style.height = 'auto'
  // An empty textarea sizes to one line; measure the placeholder so a wrapped hint isn't clipped.
  if (!el.value && props.placeholder) {
    el.value = props.placeholder
    el.style.height = `${el.scrollHeight}px`
    el.value = ''
  } else {
    el.style.height = `${el.scrollHeight}px`
  }
  el.style.overflowY = el.scrollHeight > 180 ? 'auto' : 'hidden'
}

watch(model, () => nextTick(autosize))
onMounted(() => {
  autosize()
  // Web fonts can change line wrapping after the first measurement.
  document.fonts?.ready.then(autosize)
  window.addEventListener('resize', autosize)
  if (props.autofocus) input.value?.focus({ preventScroll: true })
})
onBeforeUnmount(() => window.removeEventListener('resize', autosize))

function submit() {
  if (props.busy) return
  if (!trimmed.value) {
    input.value?.focus()
    return
  }
  emit('submit', trimmed.value)
}

function useExample(text) {
  if (props.busy) return
  model.value = text
  emit('submit', text)
}

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div class="prompt-wrap" :class="`prompt-wrap--${size}`">
    <form
      class="prompt"
      :class="{ 'is-focused': focused, 'is-busy': busy, 'has-error': error }"
      @submit.prevent="submit"
    >
      <span class="prompt__icon" aria-hidden="true"><Sparkles :size="size === 'lg' ? 22 : 18" /></span>
      <textarea
        ref="input"
        v-model="model"
        class="prompt__input"
        rows="1"
        :maxlength="MAX"
        :placeholder="placeholder"
        :aria-label="label"
        :aria-invalid="Boolean(error)"
        enterkeyhint="send"
        @focus="focused = true"
        @blur="focused = false"
        @keydown.enter.exact.prevent="submit"
      />
      <button type="submit" class="btn btn-primary prompt__submit" :class="{ 'btn-lg': size === 'lg' }" :disabled="busy">
        <span v-if="busy" class="spinner" />
        <template v-else>
          {{ submitLabel }}
          <ArrowRight :size="18" />
        </template>
      </button>
    </form>
    <p v-if="error" class="field-error prompt__note" role="alert">{{ error }}</p>
    <p v-else-if="model.length > 220" class="prompt__note prompt__count num">{{ model.length }}/{{ MAX }}</p>

    <div v-if="examples.length" class="prompt-examples">
      <span class="prompt-examples__label">{{ examplesLabel }}</span>
      <button
        v-for="example in examples"
        :key="example"
        type="button"
        class="prompt-example"
        :disabled="busy"
        @click="useExample(example)"
      >
        {{ example }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.prompt {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 8px 8px 8px 12px;
  border: var(--outline);
  border-radius: 24px;
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow);
  transition:
    box-shadow 0.18s var(--ease),
    transform 0.18s var(--ease),
    background-color 0.18s var(--ease);
}
.prompt.is-focused {
  box-shadow: 9px 9px 0 var(--ink-solid);
  transform: translate(-2px, -2px);
}
.prompt.has-error {
  border-color: var(--flare);
  background: var(--peach-50);
}
.prompt__icon {
  display: grid;
  place-items: center;
  align-self: flex-start;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin-top: 2px;
  border: var(--outline-thin);
  border-radius: 50%;
  background: var(--sun);
  color: var(--ink);
}
.prompt__input {
  flex: 1;
  min-width: 0;
  min-height: 44px;
  max-height: 180px;
  padding: 10px 0;
  border: 0;
  outline: none;
  resize: none;
  background: transparent;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--ink);
}
.prompt__input::placeholder {
  color: var(--subtle);
}
.prompt__submit {
  flex-shrink: 0;
}
.prompt__note {
  margin: 12px 0 0;
}
p.field-error.prompt__note {
  display: inline-block;
  padding: 6px 12px;
  border: var(--outline-thin);
  border-radius: 12px;
  background: var(--coral-100);
  color: var(--ink);
  font-weight: 650;
}
.prompt__count {
  font-family: var(--font-mono);
  font-size: 12.5px;
  text-align: right;
  opacity: 0.8;
}

.prompt-wrap--lg .prompt {
  padding: 12px 12px 12px 16px;
  border-radius: 28px;
  box-shadow: 8px 8px 0 var(--ink-solid);
}
.prompt-wrap--lg .prompt.is-focused {
  box-shadow: 12px 12px 0 var(--ink-solid);
}
.prompt-wrap--lg .prompt__icon {
  width: 48px;
  height: 48px;
  margin-top: 4px;
}
.prompt-wrap--lg .prompt__input {
  min-height: 56px;
  padding: 14px 0;
  font-size: 19px;
}
.prompt-wrap--lg .prompt__submit {
  --btn-h: 58px;
  padding: 0 26px;
  border-width: 3px;
  font-family: var(--font-display);
  font-size: 23px;
  font-weight: 400;
  letter-spacing: 0.01em;
  text-transform: uppercase;
}

.prompt-examples {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
}
.prompt-examples__label {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
}
.prompt-example {
  max-width: 100%;
  min-height: 40px;
  padding: 7px 16px;
  border: 2px dashed currentColor;
  border-radius: var(--radius-pill);
  background: transparent;
  color: inherit;
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.35;
  text-align: left;
  transition:
    background-color 0.15s var(--ease),
    border-color 0.15s var(--ease),
    color 0.15s var(--ease),
    box-shadow 0.15s var(--ease),
    transform 0.15s var(--ease);
}
.prompt-example:hover:not(:disabled) {
  border-style: solid;
  border-color: var(--ink-solid);
  background: var(--sun);
  color: var(--ink);
  box-shadow: var(--shadow-sm);
  transform: translate(-2px, -2px);
}
.prompt-example:active:not(:disabled) {
  box-shadow: none;
  transform: translate(1px, 1px);
}
.prompt-example:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .prompt {
    flex-wrap: wrap;
    padding: 8px 8px 8px 10px;
  }
  .prompt__input {
    flex-basis: calc(100% - 56px);
  }
  .prompt__submit {
    width: 100%;
  }
  .prompt-wrap--lg .prompt {
    padding: 10px 10px 10px 12px;
    border-radius: 24px;
  }
  .prompt-wrap--lg .prompt__icon {
    width: 40px;
    height: 40px;
  }
  .prompt-wrap--lg .prompt__input {
    font-size: 17px;
  }
  .prompt-wrap--lg .prompt__submit {
    --btn-h: 54px;
    font-size: 21px;
  }
  .prompt-examples {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding: 4px 0 8px;
    scrollbar-width: none;
  }
  .prompt-examples::-webkit-scrollbar {
    display: none;
  }
  .prompt-example {
    flex-shrink: 0;
    white-space: nowrap;
  }
}
</style>

