<template>
  <ToolPanel
    title="SHA哈希工具"
    description="提供SHA系列哈希计算功能，支持SHA1、SHA256、SHA512算法和大小写转换"
  >
    <!-- 操作工具栏 -->
    <div class="crypto-toolbar">
      <div class="tool-group">
        <button @click="clearAll" class="btn btn-error">
          <span class="btn-icon">🗑️</span>
          清空
        </button>
      </div>
      <div class="tool-group">
        <label class="config-label">哈希算法：</label>
        <select v-model="toolStore.shaType" class="config-select">
          <option value="SHA1">SHA1</option>
          <option value="SHA256">SHA256</option>
          <option value="SHA512">SHA512</option>
        </select>
        <label class="switch-label">
          <input type="checkbox" v-model="toolStore.shaUpperCase" class="switch-checkbox" />
          <span class="switch-text">大写输出</span>
        </label>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <div class="editor-layout">
      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.shaInput"
          language="text"
          title="原始文本"
          placeholder="请输入需要计算SHA哈希的文本..."
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
          :disabled="!toolStore.shaInput.trim()"
        >
          <span class="btn-icon">🔒</span>
          计算{{ toolStore.shaType }}
        </button>
      </div>

      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.shaOutput"
          language="text"
          title="SHA哈希值"
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
          <h4>SHA1示例</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">Hello, World!</code>
          </div>
          <div class="example-item">
            <span class="example-label">SHA1：</span>
            <code class="example-text">0a0a9f2a6772942557ab5355d76af442f8f65e01</code>
          </div>
          <button @click="loadSHA1Example" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>SHA256示例</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">Hello, World!</code>
          </div>
          <div class="example-item">
            <span class="example-label">SHA256：</span>
            <code class="example-text"
              >dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f</code
            >
          </div>
          <button @click="loadSHA256Example" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>SHA512示例</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">Hello, World!</code>
          </div>
          <div class="example-item">
            <span class="example-label">SHA512：</span>
            <code class="example-text"
              >374d794a95cdcfd8b35993185fef9ba368f160d8daf432d08ba9f1ed1e5abe6cc69291e0fa2fe0006a52570ef18c19def4e617c33ce52ef0a6e5fbe318cb0387</code
            >
          </div>
          <button @click="loadSHA512Example" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>中文文本哈希</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">你好，世界！</code>
          </div>
          <div class="example-item">
            <span class="example-label">说明：</span>
            <span class="example-desc">支持中文字符哈希计算</span>
          </div>
          <button @click="loadChineseExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>长文本哈希</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text"
              >这是一段较长的文本内容，用于测试SHA哈希算法对长文本的处理能力...</code
            >
          </div>
          <div class="example-item">
            <span class="example-label">说明：</span>
            <span class="example-desc">测试长文本的哈希性能</span>
          </div>
          <button @click="loadLongTextExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>空字符串哈希</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">(空字符串)</code>
          </div>
          <div class="example-item">
            <span class="example-label">说明：</span>
            <span class="example-desc">每种算法对空字符串都有固定哈希值</span>
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
          <h4>SHA算法系列</h4>
          <p>
            SHA（Secure Hash
            Algorithm）是一系列密码哈希函数，由美国国家安全局设计，被广泛用于数据完整性验证。
          </p>
          <h5>算法对比：</h5>
          <ul>
            <li><strong>SHA1：</strong>160位输出，已有安全漏洞，不推荐新应用</li>
            <li><strong>SHA256：</strong>256位输出，SHA-2系列，安全可靠</li>
            <li><strong>SHA512：</strong>512位输出，SHA-2系列，最高安全性</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>安全性对比</h4>
          <h5>SHA1（不推荐）：</h5>
          <ul>
            <li>已发现碰撞攻击</li>
            <li>Google在2017年成功演示碰撞</li>
            <li>仅适用于非安全敏感场景</li>
          </ul>
          <h5>SHA256（推荐）：</h5>
          <ul>
            <li>目前最广泛使用的安全哈希算法</li>
            <li>Bitcoin等区块链系统采用</li>
            <li>平衡安全性和性能</li>
          </ul>
          <h5>SHA512（高安全）：</h5>
          <ul>
            <li>更长的输出提供更高安全性</li>
            <li>适合高安全要求的应用</li>
            <li>计算时间略长</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>应用场景</h4>
          <ul>
            <li><strong>文件完整性：</strong>验证下载文件是否完整</li>
            <li><strong>密码存储：</strong>存储密码的哈希值</li>
            <li><strong>数字签名：</strong>对数据进行数字签名</li>
            <li><strong>区块链：</strong>Bitcoin等使用SHA256</li>
            <li><strong>证书验证：</strong>SSL证书的指纹计算</li>
            <li><strong>软件分发：</strong>软件包的完整性校验</li>
            <li><strong>版本控制：</strong>Git使用SHA1标识提交</li>
            <li><strong>缓存键值：</strong>生成唯一的缓存标识</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>性能特点</h4>
          <h5>输出长度：</h5>
          <ul>
            <li>SHA1：20字节（40个十六进制字符）</li>
            <li>SHA256：32字节（64个十六进制字符）</li>
            <li>SHA512：64字节（128个十六进制字符）</li>
          </ul>
          <h5>计算速度：</h5>
          <ul>
            <li>SHA1 > SHA256 > SHA512</li>
            <li>现代硬件对SHA256有优化支持</li>
            <li>实际差异对大多数应用可忽略</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>选择建议</h4>
          <h5>推荐用法：</h5>
          <ul>
            <li><strong>新项目：</strong>优先选择SHA256</li>
            <li><strong>高安全要求：</strong>使用SHA512</li>
            <li><strong>兼容性考虑：</strong>SHA256支持最广泛</li>
            <li><strong>性能敏感：</strong>在安全允许下选择SHA256</li>
          </ul>
          <h5>避免使用：</h5>
          <ul>
            <li>不要在新的安全应用中使用SHA1</li>
            <li>已有系统建议升级到SHA256+</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>实际应用示例</h4>
          <ul>
            <li><strong>文件校验：</strong>sha256sum命令验证下载文件</li>
            <li><strong>Git提交：</strong>每个提交都有唯一SHA1标识</li>
            <li><strong>Docker镜像：</strong>使用SHA256标识镜像版本</li>
            <li><strong>SSL证书：</strong>证书指纹使用SHA256</li>
            <li><strong>JWT签名：</strong>常用SHA256进行签名</li>
            <li><strong>区块链：</strong>比特币挖矿基于SHA256</li>
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
import { sha1Hash, sha256Hash, sha512Hash, toUpperCase, toLowerCase } from '@/utils/cryptoUtils'

const toolStore = useToolStore()
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')

// 示例数据
const examples = {
  basic: 'Hello, World!',
  chinese: '你好，世界！',
  longText:
    '这是一段较长的文本内容，用于测试SHA哈希算法对长文本的处理能力。SHA算法可以将任意长度的输入数据转换为固定长度的哈希值，这种特性使其在数据完整性验证、数字签名、密码存储等场景中得到广泛应用。无论输入数据多长，SHA256总是输出256位（32字节）的哈希值，SHA512总是输出512位（64字节）的哈希值。',
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

// 计算SHA哈希
const calculateHash = () => {
  try {
    const input = toolStore.shaInput
    let result = ''

    switch (toolStore.shaType) {
      case 'SHA1':
        result = sha1Hash(input)
        break
      case 'SHA256':
        result = sha256Hash(input)
        break
      case 'SHA512':
        result = sha512Hash(input)
        break
      default:
        throw new Error('不支持的哈希算法')
    }

    // 根据设置转换大小写
    if (toolStore.shaUpperCase) {
      result = toUpperCase(result)
    } else {
      result = toLowerCase(result)
    }

    toolStore.shaOutput = result
    showStatus(`${toolStore.shaType}哈希计算成功`, 'success')
  } catch (error) {
    showStatus('计算失败：' + (error as Error).message, 'error')
  }
}

// 监听哈希算法变化，自动重新计算
watch(
  () => toolStore.shaType,
  () => {
    if (toolStore.shaInput.trim()) {
      calculateHash()
    }
  },
)

// 监听大小写设置变化，自动更新输出
watch(
  () => toolStore.shaUpperCase,
  () => {
    if (toolStore.shaOutput) {
      if (toolStore.shaUpperCase) {
        toolStore.shaOutput = toUpperCase(toolStore.shaOutput)
      } else {
        toolStore.shaOutput = toLowerCase(toolStore.shaOutput)
      }
    }
  },
)

// 清空所有内容
const clearAll = () => {
  toolStore.shaInput = ''
  toolStore.shaOutput = ''
  showStatus('已清空所有内容', 'info')
}

// 加载示例
const loadSHA1Example = () => {
  toolStore.shaInput = examples.basic
  toolStore.shaType = 'SHA1'
  showStatus('已加载SHA1示例', 'info')
}

const loadSHA256Example = () => {
  toolStore.shaInput = examples.basic
  toolStore.shaType = 'SHA256'
  showStatus('已加载SHA256示例', 'info')
}

const loadSHA512Example = () => {
  toolStore.shaInput = examples.basic
  toolStore.shaType = 'SHA512'
  showStatus('已加载SHA512示例', 'info')
}

const loadChineseExample = () => {
  toolStore.shaInput = examples.chinese
  showStatus('已加载中文文本示例', 'info')
}

const loadLongTextExample = () => {
  toolStore.shaInput = examples.longText
  showStatus('已加载长文本示例', 'info')
}

const loadEmptyExample = () => {
  toolStore.shaInput = examples.empty
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

.config-label {
  font-size: 0.9rem;
  color: var(--color-text);
  white-space: nowrap;
}

.config-select {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 0.9rem;
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
  min-width: 140px;
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
  font-family: 'Courier New', monospace;
}

.example-desc {
  font-size: 0.8rem;
  color: var(--color-text);
  font-style: italic;
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
