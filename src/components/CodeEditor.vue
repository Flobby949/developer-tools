<template>
  <Teleport to="body" :disabled="!isExpanded">
    <div
      class="code-editor-shell"
      :class="{ 'code-editor-shell-expanded': isExpanded }"
      @click.self="closeExpand"
    >
      <div class="code-editor" :class="{ 'code-editor-expanded': isExpanded }">
        <div class="editor-header" v-if="showHeader">
          <span class="editor-title">{{ title }}</span>
          <div class="editor-actions">
            <button
              v-if="showExpand"
              @click="toggleExpand"
              class="action-btn action-btn-expand action-btn-icon-only"
              :disabled="!canExpand"
              :title="expandButtonLabel"
              :aria-label="expandButtonLabel"
            >
              <span class="action-icon">{{ expandIcon }}</span>
            </button>
            <button
              v-if="showCopy"
              @click="copyContent"
              class="action-btn action-btn-copy"
              title="复制内容"
            >
              <span class="action-icon">{{ copyIcon }}</span>
              <span class="action-text">{{ copyText }}</span>
            </button>
            <button
              v-if="showClear"
              @click="clearContent"
              class="action-btn action-btn-clear"
              title="清空内容"
            >
              <span class="action-icon">🗑️</span>
              <span class="action-text">清空</span>
            </button>
          </div>
        </div>
        <div ref="editorContainer" class="editor-container"></div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as monaco from 'monaco-editor'
import { copyToClipboard } from '@/utils'
import { useAppStore } from '@/stores/app'

interface Props {
  modelValue: string
  language?: string
  title?: string
  showHeader?: boolean
  showCopy?: boolean
  showClear?: boolean
  readonly?: boolean
  height?: string
  placeholder?: string
  showExpand?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  language: 'json',
  title: '',
  showHeader: true,
  showCopy: true,
  showClear: true,
  readonly: false,
  height: '300px',
  placeholder: '',
  showExpand: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorContainer = ref<HTMLDivElement>()
const copyText = ref('复制')
const copyIcon = ref('📋')
const isExpanded = ref(false)
const appStore = useAppStore()
let editor: monaco.editor.IStandaloneCodeEditor | null = null
let previousBodyOverflow = ''
let previousHtmlOverflow = ''

const canExpand = computed(() => props.showExpand && props.modelValue.trim().length > 0)
const expandIcon = computed(() => (isExpanded.value ? '✕' : '⛶'))
const expandButtonLabel = computed(() => (isExpanded.value ? '退出全屏阅读' : '放大结果框'))

const syncEditorLayout = () => {
  if (!editor) {
    return
  }

  requestAnimationFrame(() => {
    editor?.layout()
    requestAnimationFrame(() => {
      editor?.layout()
    })
  })
}

const lockPageScroll = () => {
  previousBodyOverflow = document.body.style.overflow
  previousHtmlOverflow = document.documentElement.style.overflow
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
}

const unlockPageScroll = () => {
  document.body.style.overflow = previousBodyOverflow
  document.documentElement.style.overflow = previousHtmlOverflow
}

const openExpand = () => {
  if (!canExpand.value) {
    return
  }

  isExpanded.value = true
}

const closeExpand = () => {
  if (!isExpanded.value) {
    return
  }

  isExpanded.value = false
}

const toggleExpand = () => {
  if (isExpanded.value) {
    closeExpand()
    return
  }

  openExpand()
}

const handleWindowKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isExpanded.value) {
    event.preventDefault()
    closeExpand()
  }
}

onMounted(async () => {
  await nextTick()
  if (editorContainer.value) {
    editor = monaco.editor.create(editorContainer.value, {
      value: props.modelValue,
      language: props.language,
      theme: appStore.theme === 'dark' ? 'vs-dark' : 'vs',
      automaticLayout: true,
      readOnly: props.readonly,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      folding: true,
      wordWrap: 'on',
      placeholder: props.placeholder,
      // 移动端滚动优化配置
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        useShadows: false,
        verticalHasArrows: false,
        horizontalHasArrows: false,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
        alwaysConsumeMouseWheel: false,
      },
      // 触摸设备优化
      multiCursorModifier: 'ctrlCmd',
      smoothScrolling: true,
      mouseWheelScrollSensitivity: 1,
      fastScrollSensitivity: 5,
    })

    // 监听内容变化
    editor.onDidChangeModelContent(() => {
      if (editor) {
        emit('update:modelValue', editor.getValue())
      }
    })
  }

  window.addEventListener('keydown', handleWindowKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleWindowKeydown)
  unlockPageScroll()
  if (editor) {
    editor.dispose()
  }
})

// 监听外部值变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (editor && editor.getValue() !== newValue) {
      editor.setValue(newValue)
    }
  },
)

// 监听语言变化
watch(
  () => props.language,
  (newLanguage) => {
    if (editor) {
      const model = editor.getModel()
      if (model) {
        monaco.editor.setModelLanguage(model, newLanguage)
      }
    }
  },
)

// 监听主题变化
watch(
  () => appStore.theme,
  (newTheme) => {
    if (editor) {
      monaco.editor.setTheme(newTheme === 'dark' ? 'vs-dark' : 'vs')
    }
  },
)

watch(canExpand, (expandable) => {
  if (!expandable && isExpanded.value) {
    closeExpand()
  }
})

watch(isExpanded, async (expanded) => {
  if (expanded) {
    lockPageScroll()
  } else {
    unlockPageScroll()
  }

  await nextTick()
  syncEditorLayout()
})

// 复制内容
const copyContent = async () => {
  if (editor) {
    const content = editor.getValue()
    const success = await copyToClipboard(content)
    if (success) {
      // 显示复制成功状态
      copyText.value = '已复制'
      copyIcon.value = '✓'
      setTimeout(() => {
        copyText.value = '复制'
        copyIcon.value = '📋'
      }, 1500)
    }
  }
}

// 清空内容
const clearContent = () => {
  if (editor) {
    editor.setValue('')
  }
}

// 设置编辑器内容
const setValue = (value: string) => {
  if (editor) {
    editor.setValue(value)
  }
}

// 获取编辑器内容
const getValue = (): string => {
  return editor ? editor.getValue() : ''
}

// 格式化代码
const formatCode = () => {
  if (editor) {
    editor.getAction('editor.action.formatDocument')?.run()
  }
}

defineExpose({
  setValue,
  getValue,
  formatCode,
})
</script>

<style scoped>
.code-editor-shell {
  width: 100%;
  min-width: 0;
}

.code-editor-shell-expanded {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(0.75rem, 2vw, 1.5rem);
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(6px);
}

.code-editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--color-background);
}

.code-editor-expanded {
  width: min(1400px, 100%);
  height: calc(100vh - 3rem);
  max-height: calc(100vh - 3rem);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
}

.editor-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.editor-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  color: var(--color-text);
}

.action-btn:disabled {
  transform: none;
  box-shadow: none;
}

.action-btn:hover {
  background-color: var(--color-background-mute);
  border-color: var(--color-border-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.action-btn-copy {
  color: var(--color-primary);
}

.action-btn-copy:hover {
  background-color: var(--color-primary-light);
  border-color: var(--color-primary);
}

.action-btn-expand {
  color: var(--color-info);
}

.action-btn-expand:hover:not(:disabled) {
  background-color: rgba(59, 130, 246, 0.1);
  border-color: var(--color-info);
}

.action-btn-clear {
  color: var(--vt-c-red);
}

.action-btn-clear:hover {
  background-color: #ef444415;
  border-color: var(--vt-c-red);
}

.action-icon {
  font-size: 1rem;
  line-height: 1;
}

.action-btn-icon-only {
  justify-content: center;
  padding: 0.5rem;
  min-width: 2.5rem;
}

.action-text {
  font-size: 0.875rem;
  white-space: nowrap;
}

.editor-container {
  height: v-bind(height);
  width: 100%;
  min-width: 0;
  flex: 0 0 auto;
  /* 移动端触摸滚动优化 */
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  overflow: auto;
}

.code-editor-expanded .editor-container {
  height: auto;
  flex: 1 1 auto;
  min-height: 0;
}

/* Monaco Editor 移动端优化 */
.editor-container :deep(.monaco-editor) {
  /* 确保编辑器在移动端能正常滚动 */
  touch-action: pan-y;
}

.editor-container :deep(.monaco-scrollable-element) {
  /* 优化滚动条在移动端的显示 */
  touch-action: pan-y;
}

.editor-container :deep(.monaco-editor .overflow-guard) {
  /* 防止内容溢出导致的滚动问题 */
  touch-action: pan-y;
}

/* 移动端滚动条样式优化 */
@media (max-width: 768px) {
  .editor-container :deep(.monaco-scrollable-element > .scrollbar) {
    /* 移动端滚动条更粗一些，便于触摸操作 */
    width: 12px !important;
    height: 12px !important;
  }

  .editor-container :deep(.monaco-scrollable-element > .scrollbar > .slider) {
    /* 滚动条滑块在移动端更明显 */
    background-color: rgba(0, 0, 0, 0.3) !important;
    border-radius: 6px !important;
  }

  .editor-container :deep(.monaco-scrollable-element > .scrollbar > .slider:hover) {
    background-color: rgba(0, 0, 0, 0.5) !important;
  }
}

/* 响应式设计 */
@media (max-width: 640px) {
  .action-btn {
    padding: 0.5rem;
    min-width: 2.5rem;
  }

  .action-text {
    display: none;
  }

  .action-icon {
    font-size: 1.1rem;
  }

  .editor-actions {
    gap: 0.5rem;
  }

  .code-editor-expanded {
    height: calc(100vh - 1.5rem);
    max-height: calc(100vh - 1.5rem);
  }

  .code-editor-shell-expanded {
    padding: 0.75rem;
  }
}
</style>
