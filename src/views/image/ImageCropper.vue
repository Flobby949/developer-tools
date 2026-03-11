<template>
  <ToolPanel title="图片裁切工具" description="自由裁切或按比例裁切图片，支持精确数值输入">
    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="tool-group">
        <button @click="clearAll" class="btn btn-error" :disabled="!sourceFile">
          <span class="btn-icon">🗑️</span>
          清空
        </button>
        <button
          @click="downloadResult"
          class="btn btn-success"
          :disabled="!croppedUrl || isProcessing"
        >
          <span class="btn-icon">💾</span>
          下载图片
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
          <p>支持 PNG、JPG、WebP 格式，最大 20MB</p>
        </template>
        <template v-else>
          <div class="source-preview-container">
            <img :src="sourcePreviewUrl" class="source-preview" alt="原图预览" />
            <div class="source-info">
              <span class="file-name">{{ sourceFile.name }}</span>
              <span class="file-meta">
                {{ formatFileSize(sourceFile.size) }} · {{ sourceDimensions?.width }}×{{
                  sourceDimensions?.height
                }}
              </span>
            </div>
          </div>
        </template>
        <input
          ref="fileInput"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          @change="handleFileSelect"
          @click.stop
          style="display: none"
        />
        <button @click.stop="selectFile" class="btn btn-primary">
          {{ sourceFile ? '重新选择' : '选择图片' }}
        </button>
      </div>
    </div>

    <!-- 裁切设置 -->
    <div v-if="sourceFile" class="settings-section">
      <h3>裁切设置</h3>

      <!-- 裁切比例 -->
      <div class="setting-item">
        <label class="setting-label">裁切比例</label>
        <div class="ratio-selector">
          <button
            v-for="ratio in CROP_RATIOS"
            :key="ratio.label"
            class="ratio-btn"
            :class="{ active: selectedRatio === ratio.value }"
            @click="selectRatio(ratio.value)"
          >
            {{ ratio.label }}
          </button>
        </div>
      </div>

      <!-- 精确数值输入 -->
      <div class="setting-item">
        <label class="setting-label">精确裁切（像素）</label>
        <div class="crop-inputs">
          <div class="input-group">
            <label>X</label>
            <input
              type="number"
              v-model.number="cropConfig.x"
              min="0"
              :max="sourceDimensions?.width"
              @input="updateCrop"
            />
          </div>
          <div class="input-group">
            <label>Y</label>
            <input
              type="number"
              v-model.number="cropConfig.y"
              min="0"
              :max="sourceDimensions?.height"
              @input="updateCrop"
            />
          </div>
          <div class="input-group">
            <label>宽度</label>
            <input
              type="number"
              v-model.number="cropConfig.width"
              min="1"
              :max="sourceDimensions?.width"
              @input="updateCrop"
            />
          </div>
          <div class="input-group">
            <label>高度</label>
            <input
              type="number"
              v-model.number="cropConfig.height"
              min="1"
              :max="sourceDimensions?.height"
              @input="updateCrop"
            />
          </div>
        </div>
      </div>

      <!-- 快速操作 -->
      <div class="setting-item">
        <label class="setting-label">快速操作</label>
        <div class="quick-actions">
          <button @click="resetCrop" class="action-btn">重置</button>
          <button @click="applyCrop" class="action-btn btn-primary">应用裁切</button>
        </div>
      </div>
    </div>

    <!-- 预览区域 -->
    <div v-if="sourceFile" class="preview-section">
      <h3>预览</h3>
      <div class="preview-container">
        <div class="canvas-wrapper">
          <canvas ref="previewCanvas" class="preview-canvas"></canvas>
          <div
            v-if="!croppedUrl"
            class="crop-overlay"
            :style="{
              left: cropConfig.x + 'px',
              top: cropConfig.y + 'px',
              width: cropConfig.width + 'px',
              height: cropConfig.height + 'px',
            }"
          >
            <div class="crop-info">
              {{ cropConfig.width }} × {{ cropConfig.height }}
            </div>
          </div>
        </div>
        <div v-if="croppedUrl" class="cropped-preview">
          <img :src="croppedUrl" alt="裁切结果" class="cropped-image" />
        </div>
      </div>
    </div>

    <!-- Toast 通知 -->
    <Teleport to="body">
      <div v-if="toast.show" class="toast-notification" :class="`toast-${toast.type}`">
        <span class="toast-icon">{{ getToastIcon() }}</span>
        <span class="toast-message">{{ toast.message }}</span>
        <button @click="toast.show = false" class="toast-close">×</button>
      </div>
    </Teleport>
  </ToolPanel>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'
import {
  loadImage,
  formatFileSize,
  downloadBlob,
  getFileNameWithoutExt,
  cropImage,
  calculateCropWithRatio,
  CROP_RATIOS,
} from '@/utils/imageUtils'
import type { CropConfig } from '@/types'

// 文件相关
const fileInput = ref<HTMLInputElement>()
const sourceFile = ref<File>()
const sourcePreviewUrl = ref('')
const sourceDimensions = ref<{ width: number; height: number }>()
const isDragOver = ref(false)

// 裁切配置
const cropConfig = ref<CropConfig>({
  x: 0,
  y: 0,
  width: 100,
  height: 100,
})

const selectedRatio = ref<number | null>(null)

// Canvas 相关
const previewCanvas = ref<HTMLCanvasElement>()
const sourceImage = ref<HTMLImageElement>()

// 裁切结果
const croppedUrl = ref('')
const isProcessing = ref(false)

// Toast 通知
const toast = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'info',
})

// 显示 Toast
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

// 获取 Toast 图标
function getToastIcon(): string {
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  }
  return icons[toast.value.type] || 'ℹ️'
}

// 选择文件
const selectFile = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await loadSourceFile(file)
  }
}

// 处理拖拽
const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false

  const file = event.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    await loadSourceFile(file)
  } else {
    showToast('请拖入图片文件', 'error')
  }
}

// 加载源文件
const loadSourceFile = async (file: File) => {
  if (file.size > 20 * 1024 * 1024) {
    showToast('文件大小不能超过 20MB', 'error')
    return
  }

  try {
    sourceFile.value = file
    sourcePreviewUrl.value = URL.createObjectURL(file)

    const img = await loadImage(file)
    sourceImage.value = img
    sourceDimensions.value = { width: img.width, height: img.height }

    // 初始化裁切区域为整个图片
    cropConfig.value = {
      x: 0,
      y: 0,
      width: img.width,
      height: img.height,
    }

    await nextTick()
    drawPreview()
    showToast('图片加载成功', 'success')
  } catch (error) {
    showToast('图片加载失败', 'error')
    console.error(error)
  }
}

// 绘制预览
const drawPreview = () => {
  if (!previewCanvas.value || !sourceImage.value) return

  const canvas = previewCanvas.value
  const img = sourceImage.value

  // 计算缩放比例以适应容器
  const maxWidth = 800
  const maxHeight = 600
  let scale = 1

  if (img.width > maxWidth || img.height > maxHeight) {
    scale = Math.min(maxWidth / img.width, maxHeight / img.height)
  }

  canvas.width = img.width * scale
  canvas.height = img.height * scale

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  // 调整裁切框位置以匹配缩放
  cropConfig.value.x = Math.round(cropConfig.value.x * scale)
  cropConfig.value.y = Math.round(cropConfig.value.y * scale)
  cropConfig.value.width = Math.round(cropConfig.value.width * scale)
  cropConfig.value.height = Math.round(cropConfig.value.height * scale)
}

// 选择比例
const selectRatio = (ratio: number | null) => {
  selectedRatio.value = ratio

  if (!sourceDimensions.value) return

  const config = calculateCropWithRatio(
    sourceDimensions.value.width,
    sourceDimensions.value.height,
    ratio
  )

  cropConfig.value = config
  croppedUrl.value = ''
}

// 更新裁切
const updateCrop = () => {
  if (!sourceDimensions.value) return

  // 确保裁切区域在图片范围内
  cropConfig.value.x = Math.max(0, Math.min(cropConfig.value.x, sourceDimensions.value.width))
  cropConfig.value.y = Math.max(0, Math.min(cropConfig.value.y, sourceDimensions.value.height))
  cropConfig.value.width = Math.max(
    1,
    Math.min(cropConfig.value.width, sourceDimensions.value.width - cropConfig.value.x)
  )
  cropConfig.value.height = Math.max(
    1,
    Math.min(cropConfig.value.height, sourceDimensions.value.height - cropConfig.value.y)
  )

  croppedUrl.value = ''
}

// 重置裁切
const resetCrop = () => {
  if (!sourceDimensions.value) return

  cropConfig.value = {
    x: 0,
    y: 0,
    width: sourceDimensions.value.width,
    height: sourceDimensions.value.height,
  }
  selectedRatio.value = null
  croppedUrl.value = ''
}

// 应用裁切
const applyCrop = async () => {
  if (!sourceImage.value) return

  try {
    isProcessing.value = true
    const blob = await cropImage(sourceImage.value, cropConfig.value)

    if (croppedUrl.value) {
      URL.revokeObjectURL(croppedUrl.value)
    }
    croppedUrl.value = URL.createObjectURL(blob)
    showToast('裁切成功', 'success')
  } catch (error) {
    showToast('裁切失败', 'error')
    console.error(error)
  } finally {
    isProcessing.value = false
  }
}

// 下载结果
const downloadResult = () => {
  if (!croppedUrl.value || !sourceFile.value) return

  fetch(croppedUrl.value)
    .then((res) => res.blob())
    .then((blob) => {
      const filename = `${getFileNameWithoutExt(sourceFile.value!.name)}_cropped.png`
      downloadBlob(blob, filename)
      showToast('下载成功', 'success')
    })
    .catch(() => {
      showToast('下载失败', 'error')
    })
}

// 清空
const clearAll = () => {
  sourceFile.value = undefined
  sourcePreviewUrl.value = ''
  sourceDimensions.value = undefined
  sourceImage.value = undefined
  croppedUrl.value = ''
  selectedRatio.value = null
  showToast('已清空', 'info')
}
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--color-background-soft);
  border-radius: 8px;
}

.tool-group {
  display: flex;
  gap: 0.75rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
}

.btn-error {
  background: #ef4444;
  color: white;
}

.btn-error:hover:not(:disabled) {
  background: #dc2626;
}

.btn-icon {
  font-size: 1.125rem;
}

.upload-section {
  margin-bottom: 2rem;
}

.drop-zone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  padding: 2rem;
  border: 2px dashed var(--color-border);
  border-radius: 12px;
  background: var(--color-background-soft);
  cursor: pointer;
  transition: all 0.3s;
}

.drop-zone:hover {
  border-color: var(--color-primary);
  background: var(--color-background-mute);
}

.drop-zone.drag-over {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.drop-zone.has-image {
  min-height: auto;
}

.upload-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.source-preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.source-preview {
  max-width: 200px;
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

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .source-preview {
    background-image:
      linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.1) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.1) 75%);
  }
}

.source-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.file-name {
  font-weight: 600;
  color: var(--color-text);
}

.file-meta {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.settings-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--color-background-soft);
  border-radius: 12px;
}

.settings-section h3 {
  margin-bottom: 1.5rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.setting-item {
  margin-bottom: 1.5rem;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 500;
  color: var(--color-text);
}

.ratio-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.ratio-btn {
  padding: 0.5rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.ratio-btn:hover {
  border-color: var(--color-primary);
}

.ratio-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.crop-inputs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.input-group input {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.9375rem;
}

.quick-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  padding: 0.625rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: var(--color-primary);
}

.preview-section {
  margin-bottom: 2rem;
}

.preview-section h3 {
  margin-bottom: 1rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.preview-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  background: var(--color-background-soft);
  border-radius: 12px;
}

.canvas-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
}

.preview-canvas {
  max-width: 100%;
  border-radius: 8px;
}

.crop-overlay {
  position: absolute;
  border: 2px solid var(--color-primary);
  background: rgba(16, 185, 129, 0.1);
  pointer-events: none;
}

.crop-info {
  position: absolute;
  top: -30px;
  left: 0;
  padding: 0.25rem 0.5rem;
  background: var(--color-primary);
  color: white;
  font-size: 0.75rem;
  border-radius: 4px;
  white-space: nowrap;
}

.cropped-preview {
  display: flex;
  justify-content: center;
}

.cropped-image {
  max-width: 100%;
  max-height: 600px;
  border-radius: 8px;
  object-fit: contain;
}

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
</style>
