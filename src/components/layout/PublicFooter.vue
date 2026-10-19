<script setup>
import BrandLogo from '@/components/ui/BrandLogo.vue';
</script>

<template>
  <footer class="site-footer">
    <div class="container">
      <div class="site-footer__top">
        <div class="site-footer__brand">
          <BrandLogo :size="28" />
          <p class="site-footer__tagline">Invest in what you believe in. Clear, calm research for first-time investors.</p>
        </div>
        <nav class="site-footer__cols" aria-label="Footer">
          <div>
            <p class="site-footer__heading">Product</p>
            <RouterLink :to="{ path: '/', hash: '#how-it-works' }">How it works</RouterLink>
            <RouterLink :to="{ path: '/', hash: '#values' }">The 6 values</RouterLink>
            <RouterLink :to="{ path: '/', hash: '#etfs' }">ETFs, unpacked</RouterLink>
            <RouterLink to="/pricing">Pricing</RouterLink>
          </div>
          <div>
            <p class="site-footer__heading">Get started</p>
            <RouterLink to="/signup">Create an account</RouterLink>
            <RouterLink to="/login">Log in</RouterLink>
            <RouterLink to="/s/demo">See an example</RouterLink>
          </div>
        </nav>
      </div>
      <div class="site-footer__bottom">
        <p>© {{ new Date().getFullYear() }} outvest. All company data shown is illustrative.</p>
        <p>outvest provides values research, not financial advice. Investing involves risk, including loss of principal.</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: 40px;
  padding: 56px 0 40px;
  border-top: 1px solid var(--line);
  background: var(--surface-muted);
}
.site-footer__top {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  flex-wrap: wrap;
}
.site-footer__brand {
  max-width: 320px;
}
.site-footer__tagline {
  margin-top: 14px;
  color: var(--muted);
  font-size: 14.5px;
}
.site-footer__cols {
  display: flex;
  gap: 64px;
}
.site-footer__cols div {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.site-footer__cols a {
  font-size: 14.5px;
  color: var(--ink-2);
  transition: color 0.2s;
}
.site-footer__cols a:hover {
  color: var(--brand-600);
}
.site-footer__heading {
  margin-bottom: 4px;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--subtle);
}
.site-footer__bottom {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid var(--line);
  font-size: 13px;
  color: var(--subtle);
}
@media (max-width: 640px) {
  .site-footer__cols {
    gap: 40px;
  }
}
</style>
