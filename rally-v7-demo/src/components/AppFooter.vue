<template>
  <footer class="app-footer">
    <RouterLink to="/" class="display logo">Rally</RouterLink>
    <p class="note">Demo with sample data. Not investment advice.</p>
    <p class="tagline">Know what you own.</p>
  </footer>
</template>

<style scoped>
.app-footer { display: flex; align-items: center; gap: 48px; border-top: 1px solid var(--line); padding: 28px 0 0; margin-top: 8px; }
.logo { font-size: 24px; color: var(--cream); }
.note { flex: 1; font-size: 14px; color: var(--mute); }
.tagline { font-weight: 500; font-size: 15px; color: var(--white); }
</style>
