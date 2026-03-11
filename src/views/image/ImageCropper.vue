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
    <ImageUploader
      ref="uploaderRef"
      @file-selected="handleFileSelected"
      @error="showToast($event, 'error')"
    />

    <!-- 主工作区：左右布局 -->
    <div v-if="sourceFile" class="main-workspace">
      <!-- 左侧：裁切设置 -->
      <div class="settings-section">
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
              :disabled="!!croppedUrl"
              @click="selectRatio(ratio.value)"
            >
              {{ ratio.label }}
            </button>
          </div>
        </div>

        <!-- 保持宽高比 -->
        <div class="setting-item">
          <label class="setting-label">
            <input
              type="checkbox"
              v-model="maintainAspectRatio"
              :disabled="!!croppedUrl"
              class="aspect-ratio-checkbox"
            />
            <span>保持宽高比</span>
          </label>
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
                :disabled="!!croppedUrl"
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
                :disabled="!!croppedUrl"
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
                :disabled="!!croppedUrl"
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
                :disabled="!!croppedUrl"
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
            <button @click="applyCrop" class="action-btn btn-primary" :disabled="!!croppedUrl">
              应用裁切
            </button>
          </div>
        </div>

        <!-- 操作提示 -->
        <div class="operation-hint">
          <span class="hint-icon">💡</span>
          <span class="hint-text">拖动裁切框移动位置，拖动边角缩放大小</span>
        </div>
      </div>

      <!-- 右侧：预览区域 -->
      <div class="preview-section">
        <h3>预览</h3>
        <div class="preview-container">
          <div v-if="!croppedUrl" class="canvas-wrapper">
            <canvas ref="previewCanvas" class="preview-canvas"></canvas>
            <div
              class="crop-overlay"
              :style="{
                left: displayCropBox.left + 'px',
                top: displayCropBox.top + 'px',
                width: displayCropBox.width + 'px',
                height: displayCropBox.height + 'px',
              }"
              @mousedown="handleMouseDown"
            >
              <div class="crop-info">
                {{ cropConfig.width }} × {{ cropConfig.height }}
              </div>
              <!-- 缩放控制点 -->
              <div class="resize-handle resize-nw" @mousedown.stop="handleResizeStart($event, 'nw')"></div>
              <div class="resize-handle resize-n" @mousedown.stop="handleResizeStart($event, 'n')"></div>
              <div class="resize-handle resize-ne" @mousedown.stop="handleResizeStart($event, 'ne')"></div>
              <div class="resize-handle resize-e" @mousedown.stop="handleResizeStart($event, 'e')"></div>
              <div class="resize-handle resize-se" @mousedown.stop="handleResizeStart($event, 'se')"></div>
              <div class="resize-handle resize-s" @mousedown.stop="handleResizeStart($event, 's')"></div>
              <div class="resize-handle resize-sw" @mousedown.stop="handleResizeStart($event, 'sw')"></div>
              <div class="resize-handle resize-w" @mousedown.stop="handleResizeStart($event, 'w')"></div>
            </div>
          </div>
          <div v-if="croppedUrl" class="cropped-preview">
            <img :src="croppedUrl" alt="裁切结果" class="cropped-image" />
          </div>
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
import { ref, computed, watch, onMounted, nextTick, onUnmounted } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'
import ImageUploader from '@/components/ImageUploader.vue'
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
const uploaderRef = ref<InstanceType<typeof ImageUploader>>()
const sourceFile = ref<File>()
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
const maintainAspectRatio = ref(false) // 保持宽高比

// Canvas 相关
const previewCanvas = ref<HTMLCanvasElement>()
const sourceImage = ref<HTMLImageElement>()
const canvasScale = ref(1) // 预览缩放比例
const canvasOffset = ref({ x: 0, y: 0 }) // Canvas 偏移量

// 裁切结果
const croppedUrl = ref('')
const isProcessing = ref(false)

// 拖拽状态
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

// 缩放状态
const isResizing = ref(false)
const resizeDirection = ref<string>('')
const resizeStart = ref({ x: 0, y: 0, cropX: 0, cropY: 0, cropWidth: 0, cropHeight: 0 })

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

// 处理文件选择
const handleFileSelected = async (file: File) => {
  try {
    sourceFile.value = file

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

  // 保存缩放比例，不修改原始 cropConfig
  canvasScale.value = scale

  // 计算 canvas 在容器中的偏移（居中显示）
  const wrapper = canvas.parentElement
  if (wrapper) {
    const wrapperWidth = wrapper.clientWidth
    canvasOffset.value.x = (wrapperWidth - canvas.width) / 2
    canvasOffset.value.y = 0
  }
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

  // 选择比例时自动启用保持宽高比
  if (ratio !== null) {
    maintainAspectRatio.value = true
  }

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
  maintainAspectRatio.value = false
  croppedUrl.value = ''

  // 重新绘制预览
  nextTick(() => {
    drawPreview()
  })
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
  uploaderRef.value?.clear()
  sourceFile.value = undefined
  sourceDimensions.value = undefined
  sourceImage.value = undefined
  croppedUrl.value = ''
  selectedRatio.value = null
  showToast('已清空', 'info')
}

// 计算显示用的裁切框位置和尺寸（考虑缩放和偏移）
const displayCropBox = computed(() => {
  const scale = canvasScale.value
  return {
    left: cropConfig.value.x * scale + canvasOffset.value.x,
    top: cropConfig.value.y * scale + canvasOffset.value.y,
    width: cropConfig.value.width * scale,
    height: cropConfig.value.height * scale,
  }
})

// 鼠标按下开始拖拽
const handleMouseDown = (e: MouseEvent) => {
  if (!previewCanvas.value) return

  isDragging.value = true
  const rect = previewCanvas.value.getBoundingClientRect()
  const scale = canvasScale.value

  // 计算鼠标在 canvas 中的位置（未缩放坐标）
  const mouseX = (e.clientX - rect.left - canvasOffset.value.x) / scale
  const mouseY = (e.clientY - rect.top - canvasOffset.value.y) / scale

  // 记录鼠标相对于裁切框左上角的偏移
  dragStart.value = {
    x: mouseX - cropConfig.value.x,
    y: mouseY - cropConfig.value.y,
  }
}

// 鼠标移动更新裁切框位置
const handleMouseMove = (e: MouseEvent) => {
  // 处理缩放
  if (isResizing.value) {
    handleResizeMove(e)
    return
  }

  // 处理拖拽
  if (!isDragging.value || !previewCanvas.value || !sourceDimensions.value) return

  const rect = previewCanvas.value.getBoundingClientRect()
  const scale = canvasScale.value

  // 计算鼠标在 canvas 中的位置（未缩放坐标）
  const mouseX = (e.clientX - rect.left - canvasOffset.value.x) / scale
  const mouseY = (e.clientY - rect.top - canvasOffset.value.y) / scale

  // 计算新的裁切框位置（保持鼠标相对位置不变）
  const newX = mouseX - dragStart.value.x
  const newY = mouseY - dragStart.value.y

  // 限制在图片范围内
  cropConfig.value.x = Math.max(
    0,
    Math.min(newX, sourceDimensions.value.width - cropConfig.value.width)
  )
  cropConfig.value.y = Math.max(
    0,
    Math.min(newY, sourceDimensions.value.height - cropConfig.value.height)
  )

  croppedUrl.value = ''
}

// 鼠标松开结束拖拽
const handleMouseUp = () => {
  isDragging.value = false
  isResizing.value = false
}

// 开始缩放
const handleResizeStart = (e: MouseEvent, direction: string) => {
  if (!previewCanvas.value) return

  isResizing.value = true
  resizeDirection.value = direction

  const rect = previewCanvas.value.getBoundingClientRect()
  const scale = canvasScale.value

  // 记录鼠标起始位置和裁切框初始状态
  resizeStart.value = {
    x: e.clientX,
    y: e.clientY,
    cropX: cropConfig.value.x,
    cropY: cropConfig.value.y,
    cropWidth: cropConfig.value.width,
    cropHeight: cropConfig.value.height,
  }
}

// 缩放移动
const handleResizeMove = (e: MouseEvent) => {
  if (!isResizing.value || !previewCanvas.value || !sourceDimensions.value) return

  const scale = canvasScale.value
  const deltaX = (e.clientX - resizeStart.value.x) / scale
  const deltaY = (e.clientY - resizeStart.value.y) / scale

  const direction = resizeDirection.value
  let newX = resizeStart.value.cropX
  let newY = resizeStart.value.cropY
  let newWidth = resizeStart.value.cropWidth
  let newHeight = resizeStart.value.cropHeight

  // 根据方向调整裁切框
  if (direction.includes('n')) {
    newY = resizeStart.value.cropY + deltaY
    newHeight = resizeStart.value.cropHeight - deltaY
  }
  if (direction.includes('s')) {
    newHeight = resizeStart.value.cropHeight + deltaY
  }
  if (direction.includes('w')) {
    newX = resizeStart.value.cropX + deltaX
    newWidth = resizeStart.value.cropWidth - deltaX
  }
  if (direction.includes('e')) {
    newWidth = resizeStart.value.cropWidth + deltaX
  }

  // 保持宽高比
  if (maintainAspectRatio.value && resizeStart.value.cropWidth > 0 && resizeStart.value.cropHeight > 0) {
    const aspectRatio = resizeStart.value.cropWidth / resizeStart.value.cropHeight

    if (direction === 'n' || direction === 's') {
      // 垂直调整，根据高度计算宽度
      newWidth = newHeight * aspectRatio
      if (direction === 'n') {
        newX = resizeStart.value.cropX - (newWidth - resizeStart.value.cropWidth) / 2
      }
    } else if (direction === 'e' || direction === 'w') {
      // 水平调整，根据宽度计算高度
      newHeight = newWidth / aspectRatio
      if (direction === 'w') {
        newY = resizeStart.value.cropY - (newHeight - resizeStart.value.cropHeight) / 2
      }
    } else {
      // 角落调整
      if (direction === 'nw' || direction === 'se') {
        // 左上或右下，以宽度为准
        newHeight = newWidth / aspectRatio
        if (direction === 'nw') {
          newY = resizeStart.value.cropY + resizeStart.value.cropHeight - newHeight
        }
      } else {
        // 右上或左下，以宽度为准
        newHeight = newWidth / aspectRatio
        if (direction === 'ne') {
          newY = resizeStart.value.cropY + resizeStart.value.cropHeight - newHeight
        }
      }
    }
  }

  // 限制最小尺寸
  const minSize = 10
  if (newWidth < minSize) {
    if (direction.includes('w')) {
      newX = resizeStart.value.cropX + resizeStart.value.cropWidth - minSize
    }
    newWidth = minSize
  }
  if (newHeight < minSize) {
    if (direction.includes('n')) {
      newY = resizeStart.value.cropY + resizeStart.value.cropHeight - minSize
    }
    newHeight = minSize
  }

  // 限制在图片范围内
  newX = Math.max(0, Math.min(newX, sourceDimensions.value.width - newWidth))
  newY = Math.max(0, Math.min(newY, sourceDimensions.value.height - newHeight))
  newWidth = Math.max(minSize, Math.min(newWidth, sourceDimensions.value.width - newX))
  newHeight = Math.max(minSize, Math.min(newHeight, sourceDimensions.value.height - newY))

  // 更新裁切配置
  cropConfig.value.x = Math.round(newX)
  cropConfig.value.y = Math.round(newY)
  cropConfig.value.width = Math.round(newWidth)
  cropConfig.value.height = Math.round(newHeight)

  croppedUrl.value = ''
}

// 监听全局鼠标事件
onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
})

// 清理事件监听
onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
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

.main-workspace {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.settings-section {
  flex: 0 0 320px;
  padding: 1.5rem;
  background: var(--color-background-soft);
  border-radius: 12px;
  height: fit-content;
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

.aspect-ratio-checkbox {
  margin-right: 0.5rem;
  cursor: pointer;
  width: 16px;
  height: 16px;
  vertical-align: middle;
}

.aspect-ratio-checkbox:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.ratio-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.ratio-btn {
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.ratio-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.ratio-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ratio-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.crop-inputs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
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

.input-group input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.action-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.operation-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--color-background);
  border-radius: 6px;
  margin-top: 1rem;
}

.hint-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.hint-text {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.preview-section {
  flex: 1;
  min-width: 0;
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
  min-height: 500px;
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
  cursor: move;
  user-select: none;
}

.crop-overlay:hover {
  background: rgba(16, 185, 129, 0.15);
  border-color: var(--color-primary-dark);
}

.crop-overlay:active {
  cursor: grabbing;
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

.resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: white;
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  z-index: 10;
}

.resize-handle:hover {
  background: var(--color-primary);
  transform: scale(1.2);
}

.resize-nw {
  top: -5px;
  left: -5px;
  cursor: nw-resize;
}

.resize-n {
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  cursor: n-resize;
}

.resize-ne {
  top: -5px;
  right: -5px;
  cursor: ne-resize;
}

.resize-e {
  top: 50%;
  right: -5px;
  transform: translateY(-50%);
  cursor: e-resize;
}

.resize-se {
  bottom: -5px;
  right: -5px;
  cursor: se-resize;
}

.resize-s {
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}

.resize-sw {
  bottom: -5px;
  left: -5px;
  cursor: sw-resize;
}

.resize-w {
  top: 50%;
  left: -5px;
  transform: translateY(-50%);
  cursor: w-resize;
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

/* 响应式布局 */
@media (max-width: 1024px) {
  .main-workspace {
    flex-direction: column;
  }

  .settings-section {
    flex: 1;
    width: 100%;
  }

  .crop-inputs {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 640px) {
  .crop-inputs {
    grid-template-columns: repeat(2, 1fr);
  }

  .ratio-selector {
    gap: 0.375rem;
  }

  .ratio-btn {
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
  }
}
</style>
