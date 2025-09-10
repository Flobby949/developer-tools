<template>
  <div class="tool-panel">
    <header v-if="showHeader" class="panel-header">
      <div class="header-content">
        <h1 class="panel-title">{{ title }}</h1>
        <p v-if="description" class="panel-description">{{ description }}</p>
      </div>
      <div class="header-decoration">
        <div class="decoration-circle"></div>
        <div class="decoration-circle"></div>
        <div class="decoration-circle"></div>
      </div>
    </header>

    <div class="panel-content" :class="{ 'no-header': !showHeader }">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description?: string
  showHeader?: boolean
}

withDefaults(defineProps<Props>(), {
  showHeader: true,
})
</script>

<style scoped>
.tool-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  animation: fadeInUp 0.6s ease;
}

.panel-header {
  margin-bottom: var(--spacing-xl);
  position: relative;
  background: linear-gradient(
    135deg,
    var(--color-background-soft) 0%,
    var(--color-background-mute) 100%
  );
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow);
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.panel-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--color-primary-light) 0%, transparent 50%);
  opacity: 0.5;
}

.header-content {
  position: relative;
  z-index: 1;
  flex: 1;
}

.panel-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0 0 var(--spacing-sm) 0;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.panel-description {
  color: var(--color-text-light);
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.6;
  font-weight: 400;
}

.header-decoration {
  position: relative;
  z-index: 1;
  display: flex;
  gap: var(--spacing-xs);
  opacity: 0.6;
}

.decoration-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--gradient-primary);
  animation: pulse 2s ease-in-out infinite;
}

.decoration-circle:nth-child(2) {
  animation-delay: 0.3s;
}

.decoration-circle:nth-child(3) {
  animation-delay: 0.6s;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  position: relative;
}

.panel-content.no-header {
  gap: 0;
}

.panel-content::before {
  content: '';
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 4px;
  background: var(--gradient-primary);
  border-radius: 2px;
  opacity: 0.3;
}

.panel-content.no-header::before {
  display: none;
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .panel-header {
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
    flex-direction: column;
    text-align: center;
  }

  .panel-title {
    font-size: 2rem;
  }

  .panel-description {
    font-size: 1rem;
  }

  .header-decoration {
    margin-top: var(--spacing);
    justify-content: center;
  }
}
</style>
