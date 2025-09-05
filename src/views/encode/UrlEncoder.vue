<template>
  <ToolPanel title="URL编解码" description="提供URL编码和解码功能，处理特殊字符和中文字符">
    <!-- 操作工具栏 -->
    <div class="encode-toolbar">
      <div class="tool-group">
        <label class="mode-label">
          <input type="radio" v-model="toolStore.urlEncodeMode" value="encode" class="mode-radio" />
          URL 编码
        </label>
        <label class="mode-label">
          <input type="radio" v-model="toolStore.urlEncodeMode" value="decode" class="mode-radio" />
          URL 解码
        </label>
      </div>

      <div class="tool-group">
        <button
          @click="processText"
          class="btn btn-primary"
          :disabled="!toolStore.urlEncodeInput.trim()"
        >
          <span class="btn-icon">🔄</span>
          {{ processButtonText }}
        </button>
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
          v-model="toolStore.urlEncodeInput"
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
          v-model="toolStore.urlEncodeOutput"
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
    <div v-if="statusMessage" class="alert" :class="`alert-${statusType}`">
      {{ statusMessage }}
    </div>

    <!-- 示例区域 -->
    <div class="examples-section">
      <h3>示例</h3>
      <div class="examples-grid">
        <div class="example-card">
          <h4>URL参数编码</h4>
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
          <h4>特殊字符编码</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">name=张三&age=25&email=user@example.com</code>
          </div>
          <div class="example-item">
            <span class="example-label">编码：</span>
            <code class="example-text"
              >name=%E5%BC%A0%E4%B8%89&age=25&email=user%40example.com</code
            >
          </div>
          <button @click="loadParamsExample" class="example-btn">使用此示例</button>
        </div>
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="info-section">
      <h3>功能说明</h3>
      <div class="info-grid">
        <div class="info-card">
          <h4>URL编码</h4>
          <p>
            将特殊字符和非ASCII字符转换为%XX格式的编码。常用于URL参数传递，确保数据在HTTP传输中的正确性。
          </p>
          <h5>常见编码字符：</h5>
          <ul>
            <li>空格 → %20</li>
            <li>@ → %40</li>
            <li>& → %26</li>
            <li># → %23</li>
            <li>中文字符 → UTF-8编码</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>URL解码</h4>
          <p>将%XX格式的编码字符还原为原始字符。用于解析URL参数或处理已编码的URL字符串。</p>
          <h5>使用场景：</h5>
          <ul>
            <li>解析URL查询参数</li>
            <li>处理表单数据</li>
            <li>API参数解析</li>
            <li>日志分析</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>注意事项</h4>
          <ul>
            <li>URL编码使用UTF-8字符集</li>
            <li>某些字符在URL中有特殊含义，需要编码</li>
            <li>完整URL编码与组件编码可能不同</li>
            <li>重复编码可能导致错误</li>
          </ul>
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
import { urlEncode, urlDecode } from '@/utils'

const toolStore = useToolStore()
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')

// 计算属性
const processButtonText = computed(() => {
  return toolStore.urlEncodeMode === 'encode' ? 'URL编码' : 'URL解码'
})

const inputTitle = computed(() => {
  return toolStore.urlEncodeMode === 'encode' ? '原始文本' : 'URL编码文本'
})

const outputTitle = computed(() => {
  return toolStore.urlEncodeMode === 'encode' ? 'URL编码结果' : '解码结果'
})

const inputPlaceholder = computed(() => {
  return toolStore.urlEncodeMode === 'encode'
    ? '请输入需要编码的文本...'
    : '请输入需要解码的URL编码文本...'
})

// 示例数据
const urlExample = 'https://example.com/search?q=中文检索&type=1'
const paramsExample = 'name=张三&age=25&email=user@example.com'

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

    if (toolStore.urlEncodeMode === 'encode') {
      result = urlEncode(toolStore.urlEncodeInput)
      showStatus('URL编码成功', 'success')
    } else {
      result = urlDecode(toolStore.urlEncodeInput)
      showStatus('URL解码成功', 'success')
    }

    toolStore.urlEncodeOutput = result
  } catch (error) {
    showStatus('处理失败：' + (error as Error).message, 'error')
  }
}

// 清空所有内容
const clearAll = () => {
  toolStore.urlEncodeInput = ''
  toolStore.urlEncodeOutput = ''
  showStatus('已清空所有内容', 'info')
}

// 加载示例
const loadUrlExample = () => {
  toolStore.urlEncodeInput = urlExample
  toolStore.urlEncodeMode = 'encode'
  showStatus('已加载URL编码示例', 'info')
}

const loadParamsExample = () => {
  toolStore.urlEncodeInput = paramsExample
  toolStore.urlEncodeMode = 'encode'
  showStatus('已加载参数编码示例', 'info')
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

.examples-section {
  margin-bottom: 2rem;
}

.examples-section h3,
.info-section h3 {
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.examples-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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

.info-card h5 {
  margin: 0.75rem 0 0.5rem 0;
  color: var(--color-heading);
  font-size: 0.9rem;
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
  margin: 0 0 0.75rem 0;
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

@media (max-width: 768px) {
  .editor-layout,
  .examples-grid {
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
