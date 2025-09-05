<template>
  <ToolPanel title="编码转换" description="提供URL编码/解码和Base64编码/解码功能">
    <!-- 操作工具栏 -->
    <div class="encode-toolbar">
      <div class="tool-group">
        <label class="mode-label">
          <input type="radio" v-model="toolStore.encodeMode" value="urlEncode" class="mode-radio" />
          URL 编码
        </label>
        <label class="mode-label">
          <input type="radio" v-model="toolStore.encodeMode" value="urlDecode" class="mode-radio" />
          URL 解码
        </label>
        <label class="mode-label">
          <input
            type="radio"
            v-model="toolStore.encodeMode"
            value="base64Encode"
            class="mode-radio"
          />
          Base64 编码
        </label>
        <label class="mode-label">
          <input
            type="radio"
            v-model="toolStore.encodeMode"
            value="base64Decode"
            class="mode-radio"
          />
          Base64 解码
        </label>
      </div>

      <div class="tool-group">
        <button
          @click="processText"
          class="tool-btn primary"
          :disabled="!toolStore.encodeInput.trim()"
        >
          {{ processButtonText }}
        </button>
        <button @click="clearAll" class="tool-btn danger">清空</button>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <div class="editor-layout">
      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.encodeInput"
          language="text"
          :title="inputTitle"
          :placeholder="inputPlaceholder"
          height="400px"
          :show-clear="true"
          :show-copy="true"
        />
      </div>

      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.encodeOutput"
          language="text"
          :title="outputTitle"
          height="400px"
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

    <!-- 示例区域 -->
    <div class="examples-section">
      <h3>示例</h3>
      <div class="examples-grid">
        <div class="example-card">
          <h4>URL 编码示例</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">https://example.com/search?q=中文检索&type=1</code>
          </div>
          <div class="example-item">
            <span class="example-label">编码：</span>
            <code class="example-text"
              >https://example.com/search?q=%E4%B8%AD%E6%96%87%E6%A3%80%E7%B4%A2&type=1</code
            >
          </div>
          <button @click="loadUrlExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>Base64 编码示例</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">你好，世界！Hello, World!</code>
          </div>
          <div class="example-item">
            <span class="example-label">编码：</span>
            <code class="example-text">5L2g5aW977yM5LiW55WM77yBSGVsbG8sIFdvcmxkIQ==</code>
          </div>
          <button @click="loadBase64Example" class="example-btn">使用此示例</button>
        </div>
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="info-section">
      <h3>功能说明</h3>
      <div class="info-grid">
        <div class="info-card">
          <h4>URL 编码/解码</h4>
          <p>
            URL编码用于将特殊字符和非英文字符转换为可在URL中传输的格式。常用于处理网址参数和表单数据。
          </p>
        </div>
        <div class="info-card">
          <h4>Base64 编码/解码</h4>
          <p>
            Base64编码用于将二进制数据转换为可打印的ASCII字符。常用于数据传输、图片嵌入和数据存储。
          </p>
        </div>
      </div>
    </div>
  </ToolPanel>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import { useToolStore } from '@/stores/tool'
import { urlEncode, urlDecode, base64Encode, base64Decode } from '@/utils'

const toolStore = useToolStore()
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')

// 计算属性
const processButtonText = computed(() => {
  switch (toolStore.encodeMode) {
    case 'urlEncode':
      return 'URL 编码'
    case 'urlDecode':
      return 'URL 解码'
    case 'base64Encode':
      return 'Base64 编码'
    case 'base64Decode':
      return 'Base64 解码'
    default:
      return '处理'
  }
})

const inputTitle = computed(() => {
  switch (toolStore.encodeMode) {
    case 'urlEncode':
      return '原始文本'
    case 'urlDecode':
      return 'URL编码文本'
    case 'base64Encode':
      return '原始文本'
    case 'base64Decode':
      return 'Base64编码文本'
    default:
      return '输入'
  }
})

const outputTitle = computed(() => {
  switch (toolStore.encodeMode) {
    case 'urlEncode':
      return 'URL编码结果'
    case 'urlDecode':
      return '解码结果'
    case 'base64Encode':
      return 'Base64编码结果'
    case 'base64Decode':
      return '解码结果'
    default:
      return '输出'
  }
})

const inputPlaceholder = computed(() => {
  switch (toolStore.encodeMode) {
    case 'urlEncode':
      return '请输入需要编码的文本...'
    case 'urlDecode':
      return '请输入需要解码的URL编码文本...'
    case 'base64Encode':
      return '请输入需要编码的文本...'
    case 'base64Decode':
      return '请输入需要解码的Base64文本...'
    default:
      return '请输入文本...'
  }
})

// 示例数据
const urlExample = 'https://example.com/search?q=中文检索&type=1'
const base64Example = '你好，世界！Hello, World!'

// 显示状态消息
const showStatus = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  statusMessage.value = message
  statusType.value = type

  // 3秒后自动清除消息
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

// 处理文本
const processText = () => {
  try {
    let result = ''

    switch (toolStore.encodeMode) {
      case 'urlEncode':
        result = urlEncode(toolStore.encodeInput)
        showStatus('URL编码成功', 'success')
        break
      case 'urlDecode':
        result = urlDecode(toolStore.encodeInput)
        showStatus('URL解码成功', 'success')
        break
      case 'base64Encode':
        result = base64Encode(toolStore.encodeInput)
        showStatus('Base64编码成功', 'success')
        break
      case 'base64Decode':
        result = base64Decode(toolStore.encodeInput)
        showStatus('Base64解码成功', 'success')
        break
      default:
        throw new Error('未知的处理模式')
    }

    toolStore.encodeOutput = result
  } catch (error) {
    showStatus('处理失败：' + (error as Error).message, 'error')
  }
}

// 清空所有内容
const clearAll = () => {
  toolStore.encodeInput = ''
  toolStore.encodeOutput = ''
  showStatus('已清空所有内容', 'info')
}

// 加载示例
const loadUrlExample = () => {
  toolStore.encodeInput = urlExample
  toolStore.encodeMode = 'urlEncode'
  showStatus('已加载URL编码示例', 'info')
}

const loadBase64Example = () => {
  toolStore.encodeInput = base64Example
  toolStore.encodeMode = 'base64Encode'
  showStatus('已加载Base64编码示例', 'info')
}
</script>

<style scoped>
.encode-toolbar {
  display: flex;
  flex-wrap: wrap;
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
  flex-wrap: wrap;
}

.mode-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text);
  white-space: nowrap;
}

.mode-radio {
  cursor: pointer;
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
  white-space: nowrap;
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

.tool-btn.danger {
  background-color: #dc3545;
  color: white;
  border-color: #dc3545;
}

.tool-btn.danger:hover:not(:disabled) {
  background-color: #c82333;
}

.editor-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  height: 400px;
  margin-bottom: 2rem;
}

.editor-section {
  display: flex;
  flex-direction: column;
}

.status-message {
  margin-bottom: 1rem;
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

@media (max-width: 768px) {
  .editor-layout,
  .examples-grid,
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
}
</style>
