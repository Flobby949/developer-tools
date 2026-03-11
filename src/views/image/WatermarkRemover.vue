<template>
  <ToolPanel title="去水印工具" description="手动擦除、模糊或马赛克处理图片水印，支持AI智能去水印">
    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="tool-group">
        <button @click="clearAll" class="btn btn-error" :disabled="!sourceFile">
          <span class="btn-icon">🗑️</span>
          清空
        </button>
        <button @click="undo" class="btn" :disabled="!canUndo">
          <span class="btn-icon">↶</span>
          撤销
        </button>
        <button @click="redo" class="btn" :disabled="!canRedo">
          <span class="btn-icon">↷</span>
          重做
        </button>
        <button
          @click="downloadResult"
          class="btn btn-success"
          :disabled="!hasEdits || isProcessing"
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

    <!-- 工具设置 -->
    <div v-if="sourceFile" class="settings-section">
      <h3>去水印工具</h3>

      <!-- 工具选择 -->
      <div class="setting-item">
        <label class="setting-label">选择工具</label>
        <div class="tool-selector">
          <button
            class="tool-btn"
            :class="{ active: currentTool === 'erase' }"
            @click="currentTool = 'erase'"
          >
            🧹 擦除
          </button>
          <button
            class="tool-btn"
            :class="{ active: currentTool === 'blur' }"
            @click="currentTool = 'blur'"
          >
            🌫️ 模糊
          </button>
          <button
            class="tool-btn"
            :class="{ active: currentTool === 'mosaic' }"
            @click="currentTool = 'mosaic'"
          >
            🔲 马赛克
          </button>
        </div>
      </div>

      <!-- 强度设置 -->
      <div v-if="currentTool !== 'erase'" class="setting-item">
        <label class="setting-label">
          强度
          <span class="setting-value">{{ intensity }}</span>
        </label>
        <input
          type="range"
          v-model.number="intensity"
          :min="currentTool === 'blur' ? 1 : 2"
          :max="currentTool === 'blur' ? 10 : 20"
          step="1"
          class="slider"
        />
      </div>

      <!-- AI 去水印 -->
      <div class="setting-item">
        <button @click="showAIPlaceholder" class="btn btn-ai">
          <span class="btn-icon">✨</span>
          AI 智能去水印（开发中）
        </button>
      </div>

      <!-- 使用说明 -->
      <div class="setting-item">
        <div class="usage-tips">
          <h4>使用说明：</h4>
          <ol>
            <li>选择工具（擦除/模糊/马赛克）</li>
            <li>在下方预览区域拖拽鼠标框选水印区域</li>
            <li>松开鼠标后自动应用效果</li>
            <li>可多次操作，支持撤销/重做</li>
          </ol>
        </div>
      </div>
    </div>

    <!-- 编辑区域 -->
    <div v-if="sourceFile" class="editor-section">
      <h3>编辑区域</h3>
      <div class="editor-container">
        <div
          class="canvas-wrapper"
          @mousedown="startSelection"
          @mousemove="updateSelection"
          @mouseup="endSelection"
          @mouseleave="cancelSelection"
        >
          <canvas ref="editorCanvas" class="editor-canvas"></canvas>
          <div
            v-if="isSelecting"
            class="selection-box"
            :style="{
              left: Math.min(selectionStart.x, selectionEnd.x) + 'px',
              top: Math.min(selectionStart.y, selectionEnd.y) + 'px',
              width: Math.abs(selectionEnd.x - selectionStart.x) + 'px',
              height: Math.abs(selectionEnd.y - selectionStart.y) + 'px',
            }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Toast 通知 -->
    <Teleport to="body">
      <div v-if="toast.show" class="toast" :class="`toast-${toast.type}`">
        {{ toast.message }}
      </div>
    </Teleport>
  </ToolPanel>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'
import {
  loadImage,
  formatFileSize,
  downloadBlob,
  getFileNameWithoutExt,
  eraseArea,
  blurArea,
  mosaicArea,
} from '@/utils/imageUtils'
import type { RemovalTool, RemovalArea } from '@/types'

// 文件相关
const fileInput = ref<HTMLInputElement>()
const sourceFile = ref<File>()
const sourcePreviewUrl = ref('')
const sourceDimensions = ref<{ width: number; height: number }>()
const isDragOver = ref(false)

// 工具设置
const currentTool = ref<RemovalTool>('erase')
const intensity = ref(5)

// Canvas 相关
const editorCanvas = ref<HTMLCanvasElement>()
const sourceImage = ref<HTMLImageElement>()
const currentImageData = ref<ImageData>()

// 选择区域
const isSelecting = ref(false)
const selectionStart = ref({ x: 0, y: 0 })
const selectionEnd = ref({ x: 0, y: 0 })

// 历史记录
const history = ref<ImageData[]>([])
const historyIndex = ref(-1)

const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)
const hasEdits = computed(() => history.value.length > 1)

// 处理状态
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

    // 重置历史记录
    history.value = []
    historyIndex.value = -1

    await nextTick()
    initCanvas()
    showToast('图片加载成功', 'success')
  } catch (error) {
    showToast('图片加载失败', 'error')
    console.error(error)
  }
}

// 初始化 Canvas
const initCanvas = () => {
  if (!editorCanvas.value || !sourceImage.value) return

  const canvas = editorCanvas.value
  const img = sourceImage.value

  // 设置 Canvas 尺寸
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 绘制原图
  ctx.drawImage(img, 0, 0)

  // 保存初始状态
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  currentImageData.value = imageData
  saveToHistory(imageData)
}

// 保存到历史记录
const saveToHistory = (imageData: ImageData) => {
  // 删除当前索引之后的历史
  history.value = history.value.slice(0, historyIndex.value + 1)

  // 添加新状态
  const copy = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  )
  history.value.push(copy)
  historyIndex.value = history.value.length - 1

  // 限制历史记录数量
  if (history.value.length > 20) {
    history.value.shift()
    historyIndex.value--
  }
}

// 撤销
const undo = () => {
  if (!canUndo.value) return

  historyIndex.value--
  restoreFromHistory()
}

// 重做
const redo = () => {
  if (!canRedo.value) return

  historyIndex.value++
  restoreFromHistory()
}

// 从历史记录恢复
const restoreFromHistory = () => {
  if (!editorCanvas.value) return

  const imageData = history.value[historyIndex.value]
  const ctx = editorCanvas.value.getContext('2d')
  if (!ctx) return

  ctx.putImageData(imageData, 0, 0)
  currentImageData.value = imageData
}

// 开始选择
const startSelection = (event: MouseEvent) => {
  if (!editorCanvas.value) return

  const rect = editorCanvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  isSelecting.value = true
  selectionStart.value = { x, y }
  selectionEnd.value = { x, y }
}

// 更新选择
const updateSelection = (event: MouseEvent) => {
  if (!isSelecting.value || !editorCanvas.value) return

  const rect = editorCanvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  selectionEnd.value = { x, y }
}

// 结束选择
const endSelection = async () => {
  if (!isSelecting.value || !editorCanvas.value || !currentImageData.value) return

  isSelecting.value = false

  // 计算选择区域
  const x = Math.min(selectionStart.value.x, selectionEnd.value.x)
  const y = Math.min(selectionStart.value.y, selectionEnd.value.y)
  const width = Math.abs(selectionEnd.value.x - selectionStart.value.x)
  const height = Math.abs(selectionEnd.value.y - selectionStart.value.y)

  // 忽略太小的选择
  if (width < 5 || height < 5) return

  try {
    isProcessing.value = true

    const area: RemovalArea = {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
      tool: currentTool.value,
      intensity: intensity.value,
    }

    // 应用工具
    let newImageData: ImageData
    const imageData = new ImageData(
      new Uint8ClampedArray(currentImageData.value.data),
      currentImageData.value.width,
      currentImageData.value.height
    )

    switch (currentTool.value) {
      case 'erase':
        newImageData = eraseArea(imageData, area)
        break
      case 'blur':
        newImageData = blurArea(imageData, area)
        break
      case 'mosaic':
        newImageData = mosaicArea(imageData, area)
        break
    }

    // 更新 Canvas
    const ctx = editorCanvas.value.getContext('2d')
    if (!ctx) return

    ctx.putImageData(newImageData, 0, 0)
    currentImageData.value = newImageData
    saveToHistory(newImageData)

    showToast('处理成功', 'success')
  } catch (error) {
    showToast('处理失败', 'error')
    console.error(error)
  } finally {
    isProcessing.value = false
  }
}

// 取消选择
const cancelSelection = () => {
  isSelecting.value = false
}

// 显示 AI 占位符
const showAIPlaceholder = () => {
  showToast('AI 智能去水印功能正在开发中，敬请期待！', 'info')
}

// 下载结果
const downloadResult = () => {
  if (!editorCanvas.value || !sourceFile.value) return

  editorCanvas.value.toBlob((blob) => {
    if (!blob) {
      showToast('导出失败', 'error')
      return
    }

    const filename = `${getFileNameWithoutExt(sourceFile.value!.name)}_removed.png`
    downloadBlob(blob, filename)
    showToast('下载成功', 'success')
  })
}

// 清空
const clearAll = () => {
  sourceFile.value = undefined
  sourcePreviewUrl.value = ''
  sourceDimensions.value = undefined
  sourceImage.value = undefined
  currentImageData.value = undefined
  history.value = []
  historyIndex.value = -1
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
  background: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-success {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
}

.btn-error {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.btn-error:hover:not(:disabled) {
  background: #dc2626;
}

.btn-ai {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.btn-ai:hover:not(:disabled) {
  opacity: 0.9;
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
  align-items: center;
  gap: 1.5rem;
  width: 100%;
}

.source-preview {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  object-fit: contain;
}

.source-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  font-weight: 500;
  color: var(--color-text);
}

.setting-value {
  font-size: 0.875rem;
  color: var(--color-primary);
}

.tool-selector {
  display: flex;
  gap: 0.75rem;
}

.tool-btn {
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

.tool-btn:hover {
  border-color: var(--color-primary);
}

.tool-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--color-border);
  outline: none;
  cursor: pointer;
}

.usage-tips {
  padding: 1rem;
  background: var(--color-background);
  border-radius: 8px;
  border-left: 4px solid var(--color-primary);
}

.usage-tips h4 {
  margin-bottom: 0.75rem;
  font-size: 0.9375rem;
  font-weight: 600;
}

.usage-tips ol {
  margin-left: 1.25rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.editor-section {
  margin-bottom: 2rem;
}

.editor-section h3 {
  margin-bottom: 1rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.editor-container {
  padding: 2rem;
  background: var(--color-background-soft);
  border-radius: 12px;
}

.canvas-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  cursor: crosshair;
}

.editor-canvas {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.selection-box {
  position: absolute;
  border: 2px solid var(--color-primary);
  background: rgba(16, 185, 129, 0.1);
  pointer-events: none;
}

.toast {
  position: fixed;
  top: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-weight: 500;
  z-index: 9999;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-success {
  color: #10b981;
  border-left: 4px solid #10b981;
}

.toast-error {
  color: #ef4444;
  border-left: 4px solid #ef4444;
}

.toast-info {
  color: #3b82f6;
  border-left: 4px solid #3b82f6;
}
</style>
