<script setup>
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import UiModal from '@/components/ui/UiModal.vue'
import { Plus, Sparkles } from '@lucide/vue'
import CompanyPicker from './CompanyPicker.vue'

defineProps({
  open: { type: Boolean, default: false },
  thesis: { type: Object, required: true },
  busySymbol: { type: String, default: null },
})
const emit = defineEmits(['close', 'add'])
</script>

<template>
  <UiModal :open="open" size="lg" label="Add a company" @close="emit('close')">
    <h2 class="h-3">Add a company</h2>
    <p class="muted modal-sub">Baskets hold 2 to 12 companies. Weights update automatically.</p>

    <section v-if="thesis.suggestions.length" class="block">
      <p class="block__title"><Sparkles :size="15" /> Suggested by the copilot</p>
      <ul class="suggestions">
        <li v-for="company in thesis.suggestions" :key="company.symbol" class="suggestion">
          <SecurityLogo :symbol="company.symbol" :name="company.name" :color="company.color" :size="38" />
          <div class="suggestion__text">
            <p class="suggestion__name">{{ company.name }} <span class="suggestion__ticker">{{ company.symbol }}</span></p>
            <p class="suggestion__why">{{ company.why }}</p>
          </div>
          <span class="suggestion__exposure">{{ company.exposure }}%</span>
          <button
            type="button"
            class="btn btn-soft btn-sm"
            :disabled="Boolean(busySymbol) || thesis.basket.length >= 12"
            @click="emit('add', company.symbol)"
          >
            <span v-if="busySymbol === company.symbol" class="spinner" />
            <Plus v-else :size="15" />
            Add
          </button>
        </li>
      </ul>
    </section>

    <section class="block">
      <p class="block__title">Search every company</p>
      <CompanyPicker
        :topic="thesis.topic.key"
        :exclude="thesis.basket.map((b) => b.symbol)"
        :busy-symbol="busySymbol"
        @select="emit('add', $event.symbol)"
      />
    </section>
  </UiModal>
</template>

<style scoped>
.modal-sub {
  margin-top: 4px;
  font-size: 14.5px;
}
.block {
  margin-top: 22px;
}
.block__title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}
.suggestions {
  display: flex;
  flex-direction: column;
}
.suggestion {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--line);
}
.suggestion:first-child {
  border-top: 0;
}
.suggestion__text {
  flex: 1;
  min-width: 0;
}
.suggestion__name {
  font-weight: 700;
  font-size: 14.5px;
}
.suggestion__ticker {
  font-size: 12px;
  color: var(--subtle);
}
.suggestion__why {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.4;
}
.suggestion__exposure {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--brand-700);
}
@media (max-width: 640px) {
  .suggestion {
    flex-wrap: wrap;
  }
  .suggestion__text {
    flex-basis: calc(100% - 50px);
  }
  .suggestion__exposure {
    margin-left: 50px;
  }
  .suggestion .btn {
    margin-left: auto;
  }
}
</style>
