<template>
  <ToolPanel
    title="AES加解密工具"
    description="提供AES对称加密和解密功能，支持多种加密模式和填充方式"
  >
    <!-- 操作工具栏 -->
    <div class="crypto-toolbar">
      <div class="tool-group">
        <button @click="clearAll" class="btn btn-error">
          <span class="btn-icon">🗑️</span>
          清空
        </button>
        <button @click="generateRandomKey" class="btn btn-secondary">
          <span class="btn-icon">🔑</span>
          生成密钥
        </button>
        <button @click="generateRandomIV" class="btn btn-secondary">
          <span class="btn-icon">🎲</span>
          生成IV
        </button>
      </div>
    </div>

    <!-- 配置区域 -->
    <div class="config-section">
      <div class="config-grid">
        <div class="config-item">
          <label class="config-label">密钥长度：</label>
          <select v-model="toolStore.aesKeySize" class="config-select">
            <option :value="128">128位</option>
            <option :value="192">192位</option>
            <option :value="256">256位</option>
          </select>
        </div>
        <div class="config-item">
          <label class="config-label">加密模式：</label>
          <select v-model="toolStore.aesMode" class="config-select">
            <option value="CBC">CBC</option>
            <option value="ECB">ECB</option>
            <option value="CFB">CFB</option>
            <option value="OFB">OFB</option>
            <option value="CTR">CTR</option>
          </select>
        </div>
        <div class="config-item">
          <label class="config-label">填充方式：</label>
          <select v-model="toolStore.aesPadding" class="config-select">
            <option value="Pkcs7">PKCS7</option>
            <option value="NoPadding">无填充</option>
            <option value="AnsiX923">ANSI X9.23</option>
            <option value="Iso10126">ISO 10126</option>
            <option value="ZeroPadding">零填充</option>
          </select>
        </div>
        <div class="config-item">
          <label class="config-label">输出格式：</label>
          <select v-model="toolStore.aesOutputFormat" class="config-select">
            <option value="hex">十六进制</option>
            <option value="base64">Base64</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 密钥和IV设置 -->
    <div class="key-section">
      <div class="key-grid">
        <div class="key-item">
          <label class="key-label">密钥 (Key)：</label>
          <input
            v-model="toolStore.aesKey"
            type="text"
            class="key-input"
            placeholder="请输入AES密钥..."
          />
        </div>
        <div class="key-item" v-if="toolStore.aesMode !== 'ECB'">
          <label class="key-label">初始向量 (IV)：</label>
          <input
            v-model="toolStore.aesIv"
            type="text"
            class="key-input"
            placeholder="请输入初始向量..."
          />
        </div>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <div class="editor-layout">
      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.aesInput"
          language="text"
          title="原始文本"
          placeholder="请输入需要加密或解密的文本..."
          height="400px"
          :show-clear="true"
          :show-copy="true"
        />
      </div>

      <!-- 操作按钮区域 - 采用编解码按钮设计 -->
      <div class="operation-buttons">
        <button @click="encryptText" class="btn btn-primary operation-btn" :disabled="!canOperate">
          <span class="btn-icon">🔒</span>
          AES加密
        </button>
        <button
          @click="decryptText"
          class="btn btn-secondary operation-btn"
          :disabled="!canOperate"
        >
          <span class="btn-icon">🔓</span>
          AES解密
        </button>
      </div>

      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.aesOutput"
          language="text"
          title="处理结果"
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
          <h4>基础AES-256-CBC加密</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">Hello, AES!</code>
          </div>
          <div class="example-item">
            <span class="example-label">密钥：</span>
            <code class="example-text">mySecretKey123456789012345678</code>
          </div>
          <div class="example-item">
            <span class="example-label">IV：</span>
            <code class="example-text">1234567890123456</code>
          </div>
          <button @click="loadBasicExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>中文文本加密</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">你好，AES加密！</code>
          </div>
          <div class="example-item">
            <span class="example-label">密钥：</span>
            <code class="example-text">ChineseSecretKey1234567890123</code>
          </div>
          <div class="example-item">
            <span class="example-label">IV：</span>
            <code class="example-text">chinese123456789</code>
          </div>
          <button @click="loadChineseExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>JSON数据加密</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">{"user":"admin","pass":"123456"}</code>
          </div>
          <div class="example-item">
            <span class="example-label">密钥：</span>
            <code class="example-text">jsonSecretKey1234567890123456</code>
          </div>
          <div class="example-item">
            <span class="example-label">IV：</span>
            <code class="example-text">jsoniv1234567890</code>
          </div>
          <button @click="loadJsonExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>AES-256-ECB模式</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">ECB Mode Test</code>
          </div>
          <div class="example-item">
            <span class="example-label">密钥：</span>
            <code class="example-text">ecbSecretKey123456789012345678</code>
          </div>
          <div class="example-item">
            <span class="example-label">模式：</span>
            <code class="example-text">ECB (不需要IV)</code>
          </div>
          <button @click="loadECBExample" class="example-btn">使用此示例</button>
        </div>
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="info-section">
      <h3>功能说明</h3>
      <div class="info-grid">
        <div class="info-card">
          <h4>AES算法</h4>
          <p>
            AES（Advanced Encryption Standard）是一种对称块密码算法，是目前最广泛使用的加密标准。
          </p>
          <h5>算法特点：</h5>
          <ul>
            <li>支持128、192、256位密钥长度</li>
            <li>块大小固定为128位（16字节）</li>
            <li>对称加密，加密和解密使用相同密钥</li>
            <li>安全性高，目前无已知有效攻击</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>加密模式</h4>
          <ul>
            <li><strong>CBC：</strong>密码块链接模式，需要IV，安全性好</li>
            <li><strong>ECB：</strong>电子密码本模式，不需要IV，安全性较低</li>
            <li><strong>CFB：</strong>密码反馈模式，可处理任意长度数据</li>
            <li><strong>OFB：</strong>输出反馈模式，适合流式加密</li>
            <li><strong>CTR：</strong>计数器模式，支持并行处理</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>密钥和IV</h4>
          <h5>密钥要求：</h5>
          <ul>
            <li>128位密钥：16个字符</li>
            <li>192位密钥：24个字符</li>
            <li>256位密钥：32个字符</li>
          </ul>
          <h5>IV（初始向量）：</h5>
          <ul>
            <li>长度固定为16字节（128位）</li>
            <li>ECB模式不需要IV</li>
            <li>应为每次加密使用不同的随机IV</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>应用场景</h4>
          <ul>
            <li><strong>数据库加密：</strong>敏感数据的存储加密</li>
            <li><strong>文件保护：</strong>重要文件的安全存储</li>
            <li><strong>网络传输：</strong>HTTPS等安全通信协议</li>
            <li><strong>API安全：</strong>接口数据的加密传输</li>
            <li><strong>密码保护：</strong>用户密码的安全存储</li>
            <li><strong>配置加密：</strong>配置文件中敏感信息加密</li>
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
import {
  aesEncrypt,
  aesDecrypt,
  generateRandomKey as genRandomKey,
  generateRandomIV as genRandomIV,
} from '@/utils/cryptoUtils'

const toolStore = useToolStore()
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')

// 计算是否可以进行操作
const canOperate = computed(() => {
  return (
    toolStore.aesInput.trim() &&
    toolStore.aesKey.trim() &&
    (toolStore.aesMode === 'ECB' || toolStore.aesIv.trim())
  )
})

// 示例数据
const examples = {
  basic: {
    text: 'Hello, AES!',
    key: 'mySecretKey123456789012345678',
    iv: '1234567890123456',
  },
  chinese: {
    text: '你好，AES加密！',
    key: 'ChineseSecretKey1234567890123',
    iv: 'chinese123456789',
  },
  json: {
    text: '{"user":"admin","pass":"123456"}',
    key: 'jsonSecretKey1234567890123456',
    iv: 'jsoniv1234567890',
  },
  ecb: {
    text: 'ECB Mode Test',
    key: 'ecbSecretKey123456789012345678',
  },
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

// AES加密
const encryptText = () => {
  try {
    const options = {
      key: toolStore.aesKey,
      iv: toolStore.aesIv,
      mode: toolStore.aesMode,
      padding: toolStore.aesPadding,
      keySize: toolStore.aesKeySize,
      outputFormat: toolStore.aesOutputFormat,
    }

    const result = aesEncrypt(toolStore.aesInput, options)
    toolStore.aesOutput = result
    showStatus('AES加密成功', 'success')
  } catch (error) {
    showStatus('加密失败：' + (error as Error).message, 'error')
  }
}

// AES解密
const decryptText = () => {
  try {
    const options = {
      key: toolStore.aesKey,
      iv: toolStore.aesIv,
      mode: toolStore.aesMode,
      padding: toolStore.aesPadding,
      keySize: toolStore.aesKeySize,
      outputFormat: toolStore.aesOutputFormat,
    }

    const result = aesDecrypt(toolStore.aesInput, options)
    toolStore.aesOutput = result
    showStatus('AES解密成功', 'success')
  } catch (error) {
    showStatus('解密失败：' + (error as Error).message, 'error')
  }
}

// 生成随机密钥
const generateRandomKey = () => {
  const keyLength = toolStore.aesKeySize / 8
  toolStore.aesKey = genRandomKey(keyLength)
  showStatus(`已生成${toolStore.aesKeySize}位随机密钥`, 'success')
}

// 生成随机IV
const generateRandomIV = () => {
  toolStore.aesIv = genRandomIV(16)
  showStatus('已生成随机初始向量(IV)', 'success')
}

// 清空所有内容
const clearAll = () => {
  toolStore.aesInput = ''
  toolStore.aesOutput = ''
  toolStore.aesKey = ''
  toolStore.aesIv = ''
  showStatus('已清空所有内容', 'info')
}

// 加载示例
const loadBasicExample = () => {
  toolStore.aesInput = examples.basic.text
  toolStore.aesKey = examples.basic.key
  toolStore.aesIv = examples.basic.iv
  toolStore.aesMode = 'CBC'
  toolStore.aesKeySize = 256
  showStatus('已加载基础AES示例', 'info')
}

const loadChineseExample = () => {
  toolStore.aesInput = examples.chinese.text
  toolStore.aesKey = examples.chinese.key
  toolStore.aesIv = examples.chinese.iv
  toolStore.aesMode = 'CBC'
  toolStore.aesKeySize = 256
  showStatus('已加载中文文本示例', 'info')
}

const loadJsonExample = () => {
  toolStore.aesInput = examples.json.text
  toolStore.aesKey = examples.json.key
  toolStore.aesIv = examples.json.iv
  toolStore.aesMode = 'CBC'
  toolStore.aesKeySize = 256
  showStatus('已加载JSON数据示例', 'info')
}

const loadECBExample = () => {
  toolStore.aesInput = examples.ecb.text
  toolStore.aesKey = examples.ecb.key
  toolStore.aesIv = ''
  toolStore.aesMode = 'ECB'
  toolStore.aesKeySize = 256
  showStatus('已加载ECB模式示例', 'info')
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

.config-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.config-label {
  font-size: 0.9rem;
  color: var(--color-text);
  white-space: nowrap;
}

.config-select {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 0.9rem;
}

.key-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.key-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.key-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.key-label {
  font-size: 0.9rem;
  color: var(--color-text);
  font-weight: 500;
}

.key-input {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
}

.key-input:focus {
  outline: none;
  border-color: var(--vt-c-green);
  box-shadow: 0 0 0 2px rgba(52, 152, 112, 0.1);
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
  font-family: 'Courier New', monospace;
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

  .key-grid {
    grid-template-columns: 1fr;
  }

  .config-grid {
    grid-template-columns: 1fr;
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
