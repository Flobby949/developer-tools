<template>
  <ToolPanel title="二维码工具" description="生成和解析二维码，支持自定义颜色、容错级别等参数">
    <!-- 功能切换选项卡 -->
    <div class="tabs-container">
      <div class="tabs-header">
        <button
          @click="activeTab = 'generate'"
          :class="['tab-btn', { active: activeTab === 'generate' }]"
        >
          <span class="tab-icon">🔲</span>
          生成二维码
        </button>
        <button
          @click="activeTab = 'parse'"
          :class="['tab-btn', { active: activeTab === 'parse' }]"
        >
          <span class="tab-icon">📷</span>
          解析二维码
        </button>
      </div>
    </div>

    <!-- 生成二维码面板 -->
    <div v-if="activeTab === 'generate'" class="panel-content">
      <div class="generate-layout">
        <!-- 输入和配置区域 -->
        <div class="input-section">
          <div class="input-group">
            <label class="input-label">输入内容</label>
            <textarea
              v-model="generateOptions.text"
              class="text-input"
              placeholder="请输入要生成二维码的内容，支持文本、URL、Wi-Fi信息等"
              rows="4"
            ></textarea>
          </div>

          <!-- 参数配置 -->
          <div class="config-section">
            <h4>生成参数</h4>
            <div class="config-grid">
              <div class="config-item">
                <label class="config-label">尺寸</label>
                <select v-model.number="generateOptions.width" class="config-select">
                  <option value="128">128px</option>
                  <option value="256">256px</option>
                  <option value="512">512px</option>
                  <option value="1024">1024px</option>
                </select>
              </div>

              <div class="config-item">
                <label class="config-label">容错级别</label>
                <select v-model="generateOptions.errorCorrectionLevel" class="config-select">
                  <option value="L">L级 (~7%)</option>
                  <option value="M">M级 (~15%)</option>
                  <option value="Q">Q级 (~25%)</option>
                  <option value="H">H级 (~30%)</option>
                </select>
              </div>

              <div class="config-item">
                <label class="config-label">前景色</label>
                <div class="color-input-group">
                  <input v-model="generateOptions.color!.dark" type="color" class="color-picker" />
                  <input
                    v-model="generateOptions.color!.dark"
                    type="text"
                    class="color-text"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div class="config-item">
                <label class="config-label">背景色</label>
                <div class="color-input-group">
                  <input v-model="generateOptions.color!.light" type="color" class="color-picker" />
                  <input
                    v-model="generateOptions.color!.light"
                    type="text"
                    class="color-text"
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              <div class="config-item">
                <label class="config-label">边距</label>
                <select v-model.number="generateOptions.margin" class="config-select">
                  <option value="0">无边距</option>
                  <option value="2">小边距</option>
                  <option value="4">标准边距</option>
                  <option value="8">大边距</option>
                </select>
              </div>

              <div class="config-item">
                <label class="config-label">图片格式</label>
                <select v-model="generateOptions.type" class="config-select">
                  <option value="image/png">PNG</option>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/webp">WebP</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <button
              @click="generateQRCode"
              :disabled="!generateOptions.text.trim() || isGenerating"
              class="btn btn-primary"
            >
              <span v-if="isGenerating" class="btn-icon">⏳</span>
              <span v-else class="btn-icon">🔲</span>
              {{ isGenerating ? '生成中...' : '生成二维码' }}
            </button>
            <button @click="clearGenerate" class="btn btn-secondary">
              <span class="btn-icon">🗑️</span>
              清空
            </button>
          </div>
        </div>

        <!-- 预览区域 -->
        <div class="preview-section">
          <div class="preview-container">
            <h4>预览</h4>
            <div v-if="generatedQRCode" class="qr-preview">
              <img :src="generatedQRCode" alt="生成的二维码" class="qr-image" />
              <div class="preview-actions">
                <button @click="downloadQRCode" class="btn btn-success">
                  <span class="btn-icon">💾</span>
                  下载
                </button>
                <button @click="copyQRCodeToClipboard" class="btn btn-info">
                  <span class="btn-icon">📋</span>
                  复制
                </button>
              </div>
            </div>
            <div v-else class="qr-placeholder">
              <span class="placeholder-icon">🔲</span>
              <p>输入内容并点击生成二维码</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 解析二维码面板 -->
    <div v-if="activeTab === 'parse'" class="panel-content">
      <div class="parse-layout">
        <!-- 上传区域 -->
        <div class="upload-section">
          <h4>上传二维码图片</h4>
          <div
            ref="uploadContainer"
            @drop="handleFileDrop"
            @dragover.prevent="handleDragOver"
            @dragenter.prevent="handleDragOver"
            @dragleave="handleDragLeave"
            class="upload-area"
            :class="{ 'drag-over': isDragOver }"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="handleFileSelect"
              class="file-input"
            />
            <div v-if="uploadedImage" class="uploaded-image">
              <img :src="uploadedImage" alt="上传的图片" class="preview-img" />
              <button @click="clearUpload" class="clear-btn">✕</button>
            </div>
            <div v-else class="upload-prompt">
              <span class="upload-icon">📷</span>
              <p>拖拽图片到此处或点击上传</p>
              <p class="upload-hint">支持 PNG、JPG、WebP 格式</p>
              <p class="paste-hint">📋 也可使用 <kbd>Ctrl+V</kbd> 粘贴图片</p>
              <button @click="triggerFileSelect" class="btn btn-primary">
                <span class="btn-icon">📁</span>
                选择文件
              </button>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <button
              @click="parseUploadedQRCode"
              :disabled="!uploadedImage || isParsing"
              class="btn btn-primary"
            >
              <span v-if="isParsing" class="btn-icon">⏳</span>
              <span v-else class="btn-icon">🔍</span>
              {{ isParsing ? '解析中...' : '解析二维码' }}
            </button>
          </div>
        </div>

        <!-- 解析结果 -->
        <div class="result-section">
          <h4>解析结果</h4>
          <div v-if="parseResult" class="result-container">
            <CodeEditor
              v-model="parseResult"
              language="text"
              title="二维码内容"
              height="200px"
              :show-clear="false"
              :show-copy="true"
            />
            <div class="result-info">
              <p class="result-stats">
                <span>内容长度: {{ parseResult.length }}</span>
                <span>类型: {{ getContentType(parseResult) }}</span>
              </p>
            </div>
          </div>
          <div v-else class="result-placeholder">
            <span class="placeholder-icon">📋</span>
            <p>上传并解析二维码图片查看内容</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速示例 -->
    <div class="examples-section">
      <h3>快速示例</h3>
      <div class="examples-grid">
        <div class="example-card">
          <h4>网址链接</h4>
          <p class="example-desc">生成网站链接二维码</p>
          <button @click="loadUrlExample" class="example-btn">使用此示例</button>
        </div>
        <div class="example-card">
          <h4>联系信息</h4>
          <p class="example-desc">生成vCard联系人信息</p>
          <button @click="loadContactExample" class="example-btn">使用此示例</button>
        </div>
        <div class="example-card">
          <h4>Wi-Fi配置</h4>
          <p class="example-desc">生成Wi-Fi连接配置</p>
          <button @click="loadWifiExample" class="example-btn">使用此示例</button>
        </div>
        <div class="example-card">
          <h4>纯文本</h4>
          <p class="example-desc">生成简单文本二维码</p>
          <button @click="loadTextExample" class="example-btn">使用此示例</button>
        </div>
      </div>
    </div>

    <!-- Toast通知 -->
    <div v-if="showToast" class="toast-notification" :class="`toast-${toastType}`">
      {{ toastMessage }}
    </div>
  </ToolPanel>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import {
  generateQRCode as generateQR,
  parseQRCodeFromFile,
  isValidColor,
  type QRCodeOptions,
} from '@/utils/qrcodeUtils'

// 响应式数据
const activeTab = ref<'generate' | 'parse'>('generate')
const isGenerating = ref(false)
const isParsing = ref(false)
const isDragOver = ref(false)
const generatedQRCode = ref('')
const uploadedImage = ref('')
const parseResult = ref('')
const fileInput = ref<HTMLInputElement>()
const uploadContainer = ref<HTMLElement>()

// Toast通知
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info'>('info')

// 生成参数
const generateOptions = reactive<QRCodeOptions>({
  text: '',
  width: 256,
  color: {
    dark: '#000000',
    light: '#ffffff',
  },
  errorCorrectionLevel: 'M',
  type: 'image/png',
  quality: 0.92,
  margin: 4,
})

// 显示Toast通知
const showToastMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true

  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// 生成二维码
const generateQRCode = async () => {
  if (!generateOptions.text.trim()) {
    showToastMessage('请输入要生成二维码的内容', 'error')
    return
  }

  // 验证颜色格式
  if (
    generateOptions.color &&
    (!isValidColor(generateOptions.color.dark!) || !isValidColor(generateOptions.color.light!))
  ) {
    showToastMessage('请输入有效的颜色值', 'error')
    return
  }

  isGenerating.value = true
  try {
    const result = await generateQR(generateOptions)
    generatedQRCode.value = result
    showToastMessage('二维码生成成功', 'success')
  } catch (error) {
    showToastMessage((error as Error).message, 'error')
  } finally {
    isGenerating.value = false
  }
}

// 清空生成相关内容
const clearGenerate = () => {
  generateOptions.text = ''
  generatedQRCode.value = ''
  showToastMessage('已清空内容', 'info')
}

// 下载二维码
const downloadQRCode = () => {
  if (!generatedQRCode.value) return

  const link = document.createElement('a')
  link.download = `qrcode-${Date.now()}.png`
  link.href = generatedQRCode.value
  link.click()
  showToastMessage('二维码已下载', 'success')
}

// 复制二维码到剪贴板
const copyQRCodeToClipboard = async () => {
  if (!generatedQRCode.value) return

  try {
    const response = await fetch(generatedQRCode.value)
    const blob = await response.blob()
    const item = new ClipboardItem({ [blob.type]: blob })
    await navigator.clipboard.write([item])
    showToastMessage('二维码已复制到剪贴板', 'success')
  } catch (error) {
    showToastMessage('复制失败：' + (error as Error).message, 'error')
  }
}

// 触发文件选择
const triggerFileSelect = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

// 处理文件拖拽
const handleFileDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false

  const files = event.dataTransfer?.files
  if (files?.[0]) {
    processFile(files[0])
  }
}

// 处理上传的文件
const processFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    showToastMessage('请选择图片文件', 'error')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// 处理剪贴板粘贴事件
const handlePaste = async (event: ClipboardEvent) => {
  event.preventDefault()

  const clipboardData = event.clipboardData
  if (!clipboardData) {
    showToastMessage('无法访问剪贴板', 'error')
    return
  }

  // 获取剪贴板中的文件
  const files = Array.from(clipboardData.files)
  const imageFile = files.find((file) => file.type.startsWith('image/'))

  if (imageFile) {
    processFile(imageFile)
    showToastMessage('已从剪贴板上传图片', 'success')
    return
  }

  // 尝试获取剪贴板中的图片数据（如果有）
  try {
    const items = Array.from(clipboardData.items)
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          processFile(file)
          showToastMessage('已从剪贴板上传图片', 'success')
          return
        }
      }
    }

    // 如果没有图片文件，检查是否有图片URL
    const text = clipboardData.getData('text')
    if (text && (text.startsWith('http') || text.startsWith('data:image/'))) {
      if (text.startsWith('data:image/')) {
        // 直接是base64图片数据
        uploadedImage.value = text
        showToastMessage('已从剪贴板加载图片', 'success')
      } else {
        // 图片URL，尝试加载
        try {
          const response = await fetch(text)
          const blob = await response.blob()
          if (blob.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onload = (e) => {
              uploadedImage.value = e.target?.result as string
              showToastMessage('已从剪贴板加载图片URL', 'success')
            }
            reader.readAsDataURL(blob)
          } else {
            showToastMessage('URL不是有效的图片链接', 'error')
          }
        } catch (error) {
          showToastMessage('图片URL加载失败：' + (error as Error).message, 'error')
        }
      }
      return
    }

    showToastMessage('剪贴板中没有可用的图片数据', 'info')
  } catch (error) {
    showToastMessage('读取剪贴板数据失败：' + (error as Error).message, 'error')
  }
}

// 清空上传
const clearUpload = () => {
  uploadedImage.value = ''
  parseResult.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 解析上传的二维码
const parseUploadedQRCode = async () => {
  if (!uploadedImage.value) {
    showToastMessage('请先上传二维码图片', 'error')
    return
  }

  isParsing.value = true
  try {
    // 将dataURL转换为File对象
    const response = await fetch(uploadedImage.value)
    const blob = await response.blob()
    const file = new File([blob], 'qrcode.png', { type: blob.type })

    const result = await parseQRCodeFromFile(file)
    parseResult.value = result
    showToastMessage('二维码解析成功', 'success')
  } catch (error) {
    showToastMessage((error as Error).message, 'error')
  } finally {
    isParsing.value = false
  }
}

// 获取内容类型
const getContentType = (content: string): string => {
  if (content.startsWith('http://') || content.startsWith('https://')) {
    return 'URL链接'
  }
  if (content.startsWith('WIFI:')) {
    return 'Wi-Fi配置'
  }
  if (content.startsWith('BEGIN:VCARD')) {
    return 'vCard联系人'
  }
  if (content.includes('@') && content.includes('.')) {
    return '邮箱地址'
  }
  if (/^\+?\d[\d\s()-]+$/.test(content)) {
    return '电话号码'
  }
  return '纯文本'
}

// 示例数据加载
const loadUrlExample = () => {
  generateOptions.text = 'https://github.com/Flobby949/developer-tools'
  activeTab.value = 'generate'
  showToastMessage('已加载URL示例', 'info')
}

const loadContactExample = () => {
  generateOptions.text = `BEGIN:VCARD
VERSION:3.0
FN:张三
ORG:开发公司
TEL:+86-138-0013-8000
EMAIL:zhangsan@example.com
URL:https://example.com
END:VCARD`
  activeTab.value = 'generate'
  showToastMessage('已加载联系人示例', 'info')
}

const loadWifiExample = () => {
  generateOptions.text = 'WIFI:T:WPA;S:MyWiFiNetwork;P:MyPassword123;H:false;;'
  activeTab.value = 'generate'
  showToastMessage('已加载Wi-Fi示例', 'info')
}

const loadTextExample = () => {
  generateOptions.text = '欢迎使用开发者工具集！这是一个功能强大的在线工具平台。'
  activeTab.value = 'generate'
  showToastMessage('已加载文本示例', 'info')
}

// 拖拽事件处理
const handleDragOver = () => {
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

// 监听页面粘贴事件
const setupPasteListener = () => {
  const handleGlobalPaste = (event: ClipboardEvent) => {
    // 只在解析页面时监听粘贴事件
    if (activeTab.value === 'parse') {
      handlePaste(event)
    }
  }

  document.addEventListener('paste', handleGlobalPaste)

  return () => {
    document.removeEventListener('paste', handleGlobalPaste)
  }
}

// 组件生命周期管理
let cleanupPasteListener: (() => void) | null = null

onMounted(() => {
  cleanupPasteListener = setupPasteListener()
})

onUnmounted(() => {
  if (cleanupPasteListener) {
    cleanupPasteListener()
  }
})
</script>

<style scoped>
/* 选项卡样式 */
.tabs-container {
  margin-bottom: 2rem;
}

.tabs-header {
  display: flex;
  gap: 1rem;
  border-bottom: 2px solid var(--color-border);
  margin-bottom: 2rem;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  color: var(--color-text-light);
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  transition: all 0.3s ease;
  position: relative;
}

.tab-btn.active {
  color: var(--color-primary);
  background: var(--color-background-soft);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-primary);
}

.tab-btn:hover:not(.active) {
  color: var(--color-text);
  background: var(--color-background-mute);
}

.tab-icon {
  font-size: 1.2rem;
}

/* 面板内容 */
.panel-content {
  margin-bottom: 2rem;
}

/* 生成二维码布局 */
.generate-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

/* 输入区域 */
.input-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.9rem;
}

.text-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
  background: var(--color-background);
  color: var(--color-text);
}

.text-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

/* 配置区域 */
.config-section h4 {
  margin: 0 0 1rem 0;
  color: var(--color-heading);
  font-size: 1rem;
}

.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.config-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-light);
}

.config-select {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.85rem;
}

.config-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.color-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.color-picker {
  width: 40px;
  height: 32px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
}

.color-text {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.85rem;
  font-family: monospace;
}

/* 预览区域 */
.preview-section {
  display: flex;
  flex-direction: column;
}

.preview-container {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  background: var(--color-background-soft);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  min-height: 300px;
}

.preview-container h4 {
  margin: 0;
  color: var(--color-heading);
  align-self: flex-start;
}

.qr-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.qr-image {
  max-width: 100%;
  height: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
}

.preview-actions {
  display: flex;
  gap: 1rem;
}

.qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--color-text-light);
  flex: 1;
  justify-content: center;
}

.placeholder-icon {
  font-size: 3rem;
  opacity: 0.5;
}

/* 解析布局 */
.parse-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

/* 上传区域 */
.upload-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.upload-section h4 {
  margin: 0;
  color: var(--color-heading);
}

.upload-area {
  border: 2px dashed var(--color-border);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area.drag-over {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.upload-area:hover {
  border-color: var(--color-primary);
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.uploaded-image {
  position: relative;
  max-width: 100%;
}

.preview-img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  box-shadow: var(--shadow-md);
}

.clear-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-danger);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--color-text-light);
}

.upload-icon {
  font-size: 3rem;
  opacity: 0.7;
}

.upload-hint {
  font-size: 0.85rem;
  opacity: 0.8;
  margin: 0;
}

.paste-hint {
  font-size: 0.8rem;
  opacity: 0.9;
  margin: 0.5rem 0;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.paste-hint kbd {
  background: var(--color-background-mute);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.2rem 0.4rem;
  font-size: 0.75rem;
  font-family: monospace;
  color: var(--color-text);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 结果区域 */
.result-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-section h4 {
  margin: 0;
  color: var(--color-heading);
}

.result-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-info {
  padding: 1rem;
  background: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.result-stats {
  display: flex;
  gap: 2rem;
  font-size: 0.85rem;
  color: var(--color-text-light);
  margin: 0;
}

.result-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--color-text-light);
  padding: 3rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background-soft);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding-top: 1rem;
}

/* 示例区域 */
.examples-section {
  margin-top: 3rem;
}

.examples-section h3 {
  margin: 0 0 1.5rem 0;
  color: var(--color-heading);
}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.example-card {
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background-soft);
  text-align: center;
  transition: all 0.3s ease;
}

.example-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.example-card h4 {
  margin: 0 0 0.5rem 0;
  color: var(--color-heading);
  font-size: 1rem;
}

.example-desc {
  font-size: 0.85rem;
  color: var(--color-text-light);
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.example-btn {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.example-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

/* Toast 通知 */
.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 1000;
  box-shadow: var(--shadow-lg);
  animation: slideIn 0.3s ease;
}

.toast-success {
  background: var(--color-success);
}

.toast-error {
  background: var(--color-danger);
}

.toast-info {
  background: var(--color-info);
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

/* 响应式设计 */
@media (max-width: 1024px) {
  .generate-layout,
  .parse-layout {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .config-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .tabs-header {
    flex-direction: column;
    gap: 0;
  }

  .tab-btn {
    border-radius: 0;
    justify-content: center;
  }

  .examples-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .preview-actions,
  .result-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .toast-notification {
    left: 20px;
    right: 20px;
  }

  .upload-area {
    padding: 1rem;
    min-height: 150px;
  }

  .preview-container {
    padding: 1rem;
  }
}
</style>
