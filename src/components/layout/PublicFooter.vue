<script setup>
import SiteFooter from '@/components/rally/SiteFooter.vue'
</script>

<template>
  <div class="public-foot">
    <SiteFooter note="Real fund names, sample holdings and made-up company names. Demo only. Rally shares information, not investment advice.">
      <RouterLink to="/login" class="public-foot__link">Log in</RouterLink>
    </SiteFooter>
  </div>
</template>

<style scoped>
.public-foot {
  width: 100%;
  max-width: calc(var(--container) + 48px);
  margin-inline: auto;
  padding: 0 24px 56px;
}
.public-foot__link {
  margin-left: 8px;
  color: var(--text);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
