<script setup>
import BrandLogo from '@/components/ui/BrandLogo.vue'
import { BRAND_NAME, BRAND_TAGLINE } from '@/config/brand'
</script>

<template>
  <footer class="site-footer ground-ink">
    <div class="container site-footer__inner">
      <div class="site-footer__brand">
        <BrandLogo :size="30" inverse />
        <p class="site-footer__tagline">{{ BRAND_TAGLINE }}</p>
      </div>
      <nav class="site-footer__links" aria-label="Footer">
        <RouterLink to="/check">Check my holdings</RouterLink>
        <RouterLink to="/browse">Browse companies</RouterLink>
        <RouterLink to="/s/demo">See an example</RouterLink>
        <RouterLink to="/login">Log in</RouterLink>
      </nav>
    </div>
    <div class="container site-footer__bottom">
      <p>Real fund names, sample holdings and made-up company names. Demo only.</p>
      <p>{{ BRAND_NAME }} shares information, not investment advice.</p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  padding: 48px 0 32px;
  border-top: 4px solid var(--sun);
}
.site-footer__inner {
  display: flex;
  justify-content: space-between;
  gap: 32px;
  flex-wrap: wrap;
}
.site-footer__tagline {
  margin-top: 12px;
  font-size: 15px;
}
.site-footer__links {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
  align-items: center;
  font-weight: 600;
}
.site-footer__links a:hover {
  color: var(--sun);
}
.site-footer__bottom {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #3a3842;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.04em;
  color: #b9b4c0;
}
</style>
