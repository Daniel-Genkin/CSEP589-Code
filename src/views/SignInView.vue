<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import FlowShell from '@/components/v7/FlowShell.vue'
import Field from '@/components/v7/Field.vue'
import { useCheckStore } from '@/state/check'
import { useDemoStore } from '@/state/demo'

const router = useRouter()
const demo = useDemoStore()
const check = useCheckStore()
if (!check.signInEmail && demo.account) check.signInEmail = demo.account.email
const valid = computed(() => /.+@.+\..+/.test(check.signInEmail.trim()))
function send() {
  if (valid.value) router.push('/signin/code')
}
</script>

<template>
  <FlowShell label="Sign in" back="/" logo-to="/" title="Welcome back." body="Enter your email and we’ll send you a code. No password needed.">
    <div class="section-head"><h3>Sign in</h3></div>
    <form class="card-pad" @submit.prevent="send"><Field v-model="check.signInEmail" label="Email" type="email" placeholder="you@example.com" autofocus /></form>
    <button class="btn btn-primary btn-block" :class="{ off: !valid }" @click="send">Send Code</button>
    <p class="caption">New here? You don’t need an account to check a fund. This demo keeps your email on this device only.</p>
    <RouterLink to="/check" class="btn-link" style="align-self: flex-start">Check a Fund</RouterLink>
  </FlowShell>
</template>

<style scoped>
.off { opacity: 0.45; pointer-events: none; }
</style>
