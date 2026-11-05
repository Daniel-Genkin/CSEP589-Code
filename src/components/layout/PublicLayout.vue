<script setup>
import { useRoute } from 'vue-router'
import PublicFooter from './PublicFooter.vue'
import PublicHeader from './PublicHeader.vue'

const route = useRoute()
</script>

<template>
  <div class="public-layout">
    <PublicHeader />
    <!-- Marketing and detail pages sit on the blue ground; utility pages like pricing stay on cream. -->
    <main class="public-layout__main" :class="{ 'ground-blue': route.meta.ground === 'blue' }">
      <RouterView v-slot="{ Component, route: viewRoute }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="viewRoute.path" />
        </Transition>
      </RouterView>
    </main>
    <PublicFooter />
  </div>
</template>

<style scoped>
.public-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.public-layout__main {
  flex: 1;
}
</style>
