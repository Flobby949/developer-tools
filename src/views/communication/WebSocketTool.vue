<template>
  <div class="websocket-tool">
    <!-- 页面标题 -->
    <div class="tool-header">
      <h1>WebSocket 测试工具</h1>
      <p>测试 WebSocket 连接，发送和接收消息，监控连接性能</p>
    </div>

    <!-- 连接配置区域 -->
    <div class="connection-section">
      <div class="config-panel">
        <h3>连接配置</h3>
        <div class="config-form">
          <div class="form-group">
            <label for="ws-url">WebSocket URL</label>
            <div class="url-input-group">
              <input
                id="ws-url"
                v-model="store.wsUrl"
                type="text"
                placeholder="ws://localhost:8080 或 wss://example.com/ws"
                class="url-input"
                :disabled="isConnected"
                @keyup.enter="handleConnect"
              />
              <button
                class="connect-btn"
                :class="{ disconnect: isConnected, connecting: isConnecting }"
                :disabled="isConnecting || !isValidUrl"
                @click="handleConnect"
              >
                <span v-if="isConnecting">连接中...</span>
                <span v-else-if="isConnected">断开连接</span>
                <span v-else>连接</span>
              </button>
            </div>
          </div>

          <!-- 高级配置 -->
          <div class="advanced-config" :class="{ expanded: showAdvanced }">
            <button class="toggle-advanced" @click="showAdvanced = !showAdvanced">
              高级配置
              <span class="toggle-icon" :class="{ rotated: showAdvanced }">▼</span>
            </button>

            <div v-show="showAdvanced" class="advanced-options">
              <div class="form-group">
                <label>子协议 (可选)</label>
                <input
                  v-model="protocolsInput"
                  type="text"
                  placeholder="protocol1, protocol2"
                  :disabled="isConnected"
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>连接超时 (ms)</label>
                  <input
                    v-model.number="store.wsConnectionConfig.timeout"
                    type="number"
                    min="1000"
                    max="30000"
                    :disabled="isConnected"
                  />
                </div>
                <div class="form-group">
                  <label>重连次数</label>
                  <input
                    v-model.number="store.wsConnectionConfig.reconnectAttempts"
                    type="number"
                    min="0"
                    max="10"
                    :disabled="isConnected"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 连接状态显示 -->
      <div class="status-panel">
        <h3>连接状态</h3>
        <div class="status-content">
          <div class="status-indicator">
            <div class="status-dot" :class="store.wsConnectionInfo.state"></div>
            <span class="status-text">{{ getStatusText(store.wsConnectionInfo.state) }}</span>
          </div>

          <div v-if="isConnected" class="connection-details">
            <div class="detail-item">
              <span>协议:</span>
              <span>{{ store.wsConnectionInfo.protocol || 'none' }}</span>
            </div>
            <div class="detail-item">
              <span>连接时长:</span>
              <span>{{ formatDuration(store.wsStats.connectionDuration) }}</span>
            </div>
            <div v-if="store.wsConnectionInfo.reconnectCount > 0" class="detail-item">
              <span>重连次数:</span>
              <span>{{ store.wsConnectionInfo.reconnectCount }}</span>
            </div>
          </div>

          <div v-if="store.wsConnectionInfo.lastError" class="error-message">
            {{ store.wsConnectionInfo.lastError }}
          </div>
        </div>
      </div>
    </div>

    <!-- 消息发送区域 -->
    <div v-if="isConnected" class="message-input-section">
      <h3>发送消息</h3>
      <div class="message-form">
        <div class="message-controls">
          <div class="format-selector">
            <label>格式:</label>
            <select v-model="store.wsMessageFormat">
              <option value="text">文本</option>
              <option value="json">JSON</option>
              <option value="binary">二进制</option>
            </select>
          </div>

          <button class="ping-btn" @click="sendPing" :disabled="!isConnected">Ping 测试</button>
        </div>

        <div class="message-input-group">
          <textarea
            v-model="store.wsMessageInput"
            class="message-input"
            placeholder="输入要发送的消息..."
            rows="4"
            @keydown.ctrl.enter="sendMessage"
          ></textarea>
          <div class="input-actions">
            <div class="message-info">
              <span>{{ getMessageSize(store.wsMessageInput) }}</span>
              <span class="shortcut-hint">Ctrl+Enter 发送</span>
            </div>
            <button
              class="send-btn"
              :disabled="!store.wsMessageInput.trim() || !isConnected"
              @click="sendMessage"
            >
              发送消息
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 消息历史和性能统计 -->
    <div class="data-section">
      <!-- 性能统计 -->
      <div class="stats-panel">
        <h3>性能统计</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ store.wsStats.messagesSent }}</div>
            <div class="stat-label">已发送</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ store.wsStats.messagesReceived }}</div>
            <div class="stat-label">已接收</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ formatBytes(store.wsStats.bytesSent) }}</div>
            <div class="stat-label">发送流量</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ formatBytes(store.wsStats.bytesReceived) }}</div>
            <div class="stat-label">接收流量</div>
          </div>
          <div v-if="store.wsStats.averageLatency > 0" class="stat-item">
            <div class="stat-value">{{ formatLatency(store.wsStats.averageLatency) }}</div>
            <div class="stat-label">平均延迟</div>
          </div>
          <div v-if="store.wsStats.lastPingTime > 0" class="stat-item">
            <div class="stat-value">{{ formatLatency(store.wsStats.lastPingTime) }}</div>
            <div class="stat-label">最新Ping</div>
          </div>
        </div>
      </div>

      <!-- 消息历史 -->
      <div class="messages-panel">
        <div class="messages-header">
          <h3>消息历史</h3>
          <div class="message-controls">
            <label class="checkbox-label">
              <input v-model="store.wsAutoScroll" type="checkbox" />
              自动滚动
            </label>
            <label class="checkbox-label">
              <input v-model="store.wsShowTimestamp" type="checkbox" />
              显示时间
            </label>
            <label class="checkbox-label">
              <input v-model="store.wsShowMessageSize" type="checkbox" />
              显示大小
            </label>
            <button class="clear-btn" @click="clearMessages">清空消息</button>
          </div>
        </div>

        <div ref="messagesContainer" class="messages-container">
          <div v-if="store.wsMessages.length === 0" class="empty-messages">暂无消息</div>
          <div
            v-for="message in store.wsMessages"
            :key="message.id"
            class="message-item"
            :class="message.type"
          >
            <div class="message-header">
              <div class="message-type">
                <span class="type-indicator" :class="message.type"></span>
                <span class="type-text">{{ getMessageTypeText(message.type) }}</span>
              </div>

              <div class="message-meta">
                <span v-if="store.wsShowTimestamp" class="timestamp">
                  {{ formatTimestamp(message.timestamp) }}
                </span>
                <span v-if="store.wsShowMessageSize && message.size > 0" class="size">
                  {{ formatBytes(message.size) }}
                </span>
                <span class="format">{{ message.format }}</span>
              </div>
            </div>

            <div class="message-content">
              <pre v-if="message.format === 'json'" class="json-content">{{
                formatJson(message.content)
              }}</pre>
              <pre v-else class="text-content">{{ message.content }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast 通知 -->
    <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
      <div class="toast-content">
        <span class="toast-icon">{{ getToastIcon(toast.type) }}</span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" @click="removeToast(toast.id)">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useToolStore } from '@/stores/tool'
import {
  WebSocketTester,
  validateWebSocketUrl,
  formatBytes,
  formatLatency,
  formatDuration,
} from '@/utils/websocketUtils'
import type { WebSocketMessage } from '@/types'

// 组件状态
const store = useToolStore()
const wsTester = ref<WebSocketTester | null>(null)
const showAdvanced = ref(false)
const protocolsInput = ref('')
const messagesContainer = ref<HTMLElement>()
const toasts = ref<Array<{ id: string; type: string; message: string }>>([])
const statsUpdateTimer = ref<number | null>(null)

// 计算属性
const isConnected = computed(() => store.wsConnectionInfo.state === 'connected')
const isConnecting = computed(() => store.wsConnectionInfo.state === 'connecting')
const isValidUrl = computed(() => validateWebSocketUrl(store.wsUrl))

// 初始化
onMounted(() => {
  wsTester.value = new WebSocketTester(store.wsConnectionConfig)
  setupEventListeners()
  startStatsUpdateTimer()
})

onUnmounted(() => {
  if (wsTester.value) {
    wsTester.value.destroy()
  }
  stopStatsUpdateTimer()
})

// 监听消息变化，实现自动滚动
watch(
  () => store.wsMessages.length,
  () => {
    if (store.wsAutoScroll) {
      nextTick(() => {
        scrollToBottom()
      })
    }
  },
)

// 设置事件监听器
function setupEventListeners() {
  if (!wsTester.value) return

  wsTester.value.on('stateChange', (...args: unknown[]) => {
    const state = args[0] as string
    store.wsConnectionInfo.state = state as
      | 'disconnected'
      | 'connecting'
      | 'connected'
      | 'reconnecting'
      | 'error'
  })

  wsTester.value.on('connected', () => {
    store.wsConnectionInfo = wsTester.value!.getConnectionInfo()
    showToast('success', '连接成功')
    // 连接成功后即时更新一次统计信息
    updateStats()
  })

  wsTester.value.on('disconnected', () => {
    store.wsConnectionInfo = wsTester.value!.getConnectionInfo()
    showToast('info', '连接已断开')
    // 断开连接后最后更新一次统计信息
    updateStats()
  })

  wsTester.value.on('error', (...args: unknown[]) => {
    const error = args[0] as Error | Event
    store.wsConnectionInfo = wsTester.value!.getConnectionInfo()
    const message = error instanceof Error ? error.message : '未知错误'
    showToast('error', `连接错误: ${message}`)
  })

  wsTester.value.on('messageReceived', (...args: unknown[]) => {
    const message = args[0] as WebSocketMessage
    store.wsMessages.push(message)
    updateStats()
  })

  wsTester.value.on('messageSent', (...args: unknown[]) => {
    const message = args[0] as WebSocketMessage
    store.wsMessages.push(message)
    updateStats()
  })

  wsTester.value.on('sendError', (...args: unknown[]) => {
    const error = args[0] as Error
    showToast('error', `发送失败: ${error.message}`)
  })

  wsTester.value.on('messagesCleared', () => {
    store.wsMessages = []
  })
}

// 连接/断开连接
async function handleConnect() {
  if (!wsTester.value) return

  if (isConnected.value) {
    wsTester.value.disconnect()
    return
  }

  try {
    // 解析子协议
    const protocols = protocolsInput.value
      ? protocolsInput.value
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p)
      : []

    await wsTester.value.connect(store.wsUrl, protocols)
  } catch (error) {
    const message = error instanceof Error ? error.message : '连接失败'
    showToast('error', `连接失败: ${message}`)
  }
}

// 发送消息
function sendMessage() {
  if (!wsTester.value || !store.wsMessageInput.trim()) return

  try {
    wsTester.value.sendMessage(store.wsMessageInput, store.wsMessageFormat)
    store.wsMessageInput = ''
  } catch (error) {
    const message = error instanceof Error ? error.message : '发送失败'
    showToast('error', `发送失败: ${message}`)
  }
}

// 发送Ping消息
function sendPing() {
  if (!wsTester.value) return
  wsTester.value.sendPing()
}

// 清空消息
function clearMessages() {
  if (wsTester.value) {
    wsTester.value.clearMessages()
    store.wsMessages = []
  }
}

// 更新统计信息
function updateStats() {
  if (wsTester.value) {
    store.wsStats = wsTester.value.getStats()
  }
}

// 启动统计信息更新定时器（每秒更新连接时长）
function startStatsUpdateTimer() {
  statsUpdateTimer.value = window.setInterval(() => {
    // 仅在连接状态时更新统计信息
    if (isConnected.value) {
      updateStats()
    }
  }, 1000) // 每秒更新一次
}

// 停止统计信息更新定时器
function stopStatsUpdateTimer() {
  if (statsUpdateTimer.value) {
    clearInterval(statsUpdateTimer.value)
    statsUpdateTimer.value = null
  }
}

// 滚动到底部
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 格式化函数
function getStatusText(state: string): string {
  const statusMap = {
    disconnected: '未连接',
    connecting: '连接中',
    connected: '已连接',
    reconnecting: '重连中',
    error: '连接错误',
  }
  return statusMap[state as keyof typeof statusMap] || '未知状态'
}

function getMessageTypeText(type: string): string {
  const typeMap = {
    sent: '发送',
    received: '接收',
    error: '错误',
    system: '系统',
  }
  return typeMap[type as keyof typeof typeMap] || '未知'
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString()
}

function formatJson(content: string): string {
  try {
    return JSON.stringify(JSON.parse(content), null, 2)
  } catch {
    return content
  }
}

function getMessageSize(content: string): string {
  const size = new Blob([content]).size
  return formatBytes(size)
}

// Toast 通知
function showToast(type: 'success' | 'error' | 'info', message: string) {
  const id = Date.now().toString()
  toasts.value.push({ id, type, message })

  // 自动移除 Toast
  const timeout = type === 'error' ? 4000 : 2000
  setTimeout(() => {
    removeToast(id)
  }, timeout)
}

function removeToast(id: string) {
  const index = toasts.value.findIndex((toast) => toast.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

function getToastIcon(type: string): string {
  const iconMap = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }
  return iconMap[type as keyof typeof iconMap] || 'ℹ'
}
</script>

<style scoped>
.websocket-tool {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.tool-header {
  text-align: center;
  margin-bottom: 30px;
}

.tool-header h1 {
  color: var(--color-heading);
  margin-bottom: 8px;
}

.tool-header p {
  color: var(--color-text-lighter);
  font-size: 14px;
}

/* 连接配置区域 */
.connection-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.config-panel,
.status-panel {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
}

.config-panel h3,
.status-panel h3 {
  margin: 0 0 16px 0;
  color: var(--color-heading);
  font-size: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: var(--color-text);
  font-size: 14px;
}

.url-input-group {
  display: flex;
  gap: 12px;
}

.url-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  background: var(--color-background);
  color: var(--color-text);
}

.url-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.url-input:disabled {
  background-color: var(--color-background-mute);
  color: var(--color-text-lighter);
}

.connect-btn {
  padding: 10px 20px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  min-width: 100px;
}

.connect-btn:hover:not(:disabled) {
  background: #219a52;
}

.connect-btn.disconnect {
  background: #e74c3c;
}

.connect-btn.disconnect:hover:not(:disabled) {
  background: #c0392b;
}

.connect-btn.connecting {
  background: #f39c12;
  cursor: not-allowed;
}

.connect-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

/* 高级配置 */
.advanced-config {
  margin-top: 12px;
}

.toggle-advanced {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.toggle-icon {
  transition: transform 0.2s;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.advanced-options {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.advanced-options input {
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 14px;
  background: var(--color-background);
  color: var(--color-text);
}

/* 状态面板 */
.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-text-lighter);
}

.status-dot.connected {
  background: #27ae60;
  animation: pulse 2s infinite;
}

.status-dot.connecting,
.status-dot.reconnecting {
  background: #f39c12;
  animation: pulse 1s infinite;
}

.status-dot.error {
  background: #e74c3c;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-text {
  font-weight: 500;
  color: var(--color-text);
}

.connection-details {
  font-size: 13px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  color: var(--color-text-light);
}

.error-message {
  color: var(--color-danger);
  font-size: 13px;
  margin-top: 8px;
  padding: 8px;
  background: var(--color-danger-light);
  border-radius: 4px;
}

/* 消息发送区域 */
.message-input-section {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.message-form h3 {
  margin: 0 0 16px 0;
  color: var(--color-heading);
  font-size: 16px;
}

.message-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.format-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.format-selector select {
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 14px;
  background: var(--color-background);
  color: var(--color-text);
}

.ping-btn {
  padding: 6px 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.ping-btn:hover:not(:disabled) {
  background: #2980b9;
}

.ping-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.message-input-group {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
}

.message-input {
  width: 100%;
  padding: 12px;
  border: none;
  resize: vertical;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
  line-height: 1.4;
  background: var(--color-background);
  color: var(--color-text);
}

.message-input:focus {
  outline: none;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--color-background-soft);
  border-top: 1px solid var(--color-border);
}

.message-info {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: var(--color-text-lighter);
}

.shortcut-hint {
  font-style: italic;
}

.send-btn {
  padding: 6px 16px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.send-btn:hover:not(:disabled) {
  background: #219a52;
}

.send-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

/* 数据展示区域 */
.data-section {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
}

.stats-panel,
.messages-panel {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
}

/* 性能统计 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: var(--color-background-soft);
  border-radius: 6px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-lighter);
  text-transform: uppercase;
}

/* 消息历史 */
.messages-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.messages-header h3 {
  margin: 0;
  color: var(--color-heading);
  font-size: 16px;
}

.message-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--color-text-light);
  cursor: pointer;
}

.clear-btn {
  padding: 4px 8px;
  background: var(--color-danger);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.clear-btn:hover {
  background: var(--color-danger-hover);
}

.messages-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.empty-messages {
  padding: 40px;
  text-align: center;
  color: var(--color-text-lighter);
  font-style: italic;
}

.message-item {
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
  font-size: 13px;
}

.message-item:last-child {
  border-bottom: none;
}

.message-item.sent {
  background: var(--color-primary-light);
}

.message-item.received {
  background: var(--color-success-light);
}

.message-item.error {
  background: var(--color-danger-light);
}

.message-item.system {
  background: var(--color-background-mute);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.message-type {
  display: flex;
  align-items: center;
  gap: 6px;
}

.type-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-text-lighter);
}

.type-indicator.sent {
  background: #3498db;
}

.type-indicator.received {
  background: #27ae60;
}

.type-indicator.error {
  background: #e74c3c;
}

.type-indicator.system {
  background: #95a5a6;
}

.type-text {
  font-weight: 500;
  color: var(--color-text);
}

.message-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: var(--color-text-lighter);
}

.message-content {
  margin-left: 14px;
}

.json-content,
.text-content {
  margin: 0;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
}

.json-content {
  color: var(--color-text);
}

/* Toast 通知 */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  min-width: 300px;
  margin-bottom: 10px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast.success {
  background: #27ae60;
  color: white;
}

.toast.error {
  background: #e74c3c;
  color: white;
}

.toast.info {
  background: #3498db;
  color: white;
}

.toast-content {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 8px;
}

.toast-icon {
  font-weight: bold;
}

.toast-message {
  flex: 1;
  font-size: 14px;
}

.toast-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-close:hover {
  opacity: 0.7;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .connection-section {
    grid-template-columns: 1fr;
  }

  .data-section {
    grid-template-columns: 1fr;
  }

  .url-input-group {
    flex-direction: column;
  }

  .connect-btn {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .message-controls {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .toast {
    left: 20px;
    right: 20px;
    min-width: auto;
  }
}
</style>
