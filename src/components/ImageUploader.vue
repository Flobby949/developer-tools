<template>
  <div class="upload-section">
    <div
      class="drop-zone"
      :class="{ 'drag-over': isDragOver, 'has-image': file }"
      @drop="handleDrop"
      @dragover.prevent="isDragOver = true"
      @dragleave="isDragOver = false"
      @click="selectFile"
    >
      <template v-if="!file">
        <span class="upload-icon">🖼️</span>
        <h3>{{ title || '拖拽图片到此处或点击选择' }}</h3>
        <p>{{ description || `支持 ${acceptText}，最大 ${maxSizeMB}MB` }}</p>
      </template>
      <template v-else>
        <div class="source-preview-container">
          <img :src="previewUrl" class="source-preview" alt="原图预览" />
          <div class="source-info">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ formatFileSize(file.size) }}</span>
            <span v-if="dimensions" class="file-dimensions">
              {{ dimensions.width }} × {{ dimensions.height }}
            </span>
          </div>
        </div>
      </template>
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        @change="handleFileSelect"
        @click.stop
        style="display: none"
      />
      <button @click.stop="selectFile" class="btn btn-primary">
        {{ file ? '重新选择' : '选择图片' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  accept?: string
  maxSize?: number // 字节
  title?: string
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  accept: 'image/png,image/jpeg,image/webp',
  maxSize: 20 * 1024 * 1024, // 20MB
})

const emit = defineEmits<{
  fileSelected: [file: File]
  error: [message: string]
}>()

const fileInput = ref<HTMLInputElement>()
const file = ref<File>()
const previewUrl = ref('')
const dimensions = ref<{ width: number; height: number }>()
const isDragOver = ref(false)

// 计算接受的文件类型文本
const acceptText = computed(() => {
  const types = props.accept.split(',').map((type) => {
    const ext = type.split('/')[1]?.toUpperCase()
    return ext
  })
  return types.join('、')
})

// 计算最大文件大小（MB）
const maxSizeMB = computed(() => Math.round(props.maxSize / 1024 / 1024))

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 选择文件
function selectFile() {
  fileInput.value?.click()
}

// 处理文件选择
async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const selectedFile = target.files?.[0]
  if (selectedFile) {
    await processFile(selectedFile)
  }
}

// 处理拖拽
async function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false

  const droppedFile = event.dataTransfer?.files[0]
  if (droppedFile && droppedFile.type.startsWith('image/')) {
    await processFile(droppedFile)
  } else {
    emit('error', '请拖入图片文件')
  }
}

// 处理文件
async function processFile(selectedFile: File) {
  if (!selectedFile.type.startsWith('image/')) {
    emit('error', '请选择图片文件')
    return
  }

  if (selectedFile.size > props.maxSize) {
    emit('error', `文件大小不能超过 ${maxSizeMB.value}MB`)
    return
  }

  // 清理旧的 URL
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }

  file.value = selectedFile
  previewUrl.value = URL.createObjectURL(selectedFile)

  // 获取图片尺寸
  const img = new Image()
  img.onload = () => {
    dimensions.value = { width: img.width, height: img.height }
  }
  img.src = previewUrl.value

  emit('fileSelected', selectedFile)
}

// 清理函数
function clear() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  file.value = undefined
  previewUrl.value = ''
  dimensions.value = undefined
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 暴露清理方法给父组件
defineExpose({
  clear,
})
</script>

<style scoped>
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
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0px;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .source-preview {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    background-image:
      linear-gradient(45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.1) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.1) 75%);
  }
}

.source-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  justify-content: center;
  font-size: 0.875rem;
  color: var(--color-text-light);
}

.file-name {
  font-weight: 500;
  color: var(--color-text);
}

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

.btn-primary {
  background-color: var(--vt-c-green);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover, #059669);
}

/* 响应式 */
@media (max-width: 768px) {
  .drop-zone {
    padding: 2rem 1rem;
  }

  .upload-icon {
    font-size: 2rem;
  }
}
</style>
