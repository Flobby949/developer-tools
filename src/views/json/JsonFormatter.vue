<template>
  <ToolPanel title="JSON格式化工具" description="提供JSON格式化、压缩和验证功能">
    <!-- 操作工具栏 -->
    <div class="json-toolbar">
      <div class="tool-group">
        <button
          @click="formatJson"
          class="btn btn-primary"
          :disabled="!toolStore.jsonFormatterInput.trim()"
        >
          <span class="btn-icon">✨</span>
          格式化
        </button>
        <button @click="compressJson" class="btn" :disabled="!toolStore.jsonFormatterInput.trim()">
          <span class="btn-icon">🗄</span>
          压缩
        </button>
        <button @click="validateJson" class="btn" :disabled="!toolStore.jsonFormatterInput.trim()">
          <span class="btn-icon">✓</span>
          验证
        </button>
      </div>

      <div class="tool-group">
        <button @click="clearAll" class="btn btn-error">
          <span class="btn-icon">🗑️</span>
          清空
        </button>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <div class="editor-layout">
      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.jsonFormatterInput"
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
          v-model="toolStore.jsonFormatterOutput"
          language="json"
          title="格式化结果"
          height="500px"
          :readonly="true"
          :show-clear="false"
          :show-copy="true"
        />
      </div>
    </div>

    <!-- 状态信息 -->
    <div v-if="statusMessage" class="alert" :class="`alert-${statusType}`">
      {{ statusMessage }}
    </div>

    <!-- 示例区域 -->
    <div class="examples-section">
      <h3>示例</h3>
      <div class="examples-grid">
        <div class="example-card">
          <h4>简单JSON对象</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">{"name":"张三","age":30,"city":"北京"}</code>
          </div>
          <button @click="loadSimpleExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>复杂JSON数组</h4>
          <div class="example-item">
            <span class="example-label">数组对象：</span>
            <code class="example-text">[{"id":1,"name":"用户1"},{"id":2,"name":"用户2"}]</code>
          </div>
          <button @click="loadComplexExample" class="example-btn">使用此示例</button>
        </div>
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="info-section">
      <h3>功能说明</h3>
      <div class="info-grid">
        <div class="info-card">
          <h4>JSON格式化</h4>
          <p>将压缩的JSON字符串格式化为可读性更好的缩进格式，便于查看和调试。</p>
        </div>
        <div class="info-card">
          <h4>JSON压缩</h4>
          <p>移除JSON中的所有空白字符和换行符，生成最小化的JSON字符串。</p>
        </div>
        <div class="info-card">
          <h4>JSON验证</h4>
          <p>检查输入的字符串是否为有效的JSON格式，并显示详细的错误信息。</p>
        </div>
      </div>
    </div>
  </ToolPanel>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import { useToolStore } from '@/stores/tool'
import {
  formatJson as formatJsonUtil,
  compressJson as compressJsonUtil,
  isValidJson,
} from '@/utils'

const toolStore = useToolStore()
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')

// 示例数据
const simpleExample = '{"name":"张三","age":30,"city":"北京","isActive":true}'
const complexExample =
  '[{"id":1,"name":"用户1","roles":["admin","user"]},{"id":2,"name":"用户2","roles":["user"]}]'

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
    const formatted = formatJsonUtil(toolStore.jsonFormatterInput, 2)
    toolStore.jsonFormatterOutput = formatted
    showStatus('JSON格式化成功', 'success')
  } catch {
    showStatus('无效的JSON格式', 'error')
  }
}

// 压缩JSON
const compressJson = () => {
  try {
    const compressed = compressJsonUtil(toolStore.jsonFormatterInput)
    toolStore.jsonFormatterOutput = compressed
    showStatus('JSON压缩成功', 'success')
  } catch {
    showStatus('无效的JSON格式', 'error')
  }
}

// 验证JSON
const validateJson = () => {
  if (isValidJson(toolStore.jsonFormatterInput)) {
    showStatus('JSON格式正确', 'success')
  } else {
    showStatus('JSON格式错误', 'error')
  }
}

// 清空所有内容
const clearAll = () => {
  toolStore.jsonFormatterInput = ''
  toolStore.jsonFormatterOutput = ''
  showStatus('已清空所有内容', 'info')
}

// 加载示例
const loadSimpleExample = () => {
  toolStore.jsonFormatterInput = simpleExample
  showStatus('已加载简单JSON示例', 'info')
}

const loadComplexExample = () => {
  toolStore.jsonFormatterInput = complexExample
  showStatus('已加载复杂JSON示例', 'info')
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

.editor-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  height: 500px;
  margin-bottom: 2rem;
}

.editor-section {
  display: flex;
  flex-direction: column;
}

.examples-section {
  margin-bottom: 2rem;
}

.examples-section h3,
.info-section h3 {
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.examples-grid,
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.example-card,
.info-card {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-background-soft);
}

.example-card h4,
.info-card h4 {
  margin: 0 0 0.75rem 0;
  color: var(--color-heading);
  font-size: 1rem;
}

.example-item {
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.example-label {
  font-size: 0.8rem;
  color: var(--color-text-light);
}

.example-text {
  background-color: var(--color-background-mute);
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  border: 1px solid var(--color-border);
  word-break: break-all;
}

.example-btn {
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background-color: var(--vt-c-green);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s ease;
}

.example-btn:hover {
  background-color: #369870;
}

.info-card p {
  color: var(--color-text);
  line-height: 1.5;
  margin: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .editor-layout,
  .examples-grid {
    grid-template-columns: 1fr;
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
