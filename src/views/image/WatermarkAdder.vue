<template>
  <ToolPanel title="加水印工具" description="添加文字或图片水印，支持自定义样式和平铺模式">
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
          :disabled="!previewUrl || isProcessing"
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

    <!-- 两栏布局 -->
    <div v-if="sourceFile" class="two-column-layout">
      <!-- 左侧配置区 -->
      <div class="config-panel">
        <h3>水印配置</h3>

        <!-- 水印类型选择 -->
        <div class="setting-item">
          <label class="setting-label">水印类型</label>
          <div class="watermark-type-selector">
            <button
              class="type-btn"
              :class="{ active: watermarkType === 'text' }"
              @click="watermarkType = 'text'"
            >
              📝 文字
            </button>
            <button
              class="type-btn"
              :class="{ active: watermarkType === 'image' }"
              @click="watermarkType = 'image'"
            >
              🖼️ 图片
            </button>
          </div>
        </div>

        <!-- 文字水印配置 -->
        <template v-if="watermarkType === 'text'">
          <div class="setting-item">
            <label class="setting-label">水印文字</label>
            <input
              type="text"
              v-model="textConfig.text"
              placeholder="输入水印文字"
              class="text-input"
              @input="updatePreview"
            />
          </div>

          <div class="setting-item">
            <label class="setting-label">
              字体大小
              <span class="setting-value">{{ textConfig.fontSize }}px</span>
            </label>
            <input
              type="range"
              v-model.number="textConfig.fontSize"
              min="12"
              max="120"
              step="2"
              class="slider"
              @input="updatePreview"
            />
          </div>

          <div class="setting-item">
            <label class="setting-label">字体</label>
            <select v-model="textConfig.fontFamily" class="select-input" @change="updatePreview">
              <option value="Arial">Arial</option>
              <option value="'Microsoft YaHei'">微软雅黑</option>
              <option value="'SimHei'">黑体</option>
              <option value="'SimSun'">宋体</option>
              <option value="'KaiTi'">楷体</option>
            </select>
          </div>

          <div class="setting-item">
            <label class="setting-label">颜色</label>
            <input
              type="color"
              v-model="textConfig.color"
              class="color-input"
              @input="updatePreview"
            />
          </div>

          <div class="setting-item">
            <label class="setting-label">
              透明度
              <span class="setting-value">{{ Math.round(textConfig.opacity * 100) }}%</span>
            </label>
            <input
              type="range"
              v-model.number="textConfig.opacity"
              min="0"
              max="1"
              step="0.05"
              class="slider"
              @input="updatePreview"
            />
          </div>

          <div class="setting-item">
            <label class="setting-label">
              旋转角度
              <span class="setting-value">{{ textConfig.rotation }}°</span>
            </label>
            <input
              type="range"
              v-model.number="textConfig.rotation"
              min="-45"
              max="45"
              step="5"
              class="slider"
              @input="updatePreview"
            />
          </div>
        </template>

        <!-- 图片水印配置 -->
        <template v-if="watermarkType === 'image'">
          <div class="setting-item">
            <label class="setting-label">水印图片</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              @change="handleWatermarkFileSelect"
              class="file-input"
            />
            <p v-if="watermarkFile" class="file-info">
              {{ watermarkFile.name }} ({{ formatFileSize(watermarkFile.size) }})
            </p>
          </div>

          <div v-if="watermarkFile" class="setting-item">
            <label class="setting-label">
              缩放比例
              <span class="setting-value">{{ Math.round(imageConfig.scale * 100) }}%</span>
            </label>
            <input
              type="range"
              v-model.number="imageConfig.scale"
              min="0.1"
              max="1"
              step="0.05"
              class="slider"
              @input="updatePreview"
            />
          </div>

          <div v-if="watermarkFile" class="setting-item">
            <label class="setting-label">
              透明度
              <span class="setting-value">{{ Math.round(imageConfig.opacity * 100) }}%</span>
            </label>
            <input
              type="range"
              v-model.number="imageConfig.opacity"
              min="0"
              max="1"
              step="0.05"
              class="slider"
              @input="updatePreview"
            />
          </div>
        </template>

        <!-- 通用配置 -->
        <div class="setting-item">
          <label class="setting-label">位置</label>
          <div class="position-grid">
            <button
              v-for="pos in positions"
              :key="pos.value"
              class="position-btn"
              :class="{ active: currentPosition === pos.value }"
              @click="setPosition(pos.value)"
            >
              {{ pos.label }}
            </button>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <input type="checkbox" v-model="tiledMode" @change="updatePreview" />
            平铺模式
          </label>
        </div>

        <div v-if="tiledMode" class="setting-item">
          <label class="setting-label">
            间距
            <span class="setting-value">{{ spacing }}px</span>
          </label>
          <input
            type="range"
            v-model.number="spacing"
            min="20"
            max="200"
            step="10"
            class="slider"
            @input="updatePreview"
          />
        </div>
      </div>

      <!-- 右侧预览区 -->
      <div class="preview-panel">
        <h3>预览效果</h3>
        <div v-if="previewUrl" class="preview-container">
          <img :src="previewUrl" alt="预览" class="preview-image" />
        </div>
        <div v-else class="preview-placeholder">
          <span class="placeholder-icon">👁️</span>
          <p>调整配置后将显示预览</p>
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
import { ref, computed, watch } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'
import {
  loadImage,
  formatFileSize,
  downloadBlob,
  getFileNameWithoutExt,
  addTextWatermark,
  addImageWatermark,
} from '@/utils/imageUtils'
import type {
  WatermarkPosition,
  TextWatermarkConfig,
  ImageWatermarkConfig,
} from '@/types'

// 文件相关
const fileInput = ref<HTMLInputElement>()
const sourceFile = ref<File>()
const sourcePreviewUrl = ref('')
const sourceDimensions = ref<{ width: number; height: number }>()
const isDragOver = ref(false)

// 水印类型
const watermarkType = ref<'text' | 'image'>('text')

// 文字水印配置
const textConfig = ref<TextWatermarkConfig>({
  text: '水印文字',
  fontSize: 48,
  fontFamily: 'Arial',
  color: '#000000',
  opacity: 0.5,
  rotation: -30,
  position: 'bottom-right',
  tiled: false,
})

// 图片水印配置
const watermarkFile = ref<File>()
const imageConfig = ref<Omit<ImageWatermarkConfig, 'imageFile'>>({
  scale: 0.3,
  opacity: 0.8,
  position: 'bottom-right',
  tiled: false,
})

// 通用配置
const currentPosition = ref<WatermarkPosition>('bottom-right')
const tiledMode = ref(false)
const spacing = ref(100)

// 位置选项
const positions = [
  { label: '↖', value: 'top-left' as WatermarkPosition },
  { label: '↑', value: 'top-center' as WatermarkPosition },
  { label: '↗', value: 'top-right' as WatermarkPosition },
  { label: '←', value: 'middle-left' as WatermarkPosition },
  { label: '●', value: 'middle-center' as WatermarkPosition },
  { label: '→', value: 'middle-right' as WatermarkPosition },
  { label: '↙', value: 'bottom-left' as WatermarkPosition },
  { label: '↓', value: 'bottom-center' as WatermarkPosition },
  { label: '↘', value: 'bottom-right' as WatermarkPosition },
]

// 预览和处理
const previewUrl = ref('')
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
    sourceDimensions.value = { width: img.width, height: img.height }

    await updatePreview()
    showToast('图片加载成功', 'success')
  } catch (error) {
    showToast('图片加载失败', 'error')
    console.error(error)
  }
}

// 处理水印图片选择
const handleWatermarkFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    watermarkFile.value = file
    await updatePreview()
  }
}

// 设置位置
const setPosition = (position: WatermarkPosition) => {
  currentPosition.value = position
  textConfig.value.position = position
  imageConfig.value.position = position
  updatePreview()
}

// 更新预览
const updatePreview = async () => {
  if (!sourceFile.value) return

  try {
    isProcessing.value = true
    const img = await loadImage(sourceFile.value)

    let blob: Blob

    if (watermarkType.value === 'text') {
      const config: TextWatermarkConfig = {
        ...textConfig.value,
        position: currentPosition.value,
        tiled: tiledMode.value,
        spacing: tiledMode.value ? spacing.value : undefined,
      }
      blob = await addTextWatermark(img, config)
    } else {
      if (!watermarkFile.value) {
        isProcessing.value = false
        return
      }
      const config: ImageWatermarkConfig = {
        imageFile: watermarkFile.value,
        ...imageConfig.value,
        position: currentPosition.value,
        tiled: tiledMode.value,
        spacing: tiledMode.value ? spacing.value : undefined,
      }
      blob = await addImageWatermark(img, config)
    }

    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
    }
    previewUrl.value = URL.createObjectURL(blob)
  } catch (error) {
    showToast('预览生成失败', 'error')
    console.error(error)
  } finally {
    isProcessing.value = false
  }
}

// 下载结果
const downloadResult = () => {
  if (!previewUrl.value || !sourceFile.value) return

  fetch(previewUrl.value)
    .then((res) => res.blob())
    .then((blob) => {
      const filename = `${getFileNameWithoutExt(sourceFile.value!.name)}_watermark.png`
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
  watermarkFile.value = undefined
  previewUrl.value = ''
  textConfig.value.text = '水印文字'
  showToast('已清空', 'info')
}

// 监听水印类型变化
watch(watermarkType, () => {
  updatePreview()
})
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

/* 两栏布局 */
.two-column-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

/* 左侧配置面板 */
.config-panel {
  background: var(--color-background-soft);
  border-radius: 12px;
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 1rem;
}

.config-panel h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-heading);
}

.setting-item {
  margin-bottom: 1.5rem;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  font-weight: 500;
  color: var(--color-text);
}

.setting-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin-right: 0.5rem;
}

.setting-value {
  font-size: 0.875rem;
  color: var(--color-primary);
}

.text-input,
.select-input,
.file-input {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.9375rem;
}

.color-input {
  width: 100%;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--color-border);
  outline: none;
  cursor: pointer;
}

.watermark-type-selector {
  display: flex;
  gap: 0.75rem;
}

.type-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn:hover {
  border-color: var(--color-primary);
}

.type-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.position-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.position-btn {
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.position-btn:hover {
  border-color: var(--color-primary);
}

.position-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.file-info {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

/* 右侧预览面板 */
.preview-panel {
  background: var(--color-background-soft);
  border-radius: 12px;
  padding: 1.5rem;
  min-height: 400px;
}

.preview-panel h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-heading);
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 350px;
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  color: var(--color-text-light);
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.preview-placeholder p {
  margin: 0;
  font-size: 0.875rem;
}

.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 350px;
  border-radius: 8px;
  background: var(--color-background);
}

.preview-image {
  max-width: 100%;
  max-height: 600px;
  border-radius: 8px;
  object-fit: contain;
}

/* 响应式：小屏幕改为单栏 */
@media (max-width: 1024px) {
  .two-column-layout {
    grid-template-columns: 1fr;
  }

  .config-panel {
    position: static;
  }
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
