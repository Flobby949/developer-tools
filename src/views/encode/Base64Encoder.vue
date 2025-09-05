<template>
  <ToolPanel title="Base64编解码" description="提供Base64编码和解码功能，支持文本和二进制数据处理">
    <!-- 操作工具栏 -->
    <div class="encode-toolbar">
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
          v-model="toolStore.base64EncodeInput"
          language="text"
          title="原始文本"
          placeholder="请输入需要编码的文本..."
          height="400px"
          :show-clear="true"
          :show-copy="true"
        />
      </div>

      <!-- 操作按钮区域 -->
      <div class="operation-buttons">
        <button
          @click="encodeText"
          class="btn btn-primary operation-btn"
          :disabled="!toolStore.base64EncodeInput.trim()"
        >
          <span class="btn-icon">→</span>
          Base64编码
        </button>
        <button
          @click="decodeText"
          class="btn btn-secondary operation-btn"
          :disabled="!toolStore.base64EncodeInput.trim()"
        >
          <span class="btn-icon">←</span>
          Base64解码
        </button>
      </div>

      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.base64EncodeOutput"
          language="text"
          title="处理结果"
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
          <h4>中英文文本编码</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">你好，世界！Hello, World!</code>
          </div>
          <div class="example-item">
            <span class="example-label">编码：</span>
            <code class="example-text">5L2g5aW977yM5LiW55WM77yBSGVsbG8sIFdvcmxkIQ==</code>
          </div>
          <button @click="loadTextExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>JSON数据编码</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">{"name":"张三","age":25,"isActive":true}</code>
          </div>
          <div class="example-item">
            <span class="example-label">编码：</span>
            <code class="example-text"
              >eyJuYW1lIjoi5byg5LiJIiwiYWdlIjoyNSwiaXNBY3RpdmUiOnRydWV9</code
            >
          </div>
          <button @click="loadJsonExample" class="example-btn">使用此示例</button>
        </div>
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="info-section">
      <h3>功能说明</h3>
      <div class="info-grid">
        <div class="info-card">
          <h4>Base64编码</h4>
          <p>
            将任意二进制数据转换为可打印的ASCII字符。使用64个字符（A-Z, a-z, 0-9, +, /）来表示数据。
          </p>
          <h5>编码规则：</h5>
          <ul>
            <li>每3个字节转换为4个Base64字符</li>
            <li>不足3字节时用'='符号补齐</li>
            <li>字符集：A-Z, a-z, 0-9, +, /</li>
            <li>输出长度总是4的倍数</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>Base64解码</h4>
          <p>将Base64编码的字符串还原为原始数据。自动处理填充字符和格式验证。</p>
          <h5>解码特点：</h5>
          <ul>
            <li>自动忽略空白字符</li>
            <li>验证字符合法性</li>
            <li>处理填充字符'='</li>
            <li>支持换行分割的长字符串</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>应用场景</h4>
          <ul>
            <li><strong>邮件编码：</strong>MIME邮件附件编码</li>
            <li><strong>数据传输：</strong>HTTP Basic认证</li>
            <li><strong>图片嵌入：</strong>Data URL中的图片数据</li>
            <li><strong>配置存储：</strong>配置文件中的二进制数据</li>
            <li><strong>密钥编码：</strong>加密密钥的安全传输</li>
            <li><strong>Token编码：</strong>JWT等令牌的载荷部分</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>注意事项</h4>
          <ul>
            <li>Base64编码会增加约33%的数据大小</li>
            <li>编码不等于加密，数据仍可被轻易解码</li>
            <li>URL传输时需要考虑+/字符的转义</li>
            <li>大文件编码可能导致内存占用过高</li>
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
import { useToolStore } from '@/stores/tool'
import { base64Encode, base64Decode } from '@/utils'

const toolStore = useToolStore()
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')

// 示例数据
const textExample = '你好，世界！Hello, World!'
const jsonExample = '{"name":"张三","age":25,"isActive":true}'

// 显示状态消息
const showStatus = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  statusMessage.value = message
  statusType.value = type

  // 3秒后自动清除消息
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

// Base64编码
const encodeText = () => {
  try {
    const result = base64Encode(toolStore.base64EncodeInput)
    toolStore.base64EncodeOutput = result
    showStatus('Base64编码成功', 'success')
  } catch (error) {
    showStatus('编码失败：' + (error as Error).message, 'error')
  }
}

// Base64解码
const decodeText = () => {
  try {
    const result = base64Decode(toolStore.base64EncodeInput)
    toolStore.base64EncodeOutput = result
    showStatus('Base64解码成功', 'success')
  } catch (error) {
    showStatus('解码失败：' + (error as Error).message, 'error')
  }
}

// 清空所有内容
const clearAll = () => {
  toolStore.base64EncodeInput = ''
  toolStore.base64EncodeOutput = ''
  showStatus('已清空所有内容', 'info')
}

// 加载示例
const loadTextExample = () => {
  toolStore.base64EncodeInput = textExample
  showStatus('已加载文本编码示例', 'info')
}

const loadJsonExample = () => {
  toolStore.base64EncodeInput = jsonExample
  showStatus('已加载JSON编码示例', 'info')
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

.editor-layout {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1.5rem;
  height: 400px;
  margin-bottom: 2rem;
  align-items: center;
}

.operation-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 1rem;
  align-items: center;
}

.operation-btn {
  min-width: 120px;
  padding: 0.75rem 1rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.operation-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.operation-btn .btn-icon {
  font-size: 1.2rem;
  margin-right: 0.5rem;
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

.info-card li strong {
  color: var(--color-heading);
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
  }

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
