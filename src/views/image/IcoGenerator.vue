<template>
  <ToolPanel title="ICO图标生成" description="将PNG/JPG/GIF/WebP图片转换为ICO图标格式，支持多尺寸">
    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="tool-group">
        <button @click="clearAll" class="btn btn-error">
          <span class="btn-icon">🗑️</span>
          清空
        </button>
      </div>
    </div>

    <!-- 文件上传区域 -->
    <ImageUploader
      ref="uploaderRef"
      accept="image/png,image/jpeg,image/gif,image/webp"
      :max-size="10 * 1024 * 1024"
      description="支持 PNG、JPG、GIF、WebP 格式，建议使用正方形图片"
      @file-selected="handleFileSelected"
      @error="showToast($event, 'error')"
    />

    <!-- 尺寸选择 -->
    <div v-if="sourceImage" class="size-section">
      <h3>选择生成尺寸</h3>
      <div class="size-grid">
        <label
          v-for="size in icoSizes"
          :key="size.label"
          class="size-item"
          :class="{ active: size.enabled }"
        >
          <input type="checkbox" v-model="size.enabled" @change="updatePreviews" />
          <span class="size-checkbox">{{ size.enabled ? '✓' : '' }}</span>
          <span class="size-label">{{ size.label }}</span>
          <span class="size-desc">{{ getSizeDescription(size.width) }}</span>
        </label>
      </div>
      <div class="size-options">
        <button @click="selectAllSizes" class="btn btn-secondary btn-sm">全选</button>
        <button @click="selectCommonSizes" class="btn btn-secondary btn-sm">常用尺寸</button>
        <button @click="clearSizes" class="btn btn-secondary btn-sm">清除选择</button>
      </div>
    </div>

    <!-- 预览区域 -->
    <div v-if="previews.length > 0" class="preview-section">
      <h3>尺寸预览</h3>
      <div class="preview-grid">
        <div v-for="preview in previews" :key="preview.size.label" class="preview-item">
          <div
            class="preview-box"
            :style="{
              width: Math.min(preview.size.width, 128) + 'px',
              height: Math.min(preview.size.height, 128) + 'px',
            }"
          >
            <img :src="preview.dataUrl" :alt="preview.size.label" />
          </div>
          <span class="preview-label">{{ preview.size.label }}</span>
        </div>
      </div>
    </div>

    <!-- 生成按钮 -->
    <div v-if="sourceImage && enabledSizes.length > 0" class="action-section">
      <button
        @click="generateAndDownload"
        class="btn btn-success btn-lg"
        :disabled="isGenerating"
      >
        <span class="btn-icon">{{ isGenerating ? '⏳' : '💾' }}</span>
        {{ isGenerating ? '生成中...' : '生成并下载 ICO' }}
      </button>
      <p class="action-hint">
        将生成包含 {{ enabledSizes.length }} 个尺寸的 ICO 文件
      </p>
    </div>

    <!-- Toast 通知 -->
    <div v-if="toast.show" class="toast-notification" :class="`toast-${toast.type}`">
      <span class="toast-icon">{{ getToastIcon() }}</span>
      <span class="toast-message">{{ toast.message }}</span>
      <button @click="toast.show = false" class="toast-close">×</button>
    </div>

    <!-- 功能说明 -->
    <div class="info-section">
      <h3>功能说明</h3>
      <div class="info-grid">
        <div class="info-card">
          <h4>支持的输入格式</h4>
          <ul>
            <li><strong>PNG</strong> - 推荐，支持透明背景</li>
            <li><strong>JPG/JPEG</strong> - 不支持透明</li>
            <li><strong>GIF</strong> - 静态图片</li>
            <li><strong>WebP</strong> - 现代格式</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>尺寸说明</h4>
          <ul>
            <li><strong>16×16</strong> - 浏览器标签页图标</li>
            <li><strong>32×32</strong> - 标准桌面图标</li>
            <li><strong>48×48</strong> - 大图标视图</li>
            <li><strong>64×64</strong> - 高清桌面图标</li>
            <li><strong>128×128</strong> - 大尺寸预览</li>
            <li><strong>256×256</strong> - 超大图标 (Vista+)</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>使用建议</h4>
          <ul>
            <li>上传高分辨率源图获得最佳效果</li>
            <li>使用 PNG 格式可保留透明背景</li>
            <li>正方形图片效果最佳</li>
            <li>网站图标建议包含 16×16 和 32×32</li>
            <li>桌面应用建议包含 48×48 及以上</li>
          </ul>
        </div>
      </div>
    </div>
  </ToolPanel>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import {
  DEFAULT_ICO_SIZES,
  generatePreviews as generatePreviewsUtil,
  generateIcoFile,
  formatFileSize,
  getSizeDescription,
  type IcoSize,
  type IcoPreviewItem,
} from '@/utils/icoUtils'

// 响应式状态
const uploaderRef = ref<InstanceType<typeof ImageUploader>>()
const sourceImage = ref<File | null>(null)
const isDragOver = ref(false)
const icoSizes = ref<IcoSize[]>(JSON.parse(JSON.stringify(DEFAULT_ICO_SIZES)))
const previews = ref<IcoPreviewItem[]>([])
const isGenerating = ref(false)
const toast = ref({ show: false, message: '', type: 'info' as 'success' | 'error' | 'info' })

// 计算属性
const enabledSizes = computed(() => icoSizes.value.filter((s) => s.enabled))

// 监听源图变化,自动更新预览
watch(sourceImage, async () => {
  if (sourceImage.value && enabledSizes.value.length > 0) {
    await updatePreviews()
  }
})

// 处理文件选择
async function handleFileSelected(file: File) {
  sourceImage.value = file
  showToast('图片加载成功', 'success')

  // 生成预览
  if (enabledSizes.value.length > 0) {
    await updatePreviews()
  }
}

// 更新预览
async function updatePreviews() {
  if (!sourceImage.value) return

  // 清理旧的预览 URL
  for (const preview of previews.value) {
    URL.revokeObjectURL(preview.dataUrl)
  }

  if (enabledSizes.value.length === 0) {
    previews.value = []
    return
  }

  try {
    previews.value = await generatePreviewsUtil(sourceImage.value, enabledSizes.value)
  } catch (error) {
    showToast('预览生成失败：' + (error as Error).message, 'error')
    previews.value = []
  }
}

// 生成并下载
async function generateAndDownload() {
  if (!sourceImage.value || enabledSizes.value.length === 0) return

  isGenerating.value = true
  try {
    const icoBlob = await generateIcoFile(sourceImage.value, icoSizes.value)

    // 触发下载
    const url = URL.createObjectURL(icoBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = sourceImage.value.name.replace(/\.[^.]+$/, '') + '.ico'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast('ICO 文件生成成功', 'success')
  } catch (error) {
    showToast('生成失败：' + (error as Error).message, 'error')
  } finally {
    isGenerating.value = false
  }
}

// 尺寸选择快捷操作
function selectAllSizes() {
  icoSizes.value.forEach((s) => (s.enabled = true))
  updatePreviews()
}

function selectCommonSizes() {
  icoSizes.value.forEach((s) => {
    s.enabled = [16, 32, 48].includes(s.width)
  })
  updatePreviews()
}

function clearSizes() {
  icoSizes.value.forEach((s) => (s.enabled = false))
  previews.value = []
}

// 清空所有
function clearAll() {
  // 清理预览 URL
  for (const preview of previews.value) {
    URL.revokeObjectURL(preview.dataUrl)
  }

  uploaderRef.value?.clear()
  sourceImage.value = null
  previews.value = []
  icoSizes.value = JSON.parse(JSON.stringify(DEFAULT_ICO_SIZES))

  showToast('已清空所有内容', 'info')
}

// Toast 相关
function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, type === 'success' ? 2000 : 4000)
}

function getToastIcon(): string {
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  }
  return icons[toast.value.type] || 'ℹ️'
}
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.size-section {
  margin-bottom: 2rem;
}

.size-section h3 {
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.size-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.size-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-background);
  cursor: pointer;
  transition: all 0.2s ease;
}

.size-item:hover {
  border-color: var(--vt-c-green);
}

.size-item.active {
  border-color: var(--vt-c-green);
  background-color: rgba(16, 185, 129, 0.1);
}

.size-item input[type='checkbox'] {
  display: none;
}

.size-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--vt-c-green);
  transition: all 0.2s ease;
}

.size-item.active .size-checkbox {
  background-color: var(--vt-c-green);
  border-color: var(--vt-c-green);
  color: white;
}

.size-label {
  font-weight: 600;
  color: var(--color-heading);
}

.size-desc {
  font-size: 0.75rem;
  color: var(--color-text-light);
  margin-left: auto;
}

.size-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.preview-section {
  margin-bottom: 2rem;
}

.preview-section h3 {
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1.5rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.preview-box {
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 8px 8px;
  background-position:
    0 0,
    0 4px,
    4px -4px,
    -4px 0px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 4px;
}

.preview-box img {
  max-width: 100%;
  max-height: 100%;
  image-rendering: pixelated;
}

.preview-label {
  font-size: 0.75rem;
  color: var(--color-text-light);
  font-weight: 500;
}

.action-section {
  text-align: center;
  margin-bottom: 2rem;
}

.action-hint {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text-light);
}

.info-section {
  margin-top: 3rem;
}

.info-section h3 {
  margin-bottom: 1.5rem;
  color: var(--color-heading);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.info-card {
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-background-soft);
}

.info-card h4 {
  margin: 0 0 1rem 0;
  color: var(--color-heading);
}

.info-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-card li {
  padding: 0.25rem 0;
  color: var(--color-text);
  position: relative;
  padding-left: 1rem;
}

.info-card li::before {
  content: '•';
  color: var(--vt-c-green);
  font-weight: bold;
  position: absolute;
  left: 0;
}

.info-card li strong {
  color: var(--color-heading);
}

/* Toast 通知样式 */
.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  min-width: 320px;
  max-width: 500px;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 2px 4px rgba(0, 0, 0, 0.1);
  animation: slideInRight 0.3s ease-out;
  backdrop-filter: blur(10px);
}

.toast-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-left: 4px solid #047857;
}

.toast-error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-left: 4px solid #b91c1c;
}

.toast-info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-left: 4px solid #1d4ed8;
}

.toast-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  font-weight: 500;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.toast-close:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon {
  font-size: 1rem;
}

.btn-primary {
  background-color: var(--vt-c-green);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover, #059669);
}

.btn-secondary {
  background-color: var(--color-background-mute);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-border);
  border-color: var(--color-border-hover);
}

.btn-success {
  background-color: var(--vt-c-green);
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: var(--color-primary-hover, #059669);
}

.btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-error {
  background-color: var(--vt-c-red);
  color: white;
}

.btn-error:hover {
  background-color: var(--color-danger-hover, #dc2626);
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
}

.btn-lg {
  padding: 0.75rem 2rem;
  font-size: 1rem;
}

/* 响应式 */
@media (max-width: 768px) {
  .drop-zone {
    padding: 2rem 1rem;
  }

  .upload-icon {
    font-size: 2rem;
  }

  .size-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .preview-grid {
    justify-content: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .toast-notification {
    top: 10px;
    right: 10px;
    left: 10px;
    min-width: auto;
    max-width: none;
  }
}
</style>
