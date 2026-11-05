<script setup>
import ClaimStatusBadge from '@/components/thesis/ClaimStatusBadge.vue'
import BrandLogo from '@/components/ui/BrandLogo.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import { Quote, Sparkles } from '@lucide/vue'

const previewLogos = [
  { symbol: 'AIRW', name: 'Airwell', color: '#E85A2A' },
  { symbol: 'THRM', name: 'Thermiq', color: '#354BF4' },
  { symbol: 'HOMR', name: 'HomeRev', color: '#3A2A9E' },
  { symbol: 'COIL', name: 'Coilbridge', color: '#F07AB6' },
  { symbol: 'PANL', name: 'Panelcraft', color: '#F7C54E' },
]
const previewClaims = [
  { text: 'Heat pumps keep taking share from gas furnaces.', status: 'supported' },
  { text: 'Running one costs less than gas for most households.', status: 'mixed' },
]
</script>

<template>
  <div class="auth">
    <div class="auth__main">
      <header class="auth__header">
        <RouterLink to="/" aria-label="Outvest home"><BrandLogo /></RouterLink>
        <slot name="header" />
      </header>
      <div class="auth__body">
        <div class="auth__form fade-up">
          <slot />
        </div>
      </div>
      <p class="auth__legal">
        By continuing you agree to our Terms and Privacy Policy. Outvest offers research tools, not investment advice.
      </p>
    </div>

    <aside class="auth__aside" aria-hidden="true">
      <div class="auth__aside-inner">
        <p class="auth__aside-title">Own the idea you keep talking about.</p>
        <div class="preview">
          <span class="preview__badge"><Sparkles :size="13" /> Copilot draft · Heat pumps</span>
          <p class="preview__title">Heat pumps beat the furnace</p>
          <ul class="preview__claims">
            <li v-for="claim in previewClaims" :key="claim.text">
              <span class="grow">{{ claim.text }}</span>
              <ClaimStatusBadge :status="claim.status" />
            </li>
          </ul>
          <div class="preview__basket">
            <span class="preview__logos">
              <SecurityLogo v-for="logo in previewLogos" :key="logo.symbol" v-bind="logo" :size="30" class="preview__logo" />
            </span>
            <span class="preview__count">8 companies</span>
          </div>
        </div>
        <figure class="auth__quote">
          <Quote :size="20" />
          <blockquote>
            Outvest turned my hunch into a basket of eight companies in about twenty minutes and showed me two risks I hadn’t
            considered.
          </blockquote>
          <figcaption>Maya Okafor, building energy engineer in Seattle</figcaption>
        </figure>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.auth {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
  min-height: 100vh;
}
.auth__main {
  display: flex;
  flex-direction: column;
  padding: 28px 40px;
}
.auth__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.auth__body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}
.auth__form {
  width: 100%;
  max-width: 420px;
}
.auth__legal {
  max-width: 420px;
  margin: 0 auto;
  font-size: 12.5px;
  color: var(--subtle);
  text-align: center;
}
.auth__aside {
  position: relative;
  overflow: hidden;
  margin: 14px 14px 14px 0;
  border: var(--outline);
  border-radius: 32px;
  background: var(--signal);
  color: var(--cream);
}
.auth__aside-inner {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 32px;
  height: 100%;
  max-width: 460px;
  margin: 0 auto;
  padding: 48px 40px;
}
.auth__aside-title {
  font-family: var(--font-display);
  font-size: 52px;
  font-weight: 400;
  line-height: 0.95;
  text-transform: uppercase;
  text-shadow: 4px 4px 0 var(--ink-solid);
}
.preview {
  padding: 20px;
  border: var(--outline);
  border-radius: 24px;
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-lg);
  transform: rotate(-1.5deg);
}
.preview__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1.5px solid var(--ink-solid);
  border-radius: var(--radius-pill);
  background: var(--sun);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.preview__title {
  margin-top: 12px;
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 400;
  line-height: 1;
  text-transform: uppercase;
}
.preview__claims {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}
.preview__claims li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: var(--outline-thin);
  border-radius: 14px;
  background: var(--surface-muted);
  font-size: 13px;
  font-weight: 650;
  line-height: 1.35;
}
.preview__basket {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
}
.preview__logos {
  display: inline-flex;
}
.preview__logo {
  margin-left: -6px;
}
.preview__logo:first-child {
  margin-left: 0;
}
.preview__count {
  font-family: var(--font-mono);
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}
.auth__quote {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--cream);
}
.auth__quote blockquote {
  font-size: 18px;
  line-height: 1.5;
}
.auth__quote figcaption {
  font-size: 14px;
  color: #dfe2ff;
}

@media (max-width: 960px) {
  .auth {
    grid-template-columns: minmax(0, 1fr);
  }
  .auth__aside {
    display: none;
  }
}
@media (max-width: 640px) {
  .auth__main {
    padding: 20px;
  }
  .auth__body {
    align-items: flex-start;
    padding-top: 32px;
  }
}
</style>
