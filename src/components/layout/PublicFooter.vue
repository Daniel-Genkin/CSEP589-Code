<script setup>
import AppStoreButtons from '@/components/ui/AppStoreButtons.vue'
import BrandLogo from '@/components/ui/BrandLogo.vue'
</script>

<template>
  <footer class="site-footer ground-ink">
    <div class="container">
      <div class="site-footer__top">
        <div class="site-footer__brand">
          <BrandLogo :size="30" inverse />
          <p class="site-footer__tagline">
            Turn your climate hot take into a real portfolio. Pitch it, test it with AI and the community, then invest from
            $10.
          </p>
          <AppStoreButtons inverse class="site-footer__stores" />
        </div>
        <nav class="site-footer__cols" aria-label="Footer">
          <div>
            <p class="site-footer__heading">Product</p>
            <RouterLink :to="{ path: '/', hash: '#how-it-works' }">How it works</RouterLink>
            <RouterLink :to="{ path: '/', hash: '#workshop' }">AI workshop</RouterLink>
            <RouterLink :to="{ path: '/', hash: '#community' }">Community</RouterLink>
            <RouterLink :to="{ path: '/', hash: '#invest' }">Invest</RouterLink>
            <RouterLink to="/pricing">Pricing</RouterLink>
          </div>
          <div>
            <p class="site-footer__heading">Get started</p>
            <RouterLink to="/signup">Create an account</RouterLink>
            <RouterLink to="/login">Log in</RouterLink>
            <RouterLink to="/t/th_heatpumps">See an example thesis</RouterLink>
            <RouterLink :to="{ path: '/', hash: '#get-the-app' }">Get the app</RouterLink>
          </div>
        </nav>
      </div>
      <div class="site-footer__bottom">
        <p>© {{ new Date().getFullYear() }} Outvest. Companies, tickers and performance shown are illustrative demo data.</p>
        <p>
          Outvest offers research tools, not investment advice. Investing is provided through Outvest’s registered
          brokerage partner and involves risk, including loss of principal. Past performance doesn’t guarantee future
          results.
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  padding: 48px 0 32px;
  border-top: 4px solid var(--sun);
}
.site-footer__top {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  flex-wrap: wrap;
}
.site-footer__brand {
  max-width: 380px;
}
.site-footer__tagline {
  margin-top: 14px;
  font-size: 15px;
}
.site-footer__stores {
  margin-top: 22px;
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
  font-size: 15px;
  font-weight: 600;
  transition: color 0.2s;
}
.site-footer__cols a:hover {
  color: var(--sun);
}
.site-footer__heading {
  margin-bottom: 4px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--sun);
}
.site-footer__bottom {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 36px;
  padding-top: 20px;
  border-top: 1px solid #3a3842;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.04em;
  line-height: 1.6;
  color: #b9b4c0;
}
@media (max-width: 640px) {
  .site-footer__cols {
    gap: 40px;
  }
}
</style>
