<template>
  <ToolPanel title="JSON工具" description="提供JSON格式化、压缩和转实体类功能">
    <!-- 操作工具栏 -->
    <div class="json-toolbar">
      <div class="tool-group">
        <button
          @click="formatJson"
          class="tool-btn primary"
          :disabled="!toolStore.jsonInput.trim()"
        >
          格式化
        </button>
        <button @click="compressJson" class="tool-btn" :disabled="!toolStore.jsonInput.trim()">
          压缩
        </button>
        <button @click="validateJson" class="tool-btn" :disabled="!toolStore.jsonInput.trim()">
          验证
        </button>
      </div>

      <div class="tool-group">
        <select v-model="toolStore.jsonLanguage" class="language-select">
          <option value="java">Java</option>
          <option value="typescript">TypeScript</option>
          <option value="csharp">C#</option>
          <option value="python">Python</option>
        </select>
        <input v-model="toolStore.jsonClassName" placeholder="类名" class="class-name-input" />
        <button
          @click="convertToEntity"
          class="tool-btn success"
          :disabled="!toolStore.jsonInput.trim()"
        >
          转实体类
        </button>
      </div>

      <div class="tool-group">
        <button @click="clearAll" class="tool-btn danger">清空</button>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <div class="editor-layout">
      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.jsonInput"
          language="json"
          title="JSON 输入"
          placeholder="请输入JSON数据..."
          height="500px"
          :show-clear="true"
          :show-copy="true"
        />
      </div>

      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.jsonOutput"
          :language="outputLanguage"
          title="输出结果"
          height="500px"
          :readonly="true"
          :show-clear="false"
          :show-copy="true"
        />
      </div>
    </div>

    <!-- 状态信息 -->
    <div v-if="statusMessage" class="status-message" :class="statusType">
      {{ statusMessage }}
    </div>
  </ToolPanel>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import { useToolStore } from '@/stores/tool'
import {
  formatJson as formatJsonUtil,
  compressJson as compressJsonUtil,
  isValidJson,
} from '@/utils'
import { jsonToJava, jsonToTypeScript, jsonToCSharp, jsonToPython } from '@/utils/jsonToEntity'

const toolStore = useToolStore()
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')

// 计算输出语言
const outputLanguage = computed(() => {
  if (toolStore.jsonOutput.includes('interface') || toolStore.jsonOutput.includes(': ')) {
    return 'typescript'
  }
  if (toolStore.jsonOutput.includes('public class') || toolStore.jsonOutput.includes('get')) {
    return 'java'
  }
  if (toolStore.jsonOutput.includes('class') && toolStore.jsonOutput.includes('def __init__')) {
    return 'python'
  }
  if (
    toolStore.jsonOutput.includes('public class') &&
    toolStore.jsonOutput.includes('{ get; set; }')
  ) {
    return 'csharp'
  }
  return 'json'
})

// 显示状态消息
const showStatus = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  statusMessage.value = message
  statusType.value = type

  // 3秒后自动清除消息
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

// 格式化JSON
const formatJson = () => {
  try {
    const formatted = formatJsonUtil(toolStore.jsonInput, 2)
    toolStore.jsonOutput = formatted
    showStatus('JSON格式化成功', 'success')
  } catch {
    showStatus('无效的JSON格式', 'error')
  }
}

// 压缩JSON
const compressJson = () => {
  try {
    const compressed = compressJsonUtil(toolStore.jsonInput)
    toolStore.jsonOutput = compressed
    showStatus('JSON压缩成功', 'success')
  } catch {
    showStatus('无效的JSON格式', 'error')
  }
}

// 验证JSON
const validateJson = () => {
  if (isValidJson(toolStore.jsonInput)) {
    showStatus('JSON格式正确', 'success')
  } else {
    showStatus('JSON格式错误', 'error')
  }
}

// 转换为实体类
const convertToEntity = () => {
  try {
    let result = ''
    const className = toolStore.jsonClassName || 'Entity'

    switch (toolStore.jsonLanguage) {
      case 'java':
        result = jsonToJava(toolStore.jsonInput, className)
        break
      case 'typescript':
        result = jsonToTypeScript(toolStore.jsonInput, className)
        break
      case 'csharp':
        result = jsonToCSharp(toolStore.jsonInput, className)
        break
      case 'python':
        result = jsonToPython(toolStore.jsonInput, className)
        break
      default:
        throw new Error('不支持的语言类型')
    }

    toolStore.jsonOutput = result
    showStatus(`成功转换为${toolStore.jsonLanguage}实体类`, 'success')
  } catch (error) {
    showStatus('转换失败：' + (error as Error).message, 'error')
  }
}

// 清空所有内容
const clearAll = () => {
  toolStore.jsonInput = ''
  toolStore.jsonOutput = ''
  showStatus('已清空所有内容', 'info')
}
</script>

<style scoped>
.json-toolbar {
  display: flex;
  flex-wrap: wrap;
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
  gap: 0.5rem;
}

.tool-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  color: var(--color-text);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.tool-btn:hover:not(:disabled) {
  background-color: var(--color-background-mute);
  border-color: var(--color-border-hover);
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tool-btn.primary {
  background-color: var(--vt-c-green);
  color: white;
  border-color: var(--vt-c-green);
}

.tool-btn.primary:hover:not(:disabled) {
  background-color: #369870;
}

.tool-btn.success {
  background-color: #28a745;
  color: white;
  border-color: #28a745;
}

.tool-btn.success:hover:not(:disabled) {
  background-color: #218838;
}

.tool-btn.danger {
  background-color: #dc3545;
  color: white;
  border-color: #dc3545;
}

.tool-btn.danger:hover:not(:disabled) {
  background-color: #c82333;
}

.language-select,
.class-name-input {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  color: var(--color-text);
  border-radius: 4px;
  font-size: 0.875rem;
}

.class-name-input {
  width: 120px;
}

.editor-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  height: 500px;
}

.editor-section {
  display: flex;
  flex-direction: column;
}

.status-message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.status-message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-message.info {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

@media (max-width: 768px) {
  .editor-layout {
    grid-template-columns: 1fr;
    height: auto;
  }

  .json-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .tool-group {
    justify-content: center;
  }
}
</style>
