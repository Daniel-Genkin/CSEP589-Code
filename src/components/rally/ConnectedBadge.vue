<script setup lang="ts">
// "Connected: Alpaca". Shown wherever the active portfolio came from a brokerage (PRD F6).
import { brokerById } from '@/config/brokers'
import type { Portfolio } from '@/types'
import { computed } from 'vue'

const props = defineProps<{ portfolio: Portfolio | null }>()
const broker = computed(() => (props.portfolio?.origin === 'connected' ? brokerById(props.portfolio.brokerId) : null))
</script>

<template>
  <p v-if="broker" class="tag tag-pass connected"><span class="dot" style="--dot: var(--pass)" />Connected: {{ broker.name }}</p>
</template>
