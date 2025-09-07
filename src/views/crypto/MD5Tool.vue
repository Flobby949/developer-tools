<template>
  <ToolPanel title="MD5哈希工具" description="提供MD5哈希计算功能，支持大小写转换和文本处理">
    <!-- 操作工具栏 -->
    <div class="crypto-toolbar">
      <div class="tool-group">
        <button @click="clearAll" class="btn btn-error">
          <span class="btn-icon">🗑️</span>
          清空
        </button>
      </div>
      <div class="tool-group">
        <label class="switch-label">
          <input type="checkbox" v-model="toolStore.md5UpperCase" class="switch-checkbox" />
          <span class="switch-text">大写输出</span>
        </label>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <div class="editor-layout">
      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.md5Input"
          language="text"
          title="原始文本"
          placeholder="请输入需要计算MD5哈希的文本..."
          height="400px"
          :show-clear="true"
          :show-copy="true"
        />
      </div>

      <!-- 操作按钮区域 -->
      <div class="operation-buttons">
        <button
          @click="calculateHash"
          class="btn btn-primary operation-btn"
          :disabled="!toolStore.md5Input.trim()"
        >
          <span class="btn-icon">🔒</span>
          计算MD5
        </button>
      </div>

      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.md5Output"
          language="text"
          title="MD5哈希值"
          height="400px"
          :show-clear="false"
          :show-copy="true"
          :readonly="true"
        />
      </div>
    </div>

    <!-- 状态信息 -->
    <div v-if="statusMessage" class="toast-notification" :class="`toast-${statusType}`">
      <span class="toast-icon">{{ getStatusIcon() }}</span>
      <span class="toast-message">{{ statusMessage }}</span>
      <button @click="hideStatus" class="toast-close">×</button>
    </div>

    <!-- 示例区域 -->
    <div class="examples-section">
      <h3>示例</h3>
      <div class="examples-grid">
        <div class="example-card">
          <h4>简单文本哈希</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">Hello, World!</code>
          </div>
          <div class="example-item">
            <span class="example-label">MD5：</span>
            <code class="example-text">65a8e27d8879283831b664bd8b7f0ad4</code>
          </div>
          <button @click="loadTextExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>中文文本哈希</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">你好，世界！</code>
          </div>
          <div class="example-item">
            <span class="example-label">MD5：</span>
            <code class="example-text">dbefd3ada018615b35588a01e216ae6e</code>
          </div>
          <button @click="loadChineseExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>数字字符串哈希</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">123456789</code>
          </div>
          <div class="example-item">
            <span class="example-label">MD5：</span>
            <code class="example-text">25f9e794323b453885f5181f1b624d0b</code>
          </div>
          <button @click="loadNumberExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>空字符串哈希</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">(空字符串)</code>
          </div>
          <div class="example-item">
            <span class="example-label">MD5：</span>
            <code class="example-text">d41d8cd98f00b204e9800998ecf8427e</code>
          </div>
          <button @click="loadEmptyExample" class="example-btn">使用此示例</button>
        </div>
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="info-section">
      <h3>功能说明</h3>
      <div class="info-grid">
        <div class="info-card">
          <h4>MD5算法</h4>
          <p>
            MD5（Message-Digest Algorithm
            5）是一种广泛使用的密码哈希函数，可以产生一个128位（16字节）的哈希值。
          </p>
          <h5>算法特点：</h5>
          <ul>
            <li>输出长度固定为128位（32个十六进制字符）</li>
            <li>单向函数，不可逆向计算原文</li>
            <li>相同输入必定产生相同输出</li>
            <li>微小的输入变化会导致完全不同的输出</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>应用场景</h4>
          <ul>
            <li><strong>文件完整性验证：</strong>检查文件是否被篡改</li>
            <li><strong>密码存储：</strong>存储密码的哈希值而非明文</li>
            <li><strong>数字签名：</strong>对数据进行数字签名</li>
            <li><strong>去重检测：</strong>快速比较文件或数据是否相同</li>
            <li><strong>缓存键值：</strong>生成缓存的唯一标识</li>
            <li><strong>数据库索引：</strong>为大文本创建索引</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>安全性考虑</h4>
          <p><strong>注意：</strong>MD5算法已被发现存在安全漏洞，不推荐用于安全敏感的应用。</p>
          <h5>已知问题：</h5>
          <ul>
            <li>容易受到碰撞攻击</li>
            <li>存在哈希碰撞的可能性</li>
            <li>不适合密码学安全应用</li>
            <li>建议使用SHA-256等更安全的算法</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>使用技巧</h4>
          <ul>
            <li><strong>大小写转换：</strong>使用工具栏开关控制输出格式</li>
            <li><strong>批量处理：</strong>可以连续计算多个文本的哈希值</li>
            <li><strong>结果验证：</strong>与在线MD5工具对比验证结果</li>
            <li><strong>性能优化：</strong>大文本建议分块处理</li>
            <li><strong>编码注意：</strong>确保文本编码一致性（UTF-8）</li>
          </ul>
        </div>
      </div>
    </div>
  </ToolPanel>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import { useToolStore } from '@/stores/tool'
import { md5Hash, toUpperCase, toLowerCase } from '@/utils/cryptoUtils'

const toolStore = useToolStore()
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')

// 示例数据
const examples = {
  text: 'Hello, World!',
  chinese: '你好，世界！',
  number: '123456789',
  empty: '',
}

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

// 计算MD5哈希
const calculateHash = () => {
  try {
    const input = toolStore.md5Input.trim()
    if (!input) {
      showStatus('请输入需要计算哈希的文本', 'error')
      return
    }

    let result = md5Hash(input)

    // 根据设置转换大小写
    if (toolStore.md5UpperCase) {
      result = toUpperCase(result)
    } else {
      result = toLowerCase(result)
    }

    toolStore.md5Output = result
    showStatus('MD5哈希计算成功', 'success')
  } catch (error) {
    showStatus('计算失败：' + (error as Error).message, 'error')
  }
}

// 监听大小写设置变化，自动更新输出
watch(
  () => toolStore.md5UpperCase,
  () => {
    if (toolStore.md5Output) {
      if (toolStore.md5UpperCase) {
        toolStore.md5Output = toUpperCase(toolStore.md5Output)
      } else {
        toolStore.md5Output = toLowerCase(toolStore.md5Output)
      }
    }
  },
)

// 清空所有内容
const clearAll = () => {
  toolStore.md5Input = ''
  toolStore.md5Output = ''
  showStatus('已清空所有内容', 'info')
}

// 加载示例
const loadTextExample = () => {
  toolStore.md5Input = examples.text
  showStatus('已加载英文文本示例', 'info')
}

const loadChineseExample = () => {
  toolStore.md5Input = examples.chinese
  showStatus('已加载中文文本示例', 'info')
}

const loadNumberExample = () => {
  toolStore.md5Input = examples.number
  showStatus('已加载数字字符串示例', 'info')
}

const loadEmptyExample = () => {
  toolStore.md5Input = examples.empty
  showStatus('已加载空字符串示例', 'info')
}
</script>

<style scoped>
.crypto-toolbar {
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

.switch-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--color-text);
}

.switch-checkbox {
  width: 1rem;
  height: 1rem;
}

.switch-text {
  user-select: none;
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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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

  .crypto-toolbar {
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
