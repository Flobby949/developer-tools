<template>
  <ToolPanel title="JSON格式化工具" description="提供JSON格式化、压缩和验证功能">
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

      <!-- 操作按钮区域 -->
      <div class="operation-buttons">
        <button
          @click="formatJson"
          class="btn btn-primary operation-btn"
          :disabled="!toolStore.jsonFormatterInput.trim()"
        >
          <span class="btn-icon">✨</span>
          格式化
        </button>
        <button
          @click="compressJson"
          class="btn btn-secondary operation-btn"
          :disabled="!toolStore.jsonFormatterInput.trim()"
        >
          <span class="btn-icon">🗄</span>
          压缩
        </button>
        <button
          @click="validateJson"
          class="btn btn-info operation-btn"
          :disabled="!toolStore.jsonFormatterInput.trim()"
        >
          <span class="btn-icon">✓</span>
          验证
        </button>
        <button @click="clearAll" class="btn btn-error operation-btn">
          <span class="btn-icon">🗑️</span>
          清空
        </button>
      </div>

      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.jsonFormatterOutput"
          language="json"
          title="格式化结果"
          height="500px"
          :show-clear="false"
          :show-copy="true"
          :show-expand="true"
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

        <div class="example-card">
          <h4>错误格式示例</h4>
          <div class="example-item">
            <span class="example-label">错误格式：</span>
            <code class="example-text">{"name": "张三", "age": 30,}</code>
          </div>
          <button @click="loadErrorExample" class="example-btn">使用此示例</button>
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
  validateJsonWithDetails,
} from '@/utils'

const toolStore = useToolStore()
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')

// 示例数据
const simpleExample = '{"name":"张三","age":30,"city": "北京","isActive":true}'
const complexExample =
  '[{"id":1,"name":"用户1","roles":["admin","user"]},{"id":2,"name":"用户2","roles":["user"]}]'
const errorExample = '{"name": "张三", "age": 30,}'

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
  const result = validateJsonWithDetails(toolStore.jsonFormatterInput)
  if (result.isValid) {
    showStatus('✓ JSON格式正确', 'success')
  } else {
    showStatus(`✗ JSON验证失败：${result.error}`, 'error')
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

const loadErrorExample = () => {
  toolStore.jsonFormatterInput = errorExample
  showStatus('已加载错误格式JSON示例，请点击验证查看错误信息', 'info')
}
</script>

<style scoped>
.editor-layout {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1.5rem;
  height: 500px;
  margin-bottom: 2rem;
  align-items: center;
}

.operation-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0 1rem;
  align-items: center;
}

.operation-btn {
  min-width: 100px;
  padding: 0.75rem 1rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
  font-size: 0.875rem;
}

.operation-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.operation-btn .btn-icon {
  font-size: 1rem;
  margin-right: 0.5rem;
}

.editor-section {
  display: flex;
  flex-direction: column;
  min-width: 0;
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
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
  .editor-layout {
    grid-template-columns: 1fr;
    height: auto;
    gap: 1rem;
  }

  .operation-buttons {
    order: -1;
    flex-direction: row;
    justify-content: center;
    padding: 1rem 0;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .operation-btn {
    min-width: 80px;
    font-size: 0.8rem;
    padding: 0.6rem 0.8rem;
  }

  .examples-grid {
    grid-template-columns: 1fr;
  }
}
</style>
