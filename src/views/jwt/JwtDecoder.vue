<template>
  <ToolPanel title="JWT解析工具" description="解析JWT令牌，查看Header、Payload和Signature信息">
    <!-- 编辑器区域 -->
    <div class="editor-layout">
      <div class="input-section">
        <CodeEditor
          v-model="toolStore.jwtInput"
          language="plaintext"
          title="JWT令牌输入"
          placeholder="请输入JWT令牌 (格式: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c)"
          height="200px"
          :show-clear="true"
          :show-copy="true"
        />
      </div>

      <!-- 操作按钮区域 -->
      <div class="operation-buttons">
        <button
          @click="parseJWT"
          class="btn btn-primary operation-btn"
          :disabled="!toolStore.jwtInput.trim()"
        >
          <span class="btn-icon">🔍</span>
          解析JWT
        </button>
        <button @click="clearAll" class="btn btn-error operation-btn">
          <span class="btn-icon">🗑️</span>
          清空
        </button>
      </div>

      <div class="output-section">
        <CodeEditor
          v-model="toolStore.jwtOutput"
          language="json"
          title="解析结果"
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

    <!-- JWT信息展示 -->
    <div v-if="jwtInfo && jwtInfo.isValid" class="jwt-info-section">
      <h3>JWT详细信息</h3>
      <div class="jwt-parts">
        <div class="jwt-part">
          <h4>Header (算法和令牌类型)</h4>
          <div class="jwt-part-content">
            <pre>{{ jwtInfo.header ? formatJSON(jwtInfo.header) : '{}' }}</pre>
          </div>
        </div>
        <div class="jwt-part">
          <h4>Payload (声明和数据)</h4>
          <div class="jwt-part-content">
            <pre>{{ jwtInfo.payload ? formatJSON(jwtInfo.payload) : '{}' }}</pre>
          </div>
        </div>
        <div class="jwt-part">
          <h4>Signature (签名)</h4>
          <div class="jwt-part-content signature">
            <code>{{ jwtInfo.signature }}</code>
            <p class="signature-note">
              <strong>注意：</strong>签名验证需要密钥，此工具仅解析结构，不验证签名有效性
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 示例区域 -->
    <div class="examples-section">
      <h3>JWT示例</h3>
      <div class="examples-grid">
        <div class="example-card">
          <h4>标准JWT示例</h4>
          <div class="example-info">
            <p><strong>算法：</strong>HS256</p>
            <p><strong>类型：</strong>JWT</p>
            <p><strong>包含：</strong>用户ID、用户名、过期时间</p>
          </div>
          <button @click="loadStandardExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>包含权限的JWT</h4>
          <div class="example-info">
            <p><strong>算法：</strong>RS256</p>
            <p><strong>类型：</strong>JWT</p>
            <p><strong>包含：</strong>用户信息、角色权限</p>
          </div>
          <button @click="loadRoleExample" class="example-btn">使用此示例</button>
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

const toolStore = useToolStore()
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')
interface JwtInfo {
  isValid: boolean
  header?: Record<string, unknown>
  payload?: Record<string, unknown>
  signature?: string
}

const jwtInfo = ref<JwtInfo | null>(null)

// JWT示例数据
const standardJwtExample =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

const roleJwtExample =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEyMzQ1Njc4OTAifQ.eyJzdWIiOiJ1c2VyXzEyMzQ1IiwibmFtZSI6IkFsaWNlIFNtaXRoIiwiZW1haWwiOiJhbGljZUBleGFtcGxlLmNvbSIsInJvbGVzIjpbImFkbWluIiwidXNlciJdLCJwZXJtaXNzaW9ucyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXSwiaWF0IjoxNjMwNTY3ODkwLCJleHAiOjE2MzA2NTQyOTAsImlzcyI6Imh0dHBzOi8vZXhhbXBsZS5jb20iLCJhdWQiOiJodHRwczovL2FwaS5leGFtcGxlLmNvbSJ9.signature_would_be_here'

// 显示状态消息
const showStatus = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  statusMessage.value = message
  statusType.value = type

  // 3秒后自动清除消息
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

// Base64 URL解码函数
const base64UrlDecode = (str: string): string => {
  // 替换URL安全字符
  str = str.replace(/-/g, '+').replace(/_/g, '/')

  // 添加填充
  while (str.length % 4) {
    str += '='
  }

  try {
    // 解码并转换为UTF-8
    return decodeURIComponent(
      atob(str)
        .split('')
        .map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        })
        .join(''),
    )
  } catch {
    throw new Error('无效的Base64编码')
  }
}

// 解析JWT
const parseJWT = () => {
  try {
    const jwt = toolStore.jwtInput.trim()

    if (!jwt) {
      showStatus('请输入JWT令牌', 'error')
      return
    }

    // 检查JWT格式（应该有三个部分，用.分隔）
    const parts = jwt.split('.')
    if (parts.length !== 3) {
      showStatus('JWT格式无效：JWT令牌应包含三个部分，用点号(.)分隔', 'error')
      toolStore.jwtOutput = JSON.stringify(
        {
          error: 'JWT格式无效',
          message: 'JWT令牌应包含Header、Payload和Signature三个部分，用点号(.)分隔',
          received_parts: parts.length,
          expected_parts: 3,
        },
        null,
        2,
      )
      jwtInfo.value = { isValid: false }
      return
    }

    const [headerB64, payloadB64, signature] = parts

    // 解析Header
    let header: Record<string, unknown>
    try {
      const headerStr = base64UrlDecode(headerB64)
      header = JSON.parse(headerStr)
    } catch (error) {
      throw new Error('Header解析失败：' + (error as Error).message)
    }

    // 解析Payload
    let payload: Record<string, unknown>
    try {
      const payloadStr = base64UrlDecode(payloadB64)
      payload = JSON.parse(payloadStr)
    } catch (error) {
      throw new Error('Payload解析失败：' + (error as Error).message)
    }

    // 处理时间戳字段
    const processedPayload = { ...payload }
    const timeFields = ['iat', 'exp', 'nbf']

    timeFields.forEach((field) => {
      if (processedPayload[field]) {
        const timestamp = processedPayload[field] as number
        const date = new Date(timestamp * 1000)
        processedPayload[`${field}_readable`] = date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      }
    })

    // 构建解析结果
    const result = {
      valid: true,
      header: header,
      payload: processedPayload,
      signature: signature,
      algorithm: header.alg || 'unknown',
      type: header.typ || 'unknown',
      issued_at: processedPayload.iat_readable,
      expires_at: processedPayload.exp_readable,
      not_before: processedPayload.nbf_readable,
      raw_parts: {
        header_base64: headerB64,
        payload_base64: payloadB64,
        signature: signature,
      },
    }

    toolStore.jwtOutput = JSON.stringify(result, null, 2)

    jwtInfo.value = {
      isValid: true,
      header: header,
      payload: processedPayload,
      signature: signature,
    }

    showStatus('JWT解析成功', 'success')
  } catch (error) {
    const errorMessage = (error as Error).message
    showStatus('JWT解析失败：' + errorMessage, 'error')

    toolStore.jwtOutput = JSON.stringify(
      {
        error: 'JWT解析失败',
        message: errorMessage,
        help: '请检查JWT格式是否正确，确保包含完整的Header.Payload.Signature结构',
      },
      null,
      2,
    )

    jwtInfo.value = { isValid: false }
  }
}

// 格式化JSON显示
const formatJSON = (obj: Record<string, unknown>): string => {
  return JSON.stringify(obj, null, 2)
}

// 清空所有内容
const clearAll = () => {
  toolStore.jwtInput = ''
  toolStore.jwtOutput = ''
  jwtInfo.value = null
  showStatus('已清空所有内容', 'info')
}

// 加载示例
const loadStandardExample = () => {
  toolStore.jwtInput = standardJwtExample
  showStatus('已加载标准JWT示例', 'info')
}

const loadRoleExample = () => {
  toolStore.jwtInput = roleJwtExample
  showStatus('已加载包含权限的JWT示例', 'info')
}
</script>

<style scoped>
.editor-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.operation-buttons {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  padding: 1rem 0;
  justify-content: center;
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

.input-section,
.output-section {
  width: 100%;
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

.jwt-info-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.jwt-info-section h3 {
  margin: 0 0 1.5rem 0;
  color: var(--color-heading);
  font-size: 1.25rem;
}

.jwt-parts {
  display: grid;
  gap: 1.5rem;
}

.jwt-part {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
}

.jwt-part h4 {
  margin: 0;
  padding: 0.75rem 1rem;
  background-color: var(--color-background-mute);
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 600;
  border-bottom: 1px solid var(--color-border);
}

.jwt-part-content {
  padding: 1rem;
}

.jwt-part-content pre {
  margin: 0;
  color: var(--color-text);
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.signature {
  font-family: 'Monaco', 'Menlo', monospace;
}

.signature code {
  display: block;
  padding: 0.5rem;
  background-color: var(--color-background-mute);
  border-radius: 4px;
  font-size: 0.8rem;
  word-break: break-all;
  margin-bottom: 0.75rem;
}

.signature-note {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-light);
  line-height: 1.4;
}

.examples-section {
  margin-top: 2rem;
}

.examples-section h3 {
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.examples-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.example-card {
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-background-soft);
}

.example-card h4 {
  margin: 0 0 1rem 0;
  color: var(--color-heading);
  font-size: 1rem;
}

.example-info {
  margin-bottom: 1rem;
}

.example-info p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: var(--color-text-light);
}

.example-btn {
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.example-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .operation-buttons {
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .operation-btn {
    min-width: 100px;
    padding: 0.5rem 0.75rem;
  }
}

@media (max-width: 480px) {
  .examples-grid {
    grid-template-columns: 1fr;
  }

  .jwt-info-section {
    padding: 1rem;
  }

  .jwt-part-content {
    padding: 0.75rem;
  }

  .operation-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }

  .operation-btn {
    width: 100%;
    max-width: 200px;
  }
}
</style>
