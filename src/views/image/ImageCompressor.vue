<template>
  <ToolPanel title="图片压缩转换" description="在线压缩图片、调整尺寸、转换格式，支持PNG/JPG/WebP互转">
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
    <div class="upload-section">
      <div
        class="drop-zone"
        :class="{ 'drag-over': isDragOver, 'has-image': sourceFile }"
        @drop="handleDrop"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
        @click="selectFile"
      >
        <template v-if="!sourceFile">
          <span class="upload-icon">🖼️</span>
          <h3>拖拽图片到此处或点击选择</h3>
          <p>支持 PNG、JPG、GIF、WebP 格式，最大 20MB</p>
        </template>
        <template v-else>
          <div class="source-preview-container">
            <img :src="sourcePreviewUrl" class="source-preview" alt="原图预览" />
            <div class="source-info">
              <span class="file-name">{{ sourceFile.name }}</span>
              <span class="file-meta">
                {{ formatFileSize(sourceFile.size) }} · {{ sourceDimensions?.width }}×{{ sourceDimensions?.height }}
              </span>
            </div>
          </div>
        </template>
        <input
          ref="fileInput"
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          @change="handleFileSelect"
          @click.stop
          style="display: none"
        />
        <button @click.stop="selectFile" class="btn btn-primary">
          {{ sourceFile ? '重新选择' : '选择图片' }}
        </button>
      </div>
    </div>

    <!-- 压缩设置 -->
    <div v-if="sourceFile" class="settings-section">
      <h3>压缩设置</h3>
      <div class="settings-grid">
        <!-- 输出格式 -->
        <div class="setting-item">
          <label class="setting-label">输出格式</label>
          <div class="format-selector">
            <button
              v-for="format in IMAGE_FORMATS"
              :key="format.value"
              class="format-btn"
              :class="{ active: outputFormat === format.value }"
              @click="outputFormat = format.value"
            >
              {{ format.label }}
            </button>
          </div>
          <p v-if="transparencyWarning" class="setting-warning">
            ⚠️ 原图含透明通道，转为 JPEG 将填充白色背景
          </p>
        </div>

        <!-- 质量设置 -->
        <div class="setting-item" v-if="currentFormat?.supportsQuality">
          <label class="setting-label">
            压缩质量
            <span class="quality-value">{{ Math.round(quality * 100) }}%</span>
          </label>
          <input
            type="range"
            v-model.number="quality"
            min="0.1"
            max="1"
            step="0.05"
            class="quality-slider"
          />
          <div class="quality-hints">
            <span>更小体积</span>
            <span>更高质量</span>
          </div>
        </div>

        <!-- 尺寸设置 -->
        <div class="setting-item">
          <label class="setting-label">
            <input type="checkbox" v-model="enableResize" />
            调整尺寸
          </label>
          <div v-if="enableResize" class="resize-inputs">
            <div class="input-group">
              <label>最大宽度</label>
              <input
                type="number"
                v-model.number="maxWidth"
                placeholder="不限制"
                min="1"
                max="10000"
              />
              <span class="input-unit">px</span>
            </div>
            <div class="input-group">
              <label>最大高度</label>
              <input
                type="number"
                v-model.number="maxHeight"
                placeholder="不限制"
                min="1"
                max="10000"
              />
              <span class="input-unit">px</span>
            </div>
          </div>
          <p class="setting-hint">保持宽高比，仅在超过限制时缩小</p>
        </div>
      </div>

      <!-- 压缩按钮 -->
      <div class="compress-action">
        <button
          @click="compress"
          class="btn btn-success btn-lg"
          :disabled="isCompressing"
        >
          <span class="btn-icon">{{ isCompressing ? '⏳' : '🗜️' }}</span>
          {{ isCompressing ? '压缩中...' : '开始压缩' }}
        </button>
      </div>
    </div>

    <!-- 压缩结果 -->
    <div v-if="result" class="result-section">
      <h3>压缩结果</h3>
      <div class="result-comparison">
        <!-- 原图信息 -->
        <div class="result-card original">
          <h4>原图</h4>
          <img :src="sourcePreviewUrl" alt="原图" class="result-preview" />
          <div class="result-info">
            <div class="info-row">
              <span class="info-label">尺寸</span>
              <span class="info-value">{{ sourceDimensions?.width }}×{{ sourceDimensions?.height }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">大小</span>
              <span class="info-value">{{ formatFileSize(result.originalSize) }}</span>
            </div>
          </div>
        </div>

        <!-- 箭头 -->
        <div class="result-arrow">
          <span class="arrow-icon">→</span>
          <span
            class="compression-ratio"
            :class="{ positive: result.compressionRatio > 0, negative: result.compressionRatio < 0 }"
          >
            {{ result.compressionRatio > 0 ? '-' : '+' }}{{ Math.abs(result.compressionRatio) }}%
          </span>
        </div>

        <!-- 压缩后信息 -->
        <div class="result-card compressed">
          <h4>压缩后</h4>
          <img :src="result.dataUrl" alt="压缩后" class="result-preview" />
          <div class="result-info">
            <div class="info-row">
              <span class="info-label">尺寸</span>
              <span class="info-value">{{ result.width }}×{{ result.height }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">大小</span>
              <span class="info-value highlight">{{ formatFileSize(result.compressedSize) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 下载按钮 -->
      <div class="download-action">
        <button @click="downloadResult" class="btn btn-primary btn-lg">
          <span class="btn-icon">💾</span>
          下载图片
        </button>
        <span class="download-filename">{{ outputFilename }}</span>
      </div>
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
          <h4>支持的格式</h4>
          <ul>
            <li><strong>输入</strong>：PNG、JPG、GIF、WebP</li>
            <li><strong>输出</strong>：PNG、JPG、WebP</li>
            <li>WebP 格式体积最小，兼容性好</li>
            <li>PNG 支持透明，适合图标</li>
            <li>JPG 适合照片，不支持透明</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>压缩说明</h4>
          <ul>
            <li>质量越低，文件越小，画质损失越大</li>
            <li>PNG 为无损格式，不支持质量调节</li>
            <li>缩小尺寸可大幅减少文件大小</li>
            <li>所有处理均在浏览器本地完成</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>使用建议</h4>
          <ul>
            <li><strong>网页图片</strong>：WebP 格式，质量 80%</li>
            <li><strong>照片分享</strong>：JPG 格式，质量 85%</li>
            <li><strong>图标/Logo</strong>：PNG 格式保留透明</li>
            <li><strong>缩略图</strong>：限制最大宽高 + 降低质量</li>
          </ul>
        </div>
      </div>
    </div>
  </ToolPanel>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'
import {
  IMAGE_FORMATS,
  compressImage,
  formatFileSize,
  getExtension,
  getFileNameWithoutExt,
  downloadBlob,
  hasTransparency,
  type ImageFormat,
  type CompressResult,
} from '@/utils/imageUtils'

// 响应式状态
const fileInput = ref<HTMLInputElement | null>(null)
const sourceFile = ref<File | null>(null)
const sourcePreviewUrl = ref('')
const sourceDimensions = ref<{ width: number; height: number } | null>(null)
const isDragOver = ref(false)
const hasAlpha = ref(false)

// 压缩设置
const outputFormat = ref<ImageFormat>('image/jpeg')
const quality = ref(0.8)
const enableResize = ref(false)
const maxWidth = ref<number | undefined>(undefined)
const maxHeight = ref<number | undefined>(undefined)

// 状态
const isCompressing = ref(false)
const result = ref<CompressResult | null>(null)
const toast = ref({ show: false, message: '', type: 'info' as 'success' | 'error' | 'info' })

// 计算属性
const currentFormat = computed(() => IMAGE_FORMATS.find(f => f.value === outputFormat.value))

const transparencyWarning = computed(() => {
  return hasAlpha.value && outputFormat.value === 'image/jpeg'
})

const outputFilename = computed(() => {
  if (!sourceFile.value) return ''
  const baseName = getFileNameWithoutExt(sourceFile.value.name)
  const ext = getExtension(outputFormat.value)
  return `${baseName}_compressed${ext}`
})

// 监听源文件变化，检测透明度
watch(sourceFile, async (file) => {
  if (file) {
    hasAlpha.value = await hasTransparency(file)
    // 如果有透明通道，默认使用 PNG
    if (hasAlpha.value) {
      outputFormat.value = 'image/png'
    }
  }
})

// 文件选择
function selectFile() {
  fileInput.value?.click()
}

function handleFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

async function processFile(file: File) {
  if (!file.type.startsWith('image/')) {
    showToast('请选择图片文件', 'error')
    return
  }

  if (file.size > 20 * 1024 * 1024) {
    showToast('文件大小不能超过 20MB', 'error')
    return
  }

  // 清理旧数据
  if (sourcePreviewUrl.value) {
    URL.revokeObjectURL(sourcePreviewUrl.value)
  }
  if (result.value?.dataUrl) {
    URL.revokeObjectURL(result.value.dataUrl)
  }
  result.value = null

  sourceFile.value = file
  sourcePreviewUrl.value = URL.createObjectURL(file)

  // 获取图片尺寸
  const img = new Image()
  img.onload = () => {
    sourceDimensions.value = { width: img.width, height: img.height }
  }
  img.src = sourcePreviewUrl.value

  showToast('图片加载成功', 'success')
}

// 压缩
async function compress() {
  if (!sourceFile.value) return

  isCompressing.value = true

  // 清理旧结果
  if (result.value?.dataUrl) {
    URL.revokeObjectURL(result.value.dataUrl)
  }

  try {
    result.value = await compressImage(sourceFile.value, {
      outputFormat: outputFormat.value,
      quality: quality.value,
      maxWidth: enableResize.value ? maxWidth.value : undefined,
      maxHeight: enableResize.value ? maxHeight.value : undefined,
    })

    if (result.value.compressionRatio > 0) {
      showToast(`压缩成功，减少了 ${result.value.compressionRatio}%`, 'success')
    } else {
      showToast('处理完成，文件大小略有增加', 'info')
    }
  } catch (error) {
    showToast('压缩失败：' + (error as Error).message, 'error')
  } finally {
    isCompressing.value = false
  }
}

// 下载
function downloadResult() {
  if (!result.value) return
  downloadBlob(result.value.blob, outputFilename.value)
  showToast('下载已开始', 'success')
}

// 清空
function clearAll() {
  if (sourcePreviewUrl.value) {
    URL.revokeObjectURL(sourcePreviewUrl.value)
  }
  if (result.value?.dataUrl) {
    URL.revokeObjectURL(result.value.dataUrl)
  }

  sourceFile.value = null
  sourcePreviewUrl.value = ''
  sourceDimensions.value = null
  hasAlpha.value = false
  result.value = null
  enableResize.value = false
  maxWidth.value = undefined
  maxHeight.value = undefined
  quality.value = 0.8
  outputFormat.value = 'image/jpeg'

  if (fileInput.value) {
    fileInput.value.value = ''
  }

  showToast('已清空', 'info')
}

// Toast
function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, type === 'success' ? 2000 : 4000)
}

function getToastIcon(): string {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' }
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

.upload-section {
  margin-bottom: 2rem;
}

.drop-zone {
  border: 2px dashed var(--color-border);
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  background-color: var(--color-background-soft);
  transition: all 0.3s ease;
  cursor: pointer;
}

.drop-zone:hover,
.drop-zone.drag-over {
  border-color: var(--vt-c-green);
  background-color: var(--color-background-mute);
}

.drop-zone.has-image {
  padding: 2rem;
}

.upload-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

.drop-zone h3 {
  margin: 1rem 0;
  color: var(--color-heading);
}

.drop-zone p {
  color: var(--color-text-light);
  margin-bottom: 1.5rem;
}

.source-preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.source-preview {
  max-width: 300px;
  max-height: 200px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-image: linear-gradient(45deg, #eee 25%, transparent 25%),
    linear-gradient(-45deg, #eee 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #eee 75%),
    linear-gradient(-45deg, transparent 75%, #eee 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
}

.source-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.file-name {
  font-weight: 500;
  color: var(--color-text);
}

.file-meta {
  font-size: 0.875rem;
  color: var(--color-text-light);
}

/* 设置区域 */
.settings-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.settings-section h3 {
  margin: 0 0 1.5rem 0;
  color: var(--color-heading);
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-label {
  font-weight: 500;
  color: var(--color-heading);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.setting-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.quality-value {
  font-weight: 600;
  color: var(--vt-c-green);
  margin-left: auto;
}

.setting-warning {
  color: #f59e0b;
  font-size: 0.875rem;
  margin: 0;
}

.setting-hint {
  color: var(--color-text-light);
  font-size: 0.8rem;
  margin: 0;
}

/* 格式选择 */
.format-selector {
  display: flex;
  gap: 0.5rem;
}

.format-btn {
  padding: 0.5rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.format-btn:hover {
  border-color: var(--vt-c-green);
}

.format-btn.active {
  border-color: var(--vt-c-green);
  background-color: var(--vt-c-green);
  color: white;
}

/* 质量滑块 */
.quality-slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: var(--color-background-mute);
  outline: none;
  appearance: none;
}

.quality-slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--vt-c-green);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.quality-hints {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--color-text-light);
}

/* 尺寸输入 */
.resize-inputs {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.875rem;
  color: var(--color-text-light);
}

.input-group input[type="number"] {
  width: 100px;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
}

.input-unit {
  font-size: 0.875rem;
  color: var(--color-text-light);
}

.compress-action {
  margin-top: 1.5rem;
  text-align: center;
}

/* 结果区域 */
.result-section {
  margin-bottom: 2rem;
}

.result-section h3 {
  margin-bottom: 1.5rem;
  color: var(--color-heading);
}

.result-comparison {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.result-card {
  flex: 1;
  min-width: 200px;
  max-width: 300px;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background-color: var(--color-background-soft);
}

.result-card h4 {
  margin: 0 0 1rem 0;
  text-align: center;
  color: var(--color-heading);
}

.result-preview {
  width: 100%;
  height: 150px;
  object-fit: contain;
  border-radius: 4px;
  background-image: linear-gradient(45deg, #ddd 25%, transparent 25%),
    linear-gradient(-45deg, #ddd 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ddd 75%),
    linear-gradient(-45deg, transparent 75%, #ddd 75%);
  background-size: 12px 12px;
  background-position: 0 0, 0 6px, 6px -6px, -6px 0px;
}

.result-info {
  margin-top: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
}

.info-label {
  color: var(--color-text-light);
}

.info-value {
  font-weight: 500;
}

.info-value.highlight {
  color: var(--vt-c-green);
}

.result-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.arrow-icon {
  font-size: 2rem;
  color: var(--color-text-light);
}

.compression-ratio {
  font-size: 1.25rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.compression-ratio.positive {
  background-color: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.compression-ratio.negative {
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.download-action {
  margin-top: 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.download-filename {
  font-size: 0.875rem;
  color: var(--color-text-light);
}

/* 功能说明 */
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

/* Toast 通知 */
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: slideInRight 0.3s ease-out;
}

.toast-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.toast-error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.toast-info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.toast-icon {
  font-size: 1.25rem;
}

.toast-message {
  flex: 1;
  font-weight: 500;
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

  .result-comparison {
    flex-direction: column;
  }

  .result-arrow {
    transform: rotate(90deg);
  }

  .result-card {
    max-width: 100%;
  }

  .format-selector {
    flex-wrap: wrap;
  }

  .resize-inputs {
    flex-direction: column;
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
