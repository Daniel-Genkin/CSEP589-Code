<script setup lang="ts">
// A screen that exists in the shell but is built in a later PR. It keeps the final chrome
// (eyebrow, headline, lead) so navigation, gating and transitions can be reviewed now.
defineProps<{
  eyebrow: string
  title: string
  lead: string
  /** The PRD requirement that builds this screen */
  requirement: string
}>()
</script>

<template>
  <div class="page">
    <header class="page-head">
      <p class="eyebrow">{{ eyebrow }}</p>
      <h1 class="page-title">{{ title }}</h1>
      <p class="lead">{{ lead }}</p>
    </header>
    <section class="stub">
      <p class="label-mono">Not built yet</p>
      <p class="stub__text">This screen arrives with {{ requirement }} in a later pull request.</p>
    </section>
  </div>
</template>

<style scoped>
.stub {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 240px;
  padding: 24px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  text-align: center;
}
.stub__text {
  font-size: 18px;
  font-weight: 600;
}
</style>
