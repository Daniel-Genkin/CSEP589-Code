<script setup>
import BrandLogo from '@/components/ui/BrandLogo.vue'
import CategoryIcon from '@/components/ui/CategoryIcon.vue'
import ScoreBar from '@/components/ui/ScoreBar.vue'
import ScoreRing from '@/components/ui/ScoreRing.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import { Quote } from '@lucide/vue'

const previewValues = [
  { key: 'climate', label: 'Planet & Climate', score: 84 },
  { key: 'labor', label: 'Workers & Fair Pay', score: 76 },
  { key: 'animals', label: 'Animal Welfare', score: 97 },
]
</script>

<template>
  <div class="auth">
    <div class="auth__main">
      <header class="auth__header">
        <RouterLink to="/" aria-label="outvest home"><BrandLogo /></RouterLink>
        <slot name="header" />
      </header>
      <div class="auth__body">
        <div class="auth__form fade-up">
          <slot />
        </div>
      </div>
      <p class="auth__legal">
        By continuing you agree to our Terms and Privacy Policy. outvest shares research, not financial advice.
      </p>
    </div>

    <aside class="auth__aside" aria-hidden="true">
      <div class="auth__aside-inner">
        <p class="auth__aside-title">Know what you own. Own what you believe in.</p>
        <div class="preview">
          <div class="preview__head">
            <SecurityLogo symbol="GRNB" name="Greenbloom" color="#54AE6C" :size="44" />
            <div class="grow">
              <p class="preview__name">Greenbloom Foods</p>
              <p class="preview__meta">GRNB · Plant-based food</p>
            </div>
            <ScoreRing :score="84" :size="58" />
          </div>
          <ul class="preview__values">
            <li v-for="v in previewValues" :key="v.key">
              <CategoryIcon :category="v.key" :size="30" />
              <span class="grow">
                <span class="preview__label">{{ v.label }}</span>
                <ScoreBar :score="v.score" :height="6" />
              </span>
              <span class="preview__score num">{{ v.score }}</span>
            </li>
          </ul>
        </div>
        <figure class="auth__quote">
          <Quote :size="20" />
          <blockquote>I finally feel like I understand my investments, and that they match who I am.</blockquote>
          <figcaption>Jade, 23 · started investing this year</figcaption>
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
  border-radius: 32px;
  background:
    radial-gradient(circle at 20% 15%, rgba(128, 197, 157, 0.55), transparent 50%),
    radial-gradient(circle at 85% 85%, rgba(123, 104, 238, 0.4), transparent 50%),
    linear-gradient(160deg, var(--brand-700), var(--brand-900));
  color: #fff;
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
  font-variation-settings: 'SOFT' 100;
  font-size: 38px;
  font-weight: 540;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.preview {
  padding: 20px;
  border-radius: 24px;
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 30px 60px -30px rgba(0, 0, 0, 0.5);
  transform: rotate(-1.5deg);
}
.preview__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}
.preview__name {
  font-weight: 750;
}
.preview__meta {
  font-size: 13px;
  color: var(--muted);
}
.preview__values {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}
.preview__values li {
  display: flex;
  align-items: center;
  gap: 12px;
}
.preview__values .grow {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.preview__label {
  font-size: 13px;
  font-weight: 650;
}
.preview__score {
  font-weight: 760;
}
.auth__quote {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: rgba(255, 255, 255, 0.9);
}
.auth__quote blockquote {
  font-size: 18px;
  line-height: 1.5;
}
.auth__quote figcaption {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.65);
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
