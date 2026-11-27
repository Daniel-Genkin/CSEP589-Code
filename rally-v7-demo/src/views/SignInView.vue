<script setup>
import { ref } from 'vue'
import FlowShell from '../components/FlowShell.vue'
import Field from '../components/Field.vue'

const email = ref('alex@example.com')
</script>

<template>
  <FlowShell label="Sign in" back="/" title="Welcome back." body="Enter your email and we’ll send you a code. No password needed.">
    <div class="section-head"><h3>Sign in</h3></div>
    <div class="card-pad"><Field v-model="email" label="Email" type="email" autofocus /></div>
    <RouterLink to="/signin/code" class="btn btn-primary btn-block">Send Code</RouterLink>
    <p class="caption">New here? You don’t need an account to check a fund.</p>
    <RouterLink to="/check" class="btn-link" style="align-self: flex-start">Check a Fund</RouterLink>
  </FlowShell>
</template>
