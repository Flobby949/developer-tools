<template>
  <div class="app-layout">
    <!-- 移动端菜单按钮 -->
    <button v-if="isMobile" @click="toggleMobileSidebar" class="mobile-menu-btn">☰</button>

    <!-- 遮罩层 -->
    <div
      v-if="isMobile"
      @click="closeMobileSidebar"
      class="overlay"
      :class="{ show: showMobileSidebar }"
    ></div>

    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ open: showMobileSidebar }">
      <div class="sidebar-header">
        <h1 class="logo">开发者工具集</h1>
        <button
          class="theme-toggle"
          @click="appStore.toggleTheme"
          :title="appStore.getThemeDisplayName()"
        >
          {{ appStore.getThemeIcon() }}
        </button>
      </div>

      <nav class="navigation">
        <!-- 首页链接 -->
        <div class="nav-category">
          <RouterLink to="/" class="home-link" @click="handleLinkClick('/')">
            <span class="home-icon">🏠</span>
            <span class="home-text">首页</span>
            <span class="link-arrow">→</span>
          </RouterLink>
        </div>

        <div
          v-for="(category, index) in appStore.toolCategories"
          :key="category.title"
          class="nav-category"
          :style="{ animationDelay: `${(index + 1) * 0.1}s` }"
        >
          <h3 class="category-title">{{ category.title }}</h3>
          <ul class="tool-list">
            <li v-for="tool in category.tools" :key="tool.name">
              <RouterLink :to="tool.path" class="tool-link" @click="handleLinkClick(tool.path)">
                <span class="link-text">{{ tool.name }}</span>
                <span class="link-arrow">→</span>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const isMobile = ref(false)
const showMobileSidebar = ref(false)

// 检测是否移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 切换移动端侧边栏
const toggleMobileSidebar = () => {
  showMobileSidebar.value = !showMobileSidebar.value
}

// 关闭移动端侧边栏
const closeMobileSidebar = () => {
  showMobileSidebar.value = false
}

// 处理链接点击
const handleLinkClick = (path: string) => {
  const toolKey = path.substring(1)
  appStore.setCurrentTool(toolKey)
  if (isMobile.value) {
    closeMobileSidebar()
  }
}

// 监听窗口大小变化
const handleResize = () => {
  checkMobile()
  if (!isMobile.value) {
    showMobileSidebar.value = false
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  background-color: var(--color-background);
  color: var(--color-text);
  transition: all 0.3s ease;
}

.sidebar {
  width: 280px;
  background: linear-gradient(
    180deg,
    var(--color-background-soft) 0%,
    var(--color-background-mute) 100%
  );
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  position: relative;
  z-index: 10;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(180deg, transparent 0%, var(--color-border) 50%, transparent 100%);
}

.sidebar-header {
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--gradient-primary);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.sidebar-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  position: relative;
  z-index: 1;
  background: linear-gradient(45deg, #ffffff 30%, rgba(255, 255, 255, 0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.theme-toggle {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--radius);
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.navigation {
  flex: 1;
  padding: var(--spacing-md) 0;
  overflow-y: auto;
  position: relative;
}

.nav-category {
  margin-bottom: var(--spacing-lg);
  position: relative;
  animation: slideInRight 0.3s ease forwards;
  opacity: 0;
}

.category-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-lighter);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0 var(--spacing-lg);
  margin: 0 0 var(--spacing-sm) 0;
  position: relative;
}

.category-title::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: var(--spacing-lg);
  width: 20px;
  height: 2px;
  background: var(--gradient-primary);
  border-radius: 1px;
}

.tool-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tool-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing) var(--spacing-lg);
  color: var(--color-text);
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 3px solid transparent;
  position: relative;
  font-weight: 500;
  font-size: 0.9rem;
}

.tool-link::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 100%;
  background: var(--gradient-primary);
  transition: width 0.3s ease;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.link-arrow {
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
  color: var(--color-primary);
  font-weight: bold;
}

.tool-link:hover {
  background: linear-gradient(90deg, var(--color-primary-light) 0%, transparent 50%);
  color: var(--color-text-active);
  transform: translateX(4px);
}

.tool-link:hover::before {
  width: 4px;
}

.tool-link:hover .link-arrow {
  opacity: 1;
  transform: translateX(0);
}

.tool-link.router-link-active {
  background: linear-gradient(90deg, var(--color-primary-light) 0%, transparent 80%);
  color: var(--color-primary);
  border-left-color: var(--color-primary);
  font-weight: 600;
  transform: translateX(2px);
}

.tool-link.router-link-active::before {
  width: 4px;
}

.tool-link.router-link-active .link-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* 首页链接样式 */
.home-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg) var(--spacing-lg);
  color: var(--color-text);
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 3px solid transparent;
  position: relative;
  font-weight: 600;
  font-size: 1rem;
  background: linear-gradient(90deg, var(--color-primary-light) 0%, transparent 50%);
  border-radius: 0 var(--radius) var(--radius) 0;
  margin: 0 var(--spacing) var(--spacing-lg) 0;
}

.home-link::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 100%;
  background: var(--gradient-primary);
  transition: width 0.3s ease;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.home-link:hover {
  background: linear-gradient(90deg, var(--color-primary-light) 0%, transparent 80%);
  color: var(--color-text-active);
  transform: translateX(4px);
}

.home-link:hover::before {
  width: 4px;
}

.home-link:hover .link-arrow {
  opacity: 1;
  transform: translateX(0);
}

.home-link.router-link-active {
  background: linear-gradient(90deg, var(--color-primary-light) 0%, transparent 80%);
  color: var(--color-primary);
  border-left-color: var(--color-primary);
  transform: translateX(2px);
}

.home-link.router-link-active::before {
  width: 4px;
}

.home-link.router-link-active .link-arrow {
  opacity: 1;
  transform: translateX(0);
}

.home-icon {
  font-size: 1.2rem;
  margin-right: 0.75rem;
}

.home-text {
  flex: 1;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-background);
  position: relative;
}

.main-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--color-border) 50%, transparent 100%);
}

.content-wrapper {
  flex: 1;
  padding: var(--spacing-xl);
  overflow-y: auto;
  background: var(--color-background);
  position: relative;
}

.content-wrapper::before {
  content: '';
  position: fixed;
  top: 0;
  right: 0;
  width: 50%;
  height: 50%;
  background: radial-gradient(circle at 100% 0%, var(--color-primary-light) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}

/* 深色模式特定样式 */
.dark {
  --color-background: #0a0a0a;
  --color-background-soft: #1a1a1a;
  --color-background-mute: #262626;
  --color-background-dim: #404040;
  --color-border: #333333;
  --color-text: #e5e5e5;
  --color-text-light: #a3a3a3;
  --color-text-lighter: #737373;
  --color-text-active: #ffffff;
  --color-heading: #ffffff;
}

.dark .sidebar {
  background: linear-gradient(
    180deg,
    var(--color-background-soft) 0%,
    var(--color-background-mute) 100%
  );
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.3),
    0 4px 6px -2px rgba(0, 0, 0, 0.1);
}

.dark .content-wrapper::before {
  background: radial-gradient(circle at 100% 0%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
}

/* 移动端样式 */
.mobile-menu-btn {
  position: fixed;
  top: var(--spacing);
  left: var(--spacing);
  z-index: 1001;
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: var(--spacing-sm);
  border-radius: var(--radius);
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  transition: all 0.2s ease;
  font-size: 1.2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-menu-btn:hover {
  transform: scale(1.1);
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
}

.overlay.show {
  opacity: 1;
  visibility: visible;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .content-wrapper {
    padding: var(--spacing-lg);
  }
}

@media (max-width: 768px) {
  .app-layout {
    position: relative;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: none;
  }

  .sidebar.open {
    transform: translateX(0);
    box-shadow: var(--shadow-xl);
  }

  .main-content {
    width: 100%;
  }

  .content-wrapper {
    padding: var(--spacing-lg) var(--spacing);
    padding-top: calc(var(--spacing-xl) + 48px); /* 为移动端菜单按钮预留空间 */
  }
}

/* 动画效果 */
@keyframes slideInRight {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
