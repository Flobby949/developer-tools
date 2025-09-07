<template>
  <ToolPanel title="Base64文件转换" description="支持图片和音频文件与Base64格式的相互转换">
    <!-- 操作工具栏 -->
    <div class="encode-toolbar">
      <div class="tool-group">
        <button @click="clearAll" class="btn btn-error">
          <span class="btn-icon">🗑️</span>
          清空
        </button>
      </div>
    </div>

    <!-- 转换模式选择 -->
    <div class="mode-selector">
      <button
        @click="conversionMode = 'fileToBase64'"
        :class="['mode-btn', { active: conversionMode === 'fileToBase64' }]"
      >
        <span class="mode-icon">📁→📝</span>
        文件转Base64
      </button>
      <button
        @click="conversionMode = 'base64ToFile'"
        :class="['mode-btn', { active: conversionMode === 'base64ToFile' }]"
      >
        <span class="mode-icon">📝→📁</span>
        Base64转文件
      </button>
    </div>

    <!-- 文件转Base64模式 -->
    <div v-if="conversionMode === 'fileToBase64'" class="conversion-section">
      <div class="file-upload-area" :class="{ compact: selectedFile }">
        <div
          @drop="handleFileDrop"
          @dragover.prevent
          @dragenter.prevent
          class="file-drop-zone"
          :class="{ 'drag-over': isDragOver, compact: selectedFile }"
        >
          <div class="upload-content">
            <span class="upload-icon" :class="{ small: selectedFile }">📎</span>
            <h3 v-if="!selectedFile">拖拽文件到此处或点击选择文件</h3>
            <h4 v-else>重新选择文件</h4>
            <p v-if="!selectedFile">
              支持格式：图片 (jpg, png, gif, bmp, webp) 和音频 (mp3, wav, ogg, m4a)
            </p>
            <input
              ref="fileInput"
              type="file"
              @change="handleFileSelect"
              accept="image/*,audio/*"
              style="display: none"
            />
            <button @click="selectFile" class="btn btn-primary">
              {{ selectedFile ? '重新选择' : '选择文件' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 文件信息 -->
      <div v-if="selectedFile" class="file-info">
        <h4>文件信息</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">文件名：</span>
            <span class="value">{{ selectedFile.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">文件类型：</span>
            <span class="value">{{ selectedFile.type }}</span>
          </div>
          <div class="info-item">
            <span class="label">文件大小：</span>
            <span class="value">{{ formatFileSize(selectedFile.size) }}</span>
          </div>
        </div>
        <button @click="convertFileToBase64" class="btn btn-success convert-btn">
          <span class="btn-icon">🔄</span>
          转换为Base64
        </button>
      </div>

      <!-- Base64结果 -->
      <div v-if="base64Result" class="result-section">
        <CodeEditor
          v-model="base64Result"
          language="text"
          title="Base64编码结果"
          height="300px"
          :show-clear="false"
          :show-copy="true"
        />
        <div class="result-info">
          <p>
            Data URL格式:
            <code>data:{{ selectedFile?.type }};base64,{{ base64Result.substring(0, 50) }}...</code>
          </p>
          <button @click="copyDataUrl" class="btn btn-secondary">
            <span class="btn-icon">📋</span>
            复制Data URL
          </button>
        </div>
      </div>
    </div>

    <!-- Base64转文件模式 -->
    <div v-if="conversionMode === 'base64ToFile'" class="conversion-section">
      <div class="input-section">
        <CodeEditor
          v-model="base64Input"
          language="text"
          title="Base64编码内容"
          placeholder="请输入Base64编码字符串或完整的Data URL..."
          height="200px"
          :show-clear="true"
          :show-copy="false"
        />
        <button
          @click="parseBase64"
          class="btn btn-primary parse-btn"
          :disabled="!base64Input.trim()"
        >
          <span class="btn-icon">🔍</span>
          解析Base64
        </button>
      </div>

      <!-- 解析结果 -->
      <div v-if="parsedFileInfo" class="parsed-info">
        <h4>解析结果</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">文件类型：</span>
            <span class="value">{{ parsedFileInfo.mimeType || '未知' }}</span>
          </div>
          <div class="info-item">
            <span class="label">文件大小：</span>
            <span class="value">{{ formatFileSize(parsedFileInfo.size) }}</span>
          </div>
          <div class="info-item">
            <span class="label">建议文件名：</span>
            <input v-model="suggestedFileName" class="filename-input" placeholder="输入文件名" />
          </div>
        </div>

        <!-- 预览区域 -->
        <div v-if="previewUrl" class="preview-section">
          <h5>文件预览</h5>
          <div class="preview-container">
            <img
              v-if="parsedFileInfo.mimeType?.startsWith('image/')"
              :src="previewUrl"
              alt="预览图片"
              class="preview-image"
            />
            <audio
              v-else-if="parsedFileInfo.mimeType?.startsWith('audio/')"
              :src="previewUrl"
              controls
              class="preview-audio"
            >
              您的浏览器不支持音频播放
            </audio>
          </div>
        </div>

        <button @click="downloadFile" class="btn btn-success download-btn">
          <span class="btn-icon">💾</span>
          下载文件
        </button>
      </div>
    </div>

    <!-- 状态信息 -->
    <div v-if="statusMessage" class="toast-notification" :class="`toast-${statusType}`">
      <span class="toast-icon">{{ getStatusIcon() }}</span>
      <span class="toast-message">{{ statusMessage }}</span>
      <button @click="hideStatus" class="toast-close">×</button>
    </div>

    <!-- 功能说明 -->
    <div class="info-section">
      <h3>功能说明</h3>
      <div class="info-grid">
        <div class="info-card">
          <h4>文件转Base64</h4>
          <ul>
            <li>支持拖拽上传或点击选择文件</li>
            <li>支持图片格式：JPG, PNG, GIF, BMP, WebP</li>
            <li>支持音频格式：MP3, WAV, OGG, M4A</li>
            <li>自动生成Data URL格式</li>
            <li>显示文件基本信息</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>Base64转文件</h4>
          <ul>
            <li>支持纯Base64字符串输入</li>
            <li>支持完整Data URL格式输入</li>
            <li>自动识别文件类型</li>
            <li>提供文件预览功能</li>
            <li>支持自定义文件名下载</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>应用场景</h4>
          <ul>
            <li><strong>邮件附件：</strong>将小文件嵌入邮件</li>
            <li><strong>Web开发：</strong>内联图片和音频资源</li>
            <li><strong>API传输：</strong>通过JSON传输文件数据</li>
            <li><strong>配置文件：</strong>在配置中存储小型资源</li>
            <li><strong>数据备份：</strong>文件数据的文本化存储</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>注意事项</h4>
          <ul>
            <li>文件大小建议不超过10MB</li>
            <li>Base64编码会增加约33%的数据大小</li>
            <li>大文件转换可能需要较长时间</li>
            <li>浏览器内存限制可能影响大文件处理</li>
          </ul>
        </div>
      </div>
    </div>
  </ToolPanel>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'
import CodeEditor from '@/components/CodeEditor.vue'

// 响应式数据
const conversionMode = ref<'fileToBase64' | 'base64ToFile'>('fileToBase64')
const selectedFile = ref<File | null>(null)
const base64Result = ref('')
const base64Input = ref('')
const parsedFileInfo = ref<{
  mimeType: string
  size: number
  data: string
} | null>(null)
const suggestedFileName = ref('')
const previewUrl = ref('')
const isDragOver = ref(false)
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')
const fileInput = ref<HTMLInputElement | null>(null)

// 支持的文件类型
const supportedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']
const supportedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']
const supportedTypes = [...supportedImageTypes, ...supportedAudioTypes]

// 显示状态消息
const showStatus = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  statusMessage.value = message
  statusType.value = type

  // 自动隐藏提示
  setTimeout(
    () => {
      statusMessage.value = ''
    },
    type === 'success' ? 2000 : 4000,
  )
}

// 手动隐藏状态消息
const hideStatus = () => {
  statusMessage.value = ''
}

// 获取状态图标
const getStatusIcon = (): string => {
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  }
  return icons[statusType.value] || 'ℹ️'
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 验证文件类型
const isFileSupported = (file: File): boolean => {
  return supportedTypes.includes(file.type)
}

// 选择文件
const selectFile = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processSelectedFile(file)
  }
}

// 处理文件拖拽
const handleFileDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false

  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    processSelectedFile(files[0])
  }
}

// 处理选中的文件
const processSelectedFile = (file: File) => {
  if (!isFileSupported(file)) {
    showStatus('不支持的文件类型，请选择图片或音频文件', 'error')
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    // 10MB限制
    showStatus('文件大小超过10MB，建议选择更小的文件', 'error')
    return
  }

  selectedFile.value = file
  base64Result.value = ''
  showStatus('文件选择成功', 'success')
}

// 文件转Base64
const convertFileToBase64 = () => {
  if (!selectedFile.value) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    // 移除Data URL前缀，只保留Base64部分
    const base64Data = result.split(',')[1]
    base64Result.value = base64Data
    showStatus('文件转换成功', 'success')
  }
  reader.onerror = () => {
    showStatus('文件读取失败', 'error')
  }
  reader.readAsDataURL(selectedFile.value)
}

// 复制Data URL
const copyDataUrl = () => {
  if (!selectedFile.value || !base64Result.value) return

  const dataUrl = `data:${selectedFile.value.type};base64,${base64Result.value}`
  navigator.clipboard
    .writeText(dataUrl)
    .then(() => {
      showStatus('Data URL已复制到剪贴板', 'success')
    })
    .catch(() => {
      showStatus('复制失败，请手动复制', 'error')
    })
}

// 解析Base64
const parseBase64 = () => {
  if (!base64Input.value.trim()) return

  try {
    let base64Data = base64Input.value.trim()
    let mimeType = ''

    // 检查是否是Data URL格式
    if (base64Data.startsWith('data:')) {
      const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/)
      if (matches) {
        mimeType = matches[1]
        base64Data = matches[2]
      } else {
        throw new Error('无效的Data URL格式')
      }
    }

    // 验证Base64格式
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // 如果没有MIME类型，尝试从文件头判断
    if (!mimeType) {
      mimeType = detectMimeType(bytes)
    }

    parsedFileInfo.value = {
      mimeType,
      size: bytes.length,
      data: base64Data,
    }

    // 生成建议文件名
    const extension = getFileExtension(mimeType)
    suggestedFileName.value = `converted_file${extension}`

    // 生成预览URL
    const blob = new Blob([bytes], { type: mimeType })
    previewUrl.value = URL.createObjectURL(blob)

    showStatus('Base64解析成功', 'success')
  } catch (error) {
    showStatus('Base64解析失败：' + (error as Error).message, 'error')
    parsedFileInfo.value = null
    previewUrl.value = ''
  }
}

// 检测MIME类型（简单实现）
const detectMimeType = (bytes: Uint8Array): string => {
  // 检查文件头来识别常见格式
  const header = Array.from(bytes.slice(0, 8))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  if (header.startsWith('ffd8ff')) return 'image/jpeg'
  if (header.startsWith('89504e47')) return 'image/png'
  if (header.startsWith('47494638')) return 'image/gif'
  if (header.startsWith('424d')) return 'image/bmp'
  if (header.startsWith('52494646')) return 'image/webp'
  if (header.startsWith('494433') || header.startsWith('fff3') || header.startsWith('fff2'))
    return 'audio/mpeg'
  if (header.startsWith('52494646') && bytes[8] === 0x57 && bytes[9] === 0x41) return 'audio/wav'
  if (header.startsWith('4f676753')) return 'audio/ogg'

  return 'application/octet-stream'
}

// 获取文件扩展名
const getFileExtension = (mimeType: string): string => {
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/bmp': '.bmp',
    'image/webp': '.webp',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'audio/mp4': '.m4a',
  }
  return extensions[mimeType] || '.bin'
}

// 下载文件
const downloadFile = () => {
  if (!parsedFileInfo.value) return

  try {
    const binaryString = atob(parsedFileInfo.value.data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const blob = new Blob([bytes], { type: parsedFileInfo.value.mimeType })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = suggestedFileName.value
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showStatus('文件下载成功', 'success')
  } catch (error) {
    showStatus('文件下载失败：' + (error as Error).message, 'error')
  }
}

// 清空所有内容
const clearAll = () => {
  selectedFile.value = null
  base64Result.value = ''
  base64Input.value = ''
  parsedFileInfo.value = null
  suggestedFileName.value = ''
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  showStatus('已清空所有内容', 'info')
}
</script>

<style scoped>
.encode-toolbar {
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

.mode-selector {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
}

.mode-btn {
  padding: 1rem 2rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-background);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.mode-btn:hover {
  border-color: var(--vt-c-green);
  transform: translateY(-2px);
}

.mode-btn.active {
  border-color: var(--vt-c-green);
  background-color: var(--vt-c-green);
  color: white;
}

.mode-icon {
  font-size: 1.2rem;
}

.conversion-section {
  margin-bottom: 2rem;
}

.file-upload-area {
  margin-bottom: 2rem;
  transition: all 0.3s ease;
}

.file-upload-area.compact {
  margin-bottom: 1rem;
}

.file-drop-zone {
  border: 2px dashed var(--color-border);
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  background-color: var(--color-background-soft);
  transition: all 0.3s ease;
  cursor: pointer;
}

.file-drop-zone.compact {
  padding: 1.5rem;
  border-radius: 8px;
}

.file-drop-zone:hover,
.file-drop-zone.drag-over {
  border-color: var(--vt-c-green);
  background-color: var(--color-background-mute);
}

.upload-content h3 {
  margin: 1rem 0;
  color: var(--color-heading);
}

.upload-content h4 {
  margin: 0.5rem 0;
  color: var(--color-heading);
  font-size: 1.1rem;
}

.upload-content p {
  color: var(--color-text-light);
  margin-bottom: 1.5rem;
}

.upload-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.upload-icon.small {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.file-info,
.parsed-info {
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.file-info h4,
.parsed-info h4 {
  margin: 0 0 1rem 0;
  color: var(--color-heading);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label {
  font-size: 0.875rem;
  color: var(--color-text-light);
  font-weight: 500;
}

.value {
  color: var(--color-text);
  word-break: break-all;
}

.filename-input {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: inherit;
}

.convert-btn,
.parse-btn,
.download-btn {
  margin-top: 1rem;
}

.input-section {
  margin-bottom: 2rem;
}

.result-section {
  margin-bottom: 2rem;
}

.result-info {
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--color-background-mute);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.result-info p {
  margin: 0 0 1rem 0;
  color: var(--color-text);
}

.result-info code {
  background-color: var(--color-background-soft);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  word-break: break-all;
}

.preview-section {
  margin-top: 1.5rem;
}

.preview-section h5 {
  margin: 0 0 1rem 0;
  color: var(--color-heading);
}

.preview-container {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  background-color: var(--color-background);
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 4px;
}

.preview-audio {
  width: 100%;
  max-width: 400px;
}

.info-section {
  margin-top: 3rem;
}

.info-section h3 {
  margin-bottom: 1.5rem;
  color: var(--color-heading);
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

@media (max-width: 768px) {
  .mode-selector {
    flex-direction: column;
    align-items: center;
  }

  .mode-btn {
    padding: 0.75rem 1.5rem;
  }

  .file-drop-zone {
    padding: 2rem 1rem;
  }

  .file-drop-zone.compact {
    padding: 1rem;
  }

  .upload-icon {
    font-size: 2rem;
  }

  .upload-icon.small {
    font-size: 1.5rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .encode-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .tool-group {
    justify-content: center;
  }

  /* Toast 移动端优化 */
  .toast-notification {
    top: 10px;
    right: 10px;
    left: 10px;
    min-width: auto;
    max-width: none;
  }
}
</style>
