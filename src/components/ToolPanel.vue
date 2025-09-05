<template>
  <div class="tool-panel">
    <header class="panel-header">
      <h1 class="panel-title">{{ title }}</h1>
      <p v-if="description" class="panel-description">{{ description }}</p>
    </header>

    <div class="panel-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description?: string
}

defineProps<Props>()
</script>

<style scoped>
.tool-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  margin-bottom: 2rem;
}

.panel-title {
  font-size: 2rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 0.5rem 0;
}

.panel-description {
  color: var(--color-text-light);
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
