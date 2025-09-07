<template>
  <div class="home-page" :class="{ dark: appStore.theme === 'dark' }">
    <!-- 顶部导航栏 -->
    <header class="top-header">
      <div class="header-content">
        <h1 class="site-title">开发者工具集</h1>
        <div class="header-actions">
          <a
            href="https://github.com/Flobby949/developer-tools"
            target="_blank"
            class="github-link"
            title="查看源码"
          >
            <span class="github-icon">⭐</span>
            GitHub
          </a>
          <button
            class="theme-toggle-btn"
            @click="appStore.toggleTheme"
            :title="appStore.theme === 'light' ? '切换到深色模式' : '切换到浅色模式'"
          >
            <span class="theme-icon">{{ appStore.theme === 'light' ? '🌙' : '☀️' }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- 网站介绍区域 -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <h2 class="hero-title">
            <span class="title-gradient">开发者工具集</span>
            <span class="title-subtitle">Developer Tools</span>
          </h2>
          <p class="hero-description">
            🚀 为开发人员精心打造的在线工具平台，集成了日常开发中最常用的转换和处理工具。
            <br />
            基于 Vue 3 + TypeScript 构建，提供流畅的用户体验和强大的功能支持。
          </p>
          <div class="hero-features">
            <div class="feature-item">
              <span class="feature-icon">⚡</span>
              <span class="feature-text">快速高效</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🎨</span>
              <span class="feature-text">界面美观</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📱</span>
              <span class="feature-text">响应式设计</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🔧</span>
              <span class="feature-text">功能丰富</span>
            </div>
          </div>
        </div>
        <div class="hero-visual">
          <div class="visual-card">
            <div class="code-preview">
              <div class="code-header">
                <div class="code-dots">
                  <span class="dot red"></span>
                  <span class="dot yellow"></span>
                  <span class="dot green"></span>
                </div>
                <span class="code-title">示例代码</span>
              </div>
              <div class="code-content">
                <pre class="code-text">{{ sampleCode }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 工具展示区域 -->
    <section class="tools-section">
      <div class="tools-container">
        <h3 class="section-title">
          <span class="title-icon">🛠️</span>
          工具集合
        </h3>

        <div class="tools-grid">
          <div
            v-for="category in appStore.toolCategories"
            :key="category.title"
            class="category-section"
          >
            <h4 class="category-title">{{ category.title }}</h4>
            <div class="tools-cards">
              <div
                v-for="tool in category.tools"
                :key="tool.path"
                @click="navigateToTool(tool.path)"
                class="tool-card"
                :class="{ active: currentTool === tool.path }"
              >
                <div class="card-header">
                  <div class="tool-icon">{{ getToolIcon(tool.name) }}</div>
                  <h5 class="tool-name">{{ tool.name }}</h5>
                </div>
                <p class="tool-description">{{ tool.description }}</p>
                <div class="card-footer">
                  <span class="go-arrow">→</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 当前工具路径
const currentTool = computed(() => route.path)

// 示例代码
const sampleCode = ref(`{
  "name": "开发者工具集",
  "version": "1.0.0",
  "tools": ["JSON", "YAML", "编码转换"],
  "status": "running"
}`)

// 获取工具图标
const getToolIcon = (toolName: string): string => {
  const iconMap: { [key: string]: string } = {
    JSON格式化: '📋',
    JSON转实体类: '🏗️',
    YAML转Properties: '📄',
    URL编解码: '🔗',
    Base64编解码: '🔐',
    正则表达式测试: '🔍',
    JWT解析工具: '🔑',
  }
  return iconMap[toolName] || '🛠️'
}

// 导航到工具页面
const navigateToTool = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    var(--color-background) 0%,
    var(--color-background-soft) 50%,
    var(--color-background-mute) 100%
  );
  position: relative;
  overflow-x: hidden;
}

.home-page::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 50%;
  height: 50%;
  background: radial-gradient(circle at 100% 0%, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

/* 顶部导航栏 */
.top-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-border);
  transition: all 0.3s ease;
}

.dark .top-header {
  background: rgba(10, 10, 10, 0.95);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.site-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.github-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  color: var(--color-text);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.github-link:hover {
  background: var(--color-background-mute);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.github-icon {
  font-size: 1.2rem;
}

.theme-toggle-btn {
  background: var(--gradient-primary);
  border: none;
  color: white;
  padding: 0.75rem;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
}

.theme-toggle-btn:hover {
  transform: scale(1.1);
  box-shadow: var(--shadow-lg);
}

/* 英雄区域 */
.hero-section {
  padding: 8rem 2rem 4rem;
  max-width: 1200px;
  margin: 0 auto;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.2;
  margin: 0 0 1.5rem;
  display: flex;
  flex-direction: column;
}

.title-gradient {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-subtitle {
  font-size: 1.5rem;
  color: var(--color-text-light);
  font-weight: 400;
  margin-top: 0.5rem;
}

.hero-description {
  font-size: 1.2rem;
  line-height: 1.8;
  color: var(--color-text-light);
  margin-bottom: 2rem;
}

.hero-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-background-soft);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: var(--color-background-mute);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.feature-icon {
  font-size: 1.5rem;
}

.feature-text {
  font-weight: 600;
  color: var(--color-text);
}

/* 视觉卡片 */
.visual-card {
  perspective: 1000px;
}

.code-preview {
  background: var(--color-background-soft);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  overflow: hidden;
  transform: rotateY(-5deg) rotateX(5deg);
  box-shadow: var(--shadow-xl);
  transition: transform 0.3s ease;
}

.code-preview:hover {
  transform: rotateY(-2deg) rotateX(2deg) scale(1.02);
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--color-background-mute);
  border-bottom: 1px solid var(--color-border);
}

.code-dots {
  display: flex;
  gap: 0.5rem;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot.red {
  background: #ff5f57;
}
.dot.yellow {
  background: #ffbd2e;
}
.dot.green {
  background: #28ca42;
}

.code-title {
  font-size: 0.875rem;
  color: var(--color-text-light);
  font-weight: 500;
}

.code-content {
  padding: 1.5rem;
}

.code-text {
  color: var(--color-text);
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0;
}

/* 工具展示区域 */
.tools-section {
  padding: 4rem 2rem;
  background: var(--color-background-soft);
  border-top: 1px solid var(--color-border);
}

.tools-container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 3rem;
  text-align: center;
  justify-content: center;
}

.title-icon {
  font-size: 2rem;
}

.tools-grid {
  display: grid;
  gap: 3rem;
}

.category-section {
  margin-bottom: 2rem;
}

.category-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-primary);
  position: relative;
}

.category-title::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 40px;
  height: 2px;
  background: var(--gradient-primary);
}

.tools-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.tool-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.tool-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s ease;
}

.tool-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 8px 16px rgba(0, 0, 0, 0.05);
  border-color: var(--color-primary);
}

.tool-card:hover::before {
  left: 100%;
}

.tool-card.active {
  border-color: var(--color-primary);
  box-shadow:
    0 0 0 2px var(--color-primary-light),
    var(--shadow-lg);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.tool-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-primary);
  border-radius: 12px;
  color: white;
}

.tool-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.tool-description {
  color: var(--color-text-light);
  line-height: 1.6;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.go-arrow {
  font-size: 1.5rem;
  color: var(--color-primary);
  transition: transform 0.3s ease;
}

.tool-card:hover .go-arrow {
  transform: translateX(4px);
}

/* 深色主题样式 */
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

.dark .home-page::before {
  background: radial-gradient(circle at 100% 0%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
}

.dark .tool-card::before {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
}

.dark .tool-card:hover {
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.3),
    0 8px 16px rgba(0, 0, 0, 0.2);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 3rem;
    text-align: center;
  }

  .hero-features {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 1rem;
  }

  .site-title {
    font-size: 1.25rem;
  }

  .hero-section {
    padding: 6rem 1rem 2rem;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-features {
    grid-template-columns: 1fr;
  }

  .tools-section {
    padding: 2rem 1rem;
  }

  .tools-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }

  .title-subtitle {
    font-size: 1.2rem;
  }

  .hero-description {
    font-size: 1rem;
  }

  .tool-card {
    padding: 1.5rem;
  }
}
</style>
