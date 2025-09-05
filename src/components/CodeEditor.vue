<template>
  <div class="code-editor">
    <div class="editor-header" v-if="showHeader">
      <span class="editor-title">{{ title }}</span>
      <div class="editor-actions">
        <button v-if="showCopy" @click="copyContent" class="action-btn" title="复制内容">📋</button>
        <button v-if="showClear" @click="clearContent" class="action-btn" title="清空内容">
          🗑️
        </button>
      </div>
    </div>
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as monaco from 'monaco-editor'
import { copyToClipboard } from '@/utils'

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
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorContainer = ref<HTMLDivElement>()
let editor: monaco.editor.IStandaloneCodeEditor | null = null

onMounted(async () => {
  await nextTick()
  if (editorContainer.value) {
    editor = monaco.editor.create(editorContainer.value, {
      value: props.modelValue,
      language: props.language,
      theme: 'vs',
      automaticLayout: true,
      readOnly: props.readonly,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      folding: true,
      wordWrap: 'on',
      placeholder: props.placeholder,
    })

    // 监听内容变化
    editor.onDidChangeModelContent(() => {
      if (editor) {
        emit('update:modelValue', editor.getValue())
      }
    })
  }
})

onUnmounted(() => {
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

// 复制内容
const copyContent = async () => {
  if (editor) {
    const content = editor.getValue()
    const success = await copyToClipboard(content)
    if (success) {
      // 可以添加提示消息
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
.code-editor {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--color-background);
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
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  border-radius: 3px;
  font-size: 0.875rem;
  transition: background-color 0.2s ease;
}

.action-btn:hover {
  background-color: var(--color-background-mute);
}

.editor-container {
  height: v-bind(height);
  width: 100%;
}
</style>
