<script setup lang="ts">
import FlowShell from '@/components/v7/FlowShell.vue'
import { useDemoStore } from '@/state/demo'

const demo = useDemoStore()
</script>

<template>
  <FlowShell label=" " back="/" title="Nothing here." body="The link may be old. Everything in Rally is one click from here.">
    <RouterLink :to="demo.portfolio ? '/home' : '/'" class="btn btn-primary btn-block">{{ demo.portfolio ? 'Back to Home' : 'Back to Rally' }}</RouterLink>
    <RouterLink to="/check" class="btn btn-secondary btn-block">Check a Fund</RouterLink>
  </FlowShell>
</template>
