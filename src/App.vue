<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import AppLayout from './components/AppLayout.vue'

const route = useRoute()
const isHomePage = computed(() => route.path === '/')
</script>

<template>
  <!-- 首页使用特殊布局 -->
  <div v-if="isHomePage" class="home-layout">
    <RouterView />
  </div>

  <!-- 其他页面使用传统布局 -->
  <AppLayout v-else>
    <RouterView />
  </AppLayout>
</template>

<style>
#app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.home-layout {
  height: 100vh;
  width: 100vw;
  overflow-x: hidden;
  overflow-y: auto;
}
</style>
