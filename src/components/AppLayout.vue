<template>
  <div class="app-layout" :class="{ dark: appStore.theme === 'dark' }">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="logo">开发者工具集</h1>
        <button
          class="theme-toggle"
          @click="appStore.toggleTheme"
          :title="appStore.theme === 'light' ? '切换到深色模式' : '切换到浅色模式'"
        >
          {{ appStore.theme === 'light' ? '🌙' : '☀️' }}
        </button>
      </div>

      <nav class="navigation">
        <div v-for="category in appStore.toolCategories" :key="category.title" class="nav-category">
          <h3 class="category-title">{{ category.title }}</h3>
          <ul class="tool-list">
            <li v-for="tool in category.tools" :key="tool.name">
              <RouterLink
                :to="tool.path"
                class="tool-link"
                @click="appStore.setCurrentTool(getToolKey(tool.path))"
              >
                {{ tool.name }}
              </RouterLink>
            </li>
          </ul>
        </div>
      </nav>
    </aside>

    <!-- 主内容区域 -->
    <main class="main-content">
      <div class="content-wrapper">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

// 从路径获取工具键名
const getToolKey = (path: string): string => {
  return path.substring(1) // 移除前导斜杠
}
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  background-color: var(--color-background);
  color: var(--color-text);
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

.sidebar {
  width: 280px;
  background-color: var(--color-background-soft);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0;
}

.theme-toggle {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.theme-toggle:hover {
  background-color: var(--color-background-mute);
}

.navigation {
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
}

.nav-category {
  margin-bottom: 1.5rem;
}

.category-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-light);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 1.5rem;
  margin: 0 0 0.5rem 0;
}

.tool-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tool-link {
  display: block;
  padding: 0.75rem 1.5rem;
  color: var(--color-text);
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.tool-link:hover {
  background-color: var(--color-background-mute);
  color: var(--color-text-active);
}

.tool-link.router-link-active {
  background-color: var(--color-background-mute);
  color: var(--color-text-active);
  border-left-color: var(--vt-c-green);
  font-weight: 500;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-wrapper {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

/* 深色模式 */
.dark {
  --color-background: #1a1a1a;
  --color-background-soft: #242424;
  --color-background-mute: #2c2c2c;
  --color-border: #383838;
  --color-text: #e0e0e0;
  --color-text-light: #999999;
  --color-text-active: #ffffff;
  --color-heading: #ffffff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .main-content {
    margin-left: 0;
  }

  .content-wrapper {
    padding: 1rem;
  }
}
</style>
