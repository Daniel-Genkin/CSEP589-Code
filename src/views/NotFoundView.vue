<script setup lang="ts"></script>

<template>
  <div class="page">
    <header class="page-head">
      <p class="eyebrow">Your Rally · 404</p>
      <h1 class="page-title">Nothing<br />at this address.</h1>
      <p class="lead">The link may be old. Everything in the demo is one click from here.</p>
      <div class="actions">
        <RouterLink to="/" class="btn btn-primary">Back to Home</RouterLink>
        <RouterLink to="/portfolio" class="btn btn-outline">Open Portfolio</RouterLink>
      </div>
    </header>
  </div>
</template>

<style scoped>
.actions {
  display: flex;
  gap: 12px;
  padding-top: 6px;
}
</style>
