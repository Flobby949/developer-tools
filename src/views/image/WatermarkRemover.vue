<template>
  <ToolPanel title="去水印工具" description="AI智能检测并去除图片水印">
    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="tool-group">
        <button @click="clearAll" class="btn btn-error" :disabled="!sourceFile">
          <span class="btn-icon">🗑️</span>
          清空
        </button>
        <button
          @click="detectWatermarks"
          class="btn btn-primary"
          :disabled="!sourceFile || isDetecting"
        >
          <span class="btn-icon">🔍</span>
          {{ isDetecting ? '检测中...' : (currentStep === 'detected' ? '重新检测' : '检测水印') }}
        </button>
        <button
          @click="processWatermarks"
          class="btn btn-success"
          :disabled="selectedRegionIds.size === 0 || isProcessing"
        >
          <span class="btn-icon">✨</span>
          {{ isProcessing ? '处理中...' : '处理水印' }}
        </button>
        <button @click="downloadResult" class="btn btn-success" :disabled="!processedUrl">
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

    <!-- 主工作区 -->
    <div v-if="sourceFile" class="main-workspace">
      <!-- 左侧：检测设置 -->
      <div class="settings-section">
        <h3>检测设置</h3>

        <!-- 检测灵敏度 -->
        <div class="setting-item">
          <label class="setting-label">
            检测灵敏度
            <span class="setting-value">{{ Math.round(detectionConfig.sensitivity * 100) }}%</span>
          </label>
          <input
            type="range"
            v-model.number="detectionConfig.sensitivity"
            min="0"
            max="1"
            step="0.1"
            class="slider"
            :disabled="!sourceFile || isDetecting"
          />
        </div>

        <!-- 检测到的区域列表 -->
        <div v-if="detectedRegions.length > 0" class="regions-list">
          <div class="regions-header">
            <h4>检测到的区域 ({{ detectedRegions.length }})</h4>
            <div class="regions-actions">
              <button @click="selectAllRegions" class="btn-text">全选</button>
              <button @click="deselectAllRegions" class="btn-text">全不选</button>
            </div>
          </div>
          <div class="regions-items">
            <label v-for="region in detectedRegions" :key="region.id" class="region-item">
              <input
                type="checkbox"
                :checked="selectedRegionIds.has(region.id)"
                @change="toggleRegion(region.id)"
              />
              <span class="region-info">
                区域 {{ region.x }},{{ region.y }}
                <span class="region-confidence">{{ Math.round(region.confidence * 100) }}%</span>
              </span>
            </label>
          </div>
          <p class="regions-hint">提示: 百分比表示检测置信度，建议保留80%以上的区域</p>
        </div>

        <!-- 未检测到水印提示 -->
        <div v-else-if="currentStep === 'detected'" class="no-regions">
          <p>未检测到明显水印</p>
          <p class="hint">可以尝试调整灵敏度后重新检测</p>
        </div>
      </div>

      <!-- 右侧：图片预览区 -->
      <div class="preview-section">
        <h3>图片预览</h3>
        <div class="preview-container">
          <canvas
            ref="previewCanvas"
            class="preview-canvas"
            @click="handleCanvasClick"
          ></canvas>
          <p v-if="currentStep === 'detected'" class="preview-hint">点击标记可删除区域</p>
        </div>
      </div>
    </div>
  </ToolPanel>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import type { WatermarkRegion, DetectionConfig } from '@/types'
import { FrontendDetector, DEFAULT_DETECTION_CONFIG } from '@/services/watermarkDetection'
import { loadImage, eraseArea, downloadBlob } from '@/utils/imageUtils'

// 组件状态
const sourceFile = ref<File | null>(null)
const sourceImage = ref<HTMLImageElement | null>(null)
const originalImage = ref<HTMLImageElement | null>(null) // 保存原始图片
const sourceDimensions = ref<{ width: number; height: number } | null>(null)

const isDetecting = ref(false)
const detectedRegions = ref<WatermarkRegion[]>([])
const selectedRegionIds = ref<Set<string>>(new Set())
const detectionConfig = reactive<DetectionConfig>({ ...DEFAULT_DETECTION_CONFIG })

const isProcessing = ref(false)
const processedBlob = ref<Blob | null>(null)
const processedUrl = ref<string | null>(null)

const currentStep = ref<'uploaded' | 'detected' | 'processed'>('uploaded')

const uploaderRef = ref<InstanceType<typeof ImageUploader> | null>(null)
const previewCanvas = ref<HTMLCanvasElement | null>(null)

const detector = new FrontendDetector()

// 处理文件选择
async function handleFileSelected(file: File) {
  try {
    sourceFile.value = file
    const img = await loadImage(file)
    sourceImage.value = img
    originalImage.value = img // 保存原始图片引用
    sourceDimensions.value = { width: img.width, height: img.height }

    currentStep.value = 'uploaded'
    detectedRegions.value = []
    selectedRegionIds.value.clear()
    processedBlob.value = null
    processedUrl.value = null

    drawPreview()
    showToast('图片加载成功', 'success')
  } catch (error) {
    showToast('图片加载失败', 'error')
  }
}

// 绘制预览
function drawPreview() {
  if (!previewCanvas.value || !sourceImage.value) return

  const canvas = previewCanvas.value
  const img = sourceImage.value

  // 设置canvas尺寸
  const maxWidth = 800
  const scale = Math.min(1, maxWidth / img.width)
  canvas.width = img.width * scale
  canvas.height = img.height * scale

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 绘制图片
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  // 绘制检测区域
  if (currentStep.value === 'detected' && detectedRegions.value.length > 0) {
    detectedRegions.value.forEach((region) => {
      const isSelected = selectedRegionIds.value.has(region.id)
      ctx.strokeStyle = isSelected ? 'rgba(239, 68, 68, 0.8)' : 'rgba(156, 163, 175, 0.6)'
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.fillStyle = isSelected ? 'rgba(239, 68, 68, 0.1)' : 'rgba(156, 163, 175, 0.05)'

      const x = region.x * scale
      const y = region.y * scale
      const w = region.width * scale
      const h = region.height * scale

      ctx.fillRect(x, y, w, h)
      ctx.strokeRect(x, y, w, h)
    })
  }
}

// 检测水印
async function detectWatermarks() {
  if (!originalImage.value) return

  isDetecting.value = true

  try {
    // 重置为原始图片
    sourceImage.value = originalImage.value

    // 创建临时canvas获取ImageData
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = originalImage.value.width
    tempCanvas.height = originalImage.value.height
    const ctx = tempCanvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context creation failed')

    ctx.drawImage(originalImage.value, 0, 0)
    const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)

    // 执行检测
    const regions = await detector.detect(imageData, detectionConfig)

    detectedRegions.value = regions
    selectedRegionIds.value = new Set(regions.map((r) => r.id))
    currentStep.value = 'detected'

    drawPreview()

    if (regions.length === 0) {
      showToast('未检测到明显水印，可手动调整灵敏度', 'info')
    } else {
      showToast(`检测到 ${regions.length} 个可能的水印区域`, 'success')
    }
  } catch (error) {
    showToast('检测失败，请重试', 'error')
  } finally {
    isDetecting.value = false
  }
}

// 切换区域选择
function toggleRegion(regionId: string) {
  if (selectedRegionIds.value.has(regionId)) {
    selectedRegionIds.value.delete(regionId)
  } else {
    selectedRegionIds.value.add(regionId)
  }
  drawPreview()
}

// 全选/全不选
function selectAllRegions() {
  selectedRegionIds.value = new Set(detectedRegions.value.map((r) => r.id))
  drawPreview()
}

function deselectAllRegions() {
  selectedRegionIds.value.clear()
  drawPreview()
}

// 处理水印
async function processWatermarks() {
  if (!sourceImage.value || selectedRegionIds.value.size === 0) return

  isProcessing.value = true

  try {
    // 创建处理canvas
    const canvas = document.createElement('canvas')
    canvas.width = sourceImage.value.width
    canvas.height = sourceImage.value.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context creation failed')

    // 绘制原图
    ctx.drawImage(sourceImage.value, 0, 0)

    // 获取ImageData
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // 对每个选中区域应用擦除
    const selectedRegions = detectedRegions.value.filter((r) =>
      selectedRegionIds.value.has(r.id)
    )
    for (const region of selectedRegions) {
      // 转换为 RemovalArea 类型
      const removalArea = {
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height,
        tool: 'erase' as const
      }
      imageData = eraseArea(imageData, removalArea)
    }

    // 写回canvas
    ctx.putImageData(imageData, 0, 0)

    // 导出为Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('导出失败'))
        },
        'image/png',
        1
      )
    })

    processedBlob.value = blob
    processedUrl.value = URL.createObjectURL(blob)
    currentStep.value = 'processed'

    // 更新预览
    const processedImg = await loadImage(blob)
    sourceImage.value = processedImg
    drawPreview()

    showToast('处理完成', 'success')
  } catch (error) {
    showToast('处理失败，请重试', 'error')
  } finally {
    isProcessing.value = false
  }
}

// 下载结果
function downloadResult() {
  if (!processedBlob.value || !sourceFile.value) return

  const filename = sourceFile.value.name.replace(/\.[^.]+$/, '-removed.png')
  downloadBlob(processedBlob.value, filename)
  showToast('下载成功', 'success')
}

// 清空
function clearAll() {
  sourceFile.value = null
  sourceImage.value = null
  originalImage.value = null
  sourceDimensions.value = null
  detectedRegions.value = []
  selectedRegionIds.value.clear()
  processedBlob.value = null
  processedUrl.value = null
  currentStep.value = 'uploaded'

  if (uploaderRef.value) {
    uploaderRef.value.clear()
  }
}

// Canvas点击处理
function handleCanvasClick(event: MouseEvent) {
  if (currentStep.value !== 'detected' || !previewCanvas.value) return

  const canvas = previewCanvas.value
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = (event.clientX - rect.left) * scaleX
  const y = (event.clientY - rect.top) * scaleY

  // 查找点击的区域
  const scale = canvas.width / (sourceImage.value?.width || 1)
  for (const region of detectedRegions.value) {
    const rx = region.x * scale
    const ry = region.y * scale
    const rw = region.width * scale
    const rh = region.height * scale

    if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) {
      toggleRegion(region.id)
      break
    }
  }
}

// Toast提示
function showToast(message: string, type: 'success' | 'error' | 'info') {
  // 实现Toast提示
  console.log(`[${type}] ${message}`)
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
  margin: 0 0 1.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-heading);
}

.setting-item {
  margin-bottom: 1.5rem;
}

.setting-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-weight: 500;
  color: var(--color-text);
  font-size: 0.9375rem;
}

.setting-value {
  font-weight: 600;
  color: var(--color-primary);
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--color-border);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}

.slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.regions-list {
  margin-top: 1.5rem;
}

.regions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.regions-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
}

.regions-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-text {
  padding: 0.25rem 0.5rem;
  border: none;
  background: none;
  color: var(--color-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-text:hover {
  text-decoration: underline;
}

.regions-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
  background: var(--color-background);
  border-radius: 6px;
}

.region-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-background-soft);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.region-item:hover {
  background: var(--color-background-mute);
}

.region-item input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.region-info {
  flex: 1;
  font-size: 0.875rem;
  color: var(--color-text);
}

.region-confidence {
  margin-left: 0.5rem;
  padding: 0.125rem 0.5rem;
  background: var(--color-primary);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 4px;
}

.regions-hint {
  margin-top: 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.no-regions {
  padding: 2rem 1rem;
  text-align: center;
  background: var(--color-background);
  border-radius: 6px;
  margin-top: 1.5rem;
}

.no-regions p {
  margin: 0 0 0.5rem 0;
  color: var(--color-text);
}

.no-regions .hint {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.preview-section {
  flex: 1;
  min-width: 0;
}

.preview-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-heading);
}

.preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: var(--color-background-soft);
  border-radius: 12px;
  min-height: 500px;
}

.preview-canvas {
  max-width: 100%;
  max-height: 600px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.preview-hint {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}
</style>
