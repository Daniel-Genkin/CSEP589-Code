<script setup>
import FlowShell from '../components/FlowShell.vue'
import Row from '../components/Row.vue'
</script>

<template>
  <FlowShell label="Alerts" logo-to="/home" title="Alerts are on." body="We’ll email you when something new is on file for Human rights & conflict. Here’s what one looks like.">
    <div class="section-head"><h3>Example email</h3></div>
    <div class="card-pad email">
      <p class="from"><span class="display">Rally</span> Rally Updates · Today, 9:41 AM</p>
      <p class="subj">New on file: Palantir</p>
      <p class="dim txt">A new federal contract for Palantir Technologies was posted on USAspending.gov on Nov 18. It’s on your Human rights &amp; conflict line.</p>
      <div class="list rec"><Row tk="PLTR" title="Palantir Technologies" sub="0.6% of your VOO" right="USAspending.gov ↗" right-tone="link" /></div>
      <RouterLink to="/explore" class="btn btn-primary btn-block">See the Record</RouterLink>
      <p class="caption small">You’re getting this because alerts are on for Human rights &amp; conflict. You can turn them off in Settings.</p>
    </div>
    <button class="btn btn-secondary btn-block" @click="$router.back()">Done</button>
    <RouterLink to="/account" class="btn-link" style="align-self: flex-start">Alert Settings</RouterLink>
  </FlowShell>
</template>

<style scoped>
.email { gap: 14px; }
.from { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--mute); }
.from .display { font-size: 20px; color: var(--cream); }
.subj { font-weight: 600; font-size: 22px; color: var(--cream); }
.txt { font-size: 15px; line-height: 1.45; }
.rec { background: var(--ink); }
.small { font-size: 12px; }
</style>
