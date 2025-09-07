<template>
  <ToolPanel
    title="RSA加解密工具"
    description="提供RSA非对称加密和解密功能，支持密钥对生成和公私钥加解密"
  >
    <!-- 操作工具栏 -->
    <div class="crypto-toolbar">
      <div class="tool-group">
        <button @click="clearAll" class="btn btn-error">
          <span class="btn-icon">🗑️</span>
          清空
        </button>
        <button @click="generateKeyPair" class="btn btn-success">
          <span class="btn-icon">🔐</span>
          生成密钥对
        </button>
      </div>
      <div class="tool-group">
        <label class="config-label">密钥长度：</label>
        <select v-model="toolStore.rsaKeySize" class="config-select">
          <option :value="1024">1024位</option>
          <option :value="2048">2048位</option>
          <option :value="4096">4096位</option>
        </select>
      </div>
    </div>

    <!-- 密钥区域 -->
    <div class="key-section">
      <div class="key-grid">
        <div class="key-item">
          <label class="key-label">公钥 (Public Key)：</label>
          <textarea
            v-model="toolStore.rsaPublicKey"
            class="key-textarea"
            placeholder="请输入或生成RSA公钥..."
            rows="6"
          ></textarea>
        </div>
        <div class="key-item">
          <label class="key-label">私钥 (Private Key)：</label>
          <textarea
            v-model="toolStore.rsaPrivateKey"
            class="key-textarea"
            placeholder="请输入或生成RSA私钥..."
            rows="6"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <div class="editor-layout">
      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.rsaInput"
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
        <button
          @click="encryptWithPublicKey"
          class="btn btn-primary operation-btn"
          :disabled="!canEncrypt"
        >
          <span class="btn-icon">🔒</span>
          公钥加密
        </button>
        <button
          @click="decryptWithPrivateKey"
          class="btn btn-secondary operation-btn"
          :disabled="!canDecrypt"
        >
          <span class="btn-icon">🔓</span>
          私钥解密
        </button>
      </div>

      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.rsaOutput"
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
          <h4>基础RSA加密</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">Hello, RSA!</code>
          </div>
          <div class="example-item">
            <span class="example-label">说明：</span>
            <span class="example-desc">先生成密钥对，再使用公钥加密，私钥解密</span>
          </div>
          <button @click="loadBasicExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>中文文本加密</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">你好，RSA加密！</code>
          </div>
          <div class="example-item">
            <span class="example-label">说明：</span>
            <span class="example-desc">支持中文字符加密</span>
          </div>
          <button @click="loadChineseExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>敏感数据加密</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">password: admin123</code>
          </div>
          <div class="example-item">
            <span class="example-label">说明：</span>
            <span class="example-desc">适合加密密码等敏感信息</span>
          </div>
          <button @click="loadSensitiveExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>数字证书场景</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">Certificate: 2024-user-001</code>
          </div>
          <div class="example-item">
            <span class="example-label">说明：</span>
            <span class="example-desc">数字证书和身份验证</span>
          </div>
          <button @click="loadCertExample" class="example-btn">使用此示例</button>
        </div>
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="info-section">
      <h3>功能说明</h3>
      <div class="info-grid">
        <div class="info-card">
          <h4>RSA算法</h4>
          <p>
            RSA是一种非对称加密算法，使用一对密钥：公钥用于加密，私钥用于解密。基于大整数分解的数学难题。
          </p>
          <h5>算法特点：</h5>
          <ul>
            <li>非对称加密，公钥和私钥不同</li>
            <li>公钥可以公开，私钥必须保密</li>
            <li>支持1024、2048、4096位密钥长度</li>
            <li>安全性基于大整数因式分解难题</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>加解密流程</h4>
          <h5>加密过程：</h5>
          <ul>
            <li>使用接收方的公钥加密数据</li>
            <li>只有对应的私钥可以解密</li>
            <li>适合加密少量关键数据</li>
          </ul>
          <h5>解密过程：</h5>
          <ul>
            <li>使用自己的私钥解密数据</li>
            <li>确保数据的机密性和完整性</li>
            <li>验证数据来源的真实性</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>密钥长度选择</h4>
          <ul>
            <li><strong>1024位：</strong>快速但安全性较低，不推荐新应用</li>
            <li><strong>2048位：</strong>平衡安全性和性能，当前主流选择</li>
            <li><strong>4096位：</strong>最高安全性，适合高安全要求场景</li>
          </ul>
          <h5>性能对比：</h5>
          <ul>
            <li>密钥长度越长，安全性越高</li>
            <li>同时加解密时间也会增加</li>
            <li>建议根据实际需求选择合适长度</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>应用场景</h4>
          <ul>
            <li><strong>数字签名：</strong>验证数据的真实性和完整性</li>
            <li><strong>密钥交换：</strong>安全地交换对称加密密钥</li>
            <li><strong>身份认证：</strong>验证用户或系统身份</li>
            <li><strong>SSL/TLS：</strong>HTTPS等安全通信协议</li>
            <li><strong>数字证书：</strong>PKI公钥基础设施</li>
            <li><strong>安全邮件：</strong>PGP等加密邮件系统</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>安全注意事项</h4>
          <ul>
            <li><strong>私钥保护：</strong>私钥必须严格保密，不可泄露</li>
            <li><strong>密钥长度：</strong>推荐使用2048位或更长密钥</li>
            <li><strong>随机数质量：</strong>密钥生成需要高质量随机数</li>
            <li><strong>数据长度限制：</strong>加密数据长度不能超过密钥长度</li>
            <li><strong>混合加密：</strong>大数据建议结合对称加密使用</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>使用限制</h4>
          <p><strong>注意：</strong>本工具提供的RSA功能为简化实现，仅用于演示和学习。</p>
          <h5>使用步骤：</h5>
          <ul>
            <li>1. 点击"生成密钥对"按钮生成公私钥</li>
            <li>2. 输入要加密的文本</li>
            <li>3. 使用公钥加密数据</li>
            <li>4. 将加密结果复制到输入框</li>
            <li>5. 使用对应的私钥解密</li>
          </ul>
          <h5>生产环境建议：</h5>
          <ul>
            <li>使用专业的密码学库</li>
            <li>采用标准的密钥格式</li>
            <li>实施完整的密钥管理</li>
            <li>进行安全性审计和测试</li>
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
import { rsaEncrypt, rsaDecrypt, generateRSAKeyPair } from '@/utils/cryptoUtils'

const toolStore = useToolStore()
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')

// 计算是否可以加密（需要输入文本和公钥）
const canEncrypt = computed(() => {
  return toolStore.rsaInput.trim() && toolStore.rsaPublicKey.trim()
})

// 计算是否可以解密（需要输入文本和私钥）
const canDecrypt = computed(() => {
  return toolStore.rsaInput.trim() && toolStore.rsaPrivateKey.trim()
})

// 示例数据
const examples = {
  basic: 'Hello, RSA!',
  chinese: '你好，RSA加密！',
  sensitive: 'password: admin123',
  cert: 'Certificate: 2024-user-001',
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

// 生成RSA密钥对
const generateKeyPair = () => {
  try {
    const keyPair = generateRSAKeyPair(toolStore.rsaKeySize)
    toolStore.rsaPublicKey = keyPair.publicKey
    toolStore.rsaPrivateKey = keyPair.privateKey
    showStatus(`已生成${toolStore.rsaKeySize}位RSA密钥对`, 'success')
  } catch (error) {
    showStatus('密钥对生成失败：' + (error as Error).message, 'error')
  }
}

// 使用公钥加密
const encryptWithPublicKey = () => {
  try {
    const result = rsaEncrypt(toolStore.rsaInput, toolStore.rsaPublicKey)
    toolStore.rsaOutput = result
    showStatus('RSA公钥加密成功', 'success')
  } catch (error) {
    showStatus('加密失败：' + (error as Error).message, 'error')
  }
}

// 使用私钥解密
const decryptWithPrivateKey = () => {
  try {
    const result = rsaDecrypt(toolStore.rsaInput, toolStore.rsaPrivateKey)
    toolStore.rsaOutput = result
    showStatus('RSA私钥解密成功', 'success')
  } catch (error) {
    showStatus('解密失败：' + (error as Error).message, 'error')
  }
}

// 清空所有内容
const clearAll = () => {
  toolStore.rsaInput = ''
  toolStore.rsaOutput = ''
  toolStore.rsaPublicKey = ''
  toolStore.rsaPrivateKey = ''
  showStatus('已清空所有内容', 'info')
}

// 加载示例
const loadBasicExample = () => {
  toolStore.rsaInput = examples.basic
  showStatus('已加载基础RSA示例', 'info')
}

const loadChineseExample = () => {
  toolStore.rsaInput = examples.chinese
  showStatus('已加载中文文本示例', 'info')
}

const loadSensitiveExample = () => {
  toolStore.rsaInput = examples.sensitive
  showStatus('已加载敏感数据示例', 'info')
}

const loadCertExample = () => {
  toolStore.rsaInput = examples.cert
  showStatus('已加载数字证书示例', 'info')
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

.key-textarea {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 0.8rem;
  font-family: 'Courier New', monospace;
  resize: vertical;
  min-height: 150px;
  line-height: 1.4;
}

.key-textarea:focus {
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

  .key-grid {
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
