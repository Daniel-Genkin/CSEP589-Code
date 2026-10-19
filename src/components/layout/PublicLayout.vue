<script setup>
import PublicFooter from './PublicFooter.vue';
import PublicHeader from './PublicHeader.vue';
</script>

<template>
  <div class="public-layout">
    <PublicHeader />
    <main>
      <RouterView v-slot="{ Component, route }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>
    <PublicFooter />
  </div>
</template>
