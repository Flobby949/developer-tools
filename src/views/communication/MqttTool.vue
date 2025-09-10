<template>
  <div class="mqtt-tool">
    <!-- 页面标题 -->
    <div class="tool-header">
      <h1>MQTT 测试工具</h1>
      <p>测试 MQTT 连接，发布和订阅消息，监控连接性能</p>
    </div>

    <!-- 连接配置区域 -->
    <div class="connection-section">
      <div class="config-panel">
        <h3>连接配置</h3>
        <div class="config-form">
          <div class="form-row">
            <div class="form-group">
              <label for="mqtt-url">代理服务器地址</label>
              <div class="url-input-wrapper">
                <div class="protocol-prefix">{{ store.mqttProtocol }}://</div>
                <input
                  id="mqtt-url"
                  :value="urlWithoutProtocol"
                  type="text"
                  placeholder="broker.emqx.io:8083/mqtt"
                  class="form-input url-main-input"
                  :disabled="isConnected"
                  @input="updateFullUrl"
                />
              </div>
              <div class="input-help">
                支持协议：ws://、wss:// (浏览器环境下仅支持WebSocket协议)
              </div>
            </div>
            <div class="form-group">
              <label for="mqtt-port">端口</label>
              <input
                id="mqtt-port"
                v-model.number="store.mqttPort"
                type="number"
                min="1"
                max="65535"
                class="form-input"
                :disabled="isConnected"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="mqtt-protocol">协议</label>
              <select
                id="mqtt-protocol"
                v-model="store.mqttProtocol"
                class="form-select"
                :disabled="isConnected"
                @change="updateUrlProtocol"
              >
                <option value="ws">WebSocket</option>
                <option value="wss">WebSocket Secure</option>
              </select>
            </div>
            <div class="form-group">
              <label for="mqtt-client-id">客户端ID</label>
              <input
                id="mqtt-client-id"
                v-model="store.mqttClientId"
                type="text"
                placeholder="自动生成"
                class="form-input"
                :disabled="isConnected"
              />
            </div>
          </div>

          <!-- 高级配置 -->
          <div class="advanced-config">
            <h4>高级配置</h4>
            <div class="form-row">
              <div class="form-group">
                <label for="mqtt-timeout">连接超时 (ms)</label>
                <input
                  id="mqtt-timeout"
                  v-model.number="store.mqttConnectionConfig.connectTimeout"
                  type="number"
                  min="1000"
                  max="30000"
                  class="form-input"
                  :disabled="isConnected"
                />
              </div>
              <div class="form-group">
                <label for="mqtt-reconnect">重连次数</label>
                <input
                  id="mqtt-reconnect"
                  v-model.number="store.mqttConnectionConfig.maxReconnectTimes"
                  type="number"
                  min="0"
                  max="10"
                  class="form-input"
                  :disabled="isConnected"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="mqtt-keepalive">保活间隔 (s)</label>
                <input
                  id="mqtt-keepalive"
                  v-model.number="store.mqttConnectionConfig.keepAlive"
                  type="number"
                  min="30"
                  max="300"
                  class="form-input"
                  :disabled="isConnected"
                />
              </div>
              <div class="form-group">
                <label for="mqtt-reconnect-period">重连间隔 (ms)</label>
                <input
                  id="mqtt-reconnect-period"
                  v-model.number="store.mqttConnectionConfig.reconnectPeriod"
                  type="number"
                  min="1000"
                  max="10000"
                  class="form-input"
                  :disabled="isConnected"
                />
              </div>
            </div>
          </div>

          <!-- 认证信息 -->
          <div class="auth-section">
            <h4>认证信息 (可选)</h4>
            <div class="form-row">
              <div class="form-group">
                <label for="mqtt-username">用户名</label>
                <input
                  id="mqtt-username"
                  v-model="store.mqttUsername"
                  type="text"
                  class="form-input"
                  :disabled="isConnected"
                />
              </div>
              <div class="form-group">
                <label for="mqtt-password">密码</label>
                <div class="password-input-group">
                  <input
                    id="mqtt-password"
                    v-model="store.mqttPassword"
                    :type="passwordVisible ? 'text' : 'password'"
                    class="form-input password-input"
                    :disabled="isConnected"
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    @click="passwordVisible = !passwordVisible"
                    :disabled="isConnected"
                  >
                    <svg
                      v-if="passwordVisible"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <svg
                      v-else
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="m15 18-.722-3.25" />
                      <path d="m2 2 20 20" />
                      <path d="m9 9-.637 2.89" />
                      <path d="M1 12s4-8 11-8c2.25 0 4.31.736 5.95 1.965" />
                      <path d="m12 5.314 1.294.707" />
                      <path d="M23 12s-4 8-11 8c-1.948 0-3.726-.477-5.204-1.204" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="connect-actions">
            <button
              class="connect-btn"
              :class="{
                'connect-btn--disconnect': isConnected,
                'connect-btn--connecting': isConnecting,
                'connect-btn--error': store.mqttConnectionInfo.state === 'error',
              }"
              :disabled="isConnecting || !isValidConfig"
              @click="handleConnect"
            >
              <span class="connect-btn__icon" v-if="isConnecting">⏳</span>
              <span class="connect-btn__icon" v-else-if="isConnected">✓</span>
              <span class="connect-btn__icon" v-else-if="store.mqttConnectionInfo.state === 'error'"
                >⚠</span
              >
              <span class="connect-btn__icon" v-else>🔌</span>

              <span class="connect-btn__text">
                <span v-if="isConnecting">连接中...</span>
                <span v-else-if="isConnected">断开连接</span>
                <span v-else-if="store.mqttConnectionInfo.state === 'error'">重新连接</span>
                <span v-else>连接</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- 连接状态显示 -->
      <div class="status-panel">
        <h3>连接状态</h3>
        <div class="status-content">
          <div class="status-indicator">
            <div class="status-dot" :class="store.mqttConnectionInfo.state"></div>
            <span class="status-text">{{ getStatusText(store.mqttConnectionInfo.state) }}</span>
          </div>

          <div v-if="isConnected" class="connection-details">
            <div class="detail-item">
              <span>代理服务器:</span>
              <span>{{ store.mqttConnectionInfo.brokerUrl }}</span>
            </div>
            <div class="detail-item">
              <span>客户端ID:</span>
              <span>{{ store.mqttConnectionInfo.clientId }}</span>
            </div>
            <div class="detail-item">
              <span>连接时长:</span>
              <span>{{ formatDuration(store.mqttStats.connectionDuration) }}</span>
            </div>
            <div v-if="store.mqttStats.reconnectCount > 0" class="detail-item">
              <span>重连次数:</span>
              <span>{{ store.mqttStats.reconnectCount }}</span>
            </div>
          </div>

          <div v-if="store.mqttConnectionInfo.state === 'reconnecting'" class="reconnect-info">
            正在重连... ({{ store.mqttConnectionInfo.reconnectCount }}/{{
              store.mqttConnectionConfig.maxReconnectTimes
            }})
          </div>

          <div v-if="store.mqttConnectionInfo.lastError" class="error-message">
            {{ store.mqttConnectionInfo.lastError }}
          </div>
        </div>
      </div>
    </div>

    <!-- 操作区域 -->
    <div v-if="isConnected" class="operations-section">
      <!-- 发布消息 -->
      <div class="publish-panel">
        <h3>发布消息</h3>
        <div class="publish-form">
          <div class="form-row">
            <div class="form-group flex-2">
              <label for="publish-topic">主题</label>
              <input
                id="publish-topic"
                v-model="store.mqttPublishTopic"
                type="text"
                placeholder="例如: sensors/temperature"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="publish-qos">QoS</label>
              <select id="publish-qos" v-model="store.mqttPublishQos" class="form-select">
                <option :value="0">0 - 最多一次</option>
                <option :value="1">1 - 至少一次</option>
                <option :value="2">2 - 仅一次</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="publish-payload">消息内容</label>
            <textarea
              id="publish-payload"
              v-model="store.mqttPublishPayload"
              class="form-textarea"
              placeholder="输入要发布的消息内容..."
              rows="4"
              @keydown.ctrl.enter="publishMessage"
            ></textarea>
          </div>

          <div class="publish-actions">
            <label class="checkbox-label">
              <input v-model="store.mqttPublishRetain" type="checkbox" />
              保留消息
            </label>
            <button
              class="publish-btn"
              :disabled="!store.mqttPublishTopic.trim() || !isConnected"
              @click="publishMessage"
            >
              发布消息
            </button>
          </div>
        </div>
      </div>

      <!-- 订阅管理 -->
      <div class="subscribe-panel">
        <h3>订阅管理</h3>
        <div class="subscribe-form">
          <div class="form-row">
            <div class="form-group flex-2">
              <label for="subscribe-topic">主题</label>
              <input
                id="subscribe-topic"
                v-model="store.mqttSubscribeTopic"
                type="text"
                placeholder="例如: sensors/+ 或 devices/#"
                class="form-input"
                @keyup.enter="subscribeToTopic"
              />
            </div>
            <div class="form-group">
              <label for="subscribe-qos">QoS</label>
              <select id="subscribe-qos" v-model="store.mqttSubscribeQos" class="form-select">
                <option :value="0">0</option>
                <option :value="1">1</option>
                <option :value="2">2</option>
              </select>
            </div>
          </div>

          <button
            class="subscribe-btn"
            :disabled="!store.mqttSubscribeTopic.trim() || !isConnected"
            @click="subscribeToTopic"
          >
            订阅主题
          </button>
        </div>

        <!-- 订阅列表 -->
        <div class="subscriptions-list">
          <h4>当前订阅 ({{ store.mqttSubscriptions.length }})</h4>
          <div v-if="store.mqttSubscriptions.length === 0" class="empty-subscriptions">
            暂无订阅
          </div>
          <div
            v-for="subscription in store.mqttSubscriptions"
            :key="subscription.id"
            class="subscription-item"
          >
            <div class="subscription-info">
              <span class="topic">{{ subscription.topic }}</span>
              <span class="qos-badge">QoS {{ subscription.qos }}</span>
            </div>
            <button class="unsubscribe-btn" @click="unsubscribeFromTopic(subscription.topic)">
              取消订阅
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据展示区域 -->
    <div class="data-section">
      <!-- 性能统计 -->
      <div class="stats-panel">
        <h3>性能统计</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ store.mqttStats.messagesPublished }}</div>
            <div class="stat-label">已发布</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ store.mqttStats.messagesReceived }}</div>
            <div class="stat-label">已接收</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ formatBytes(store.mqttStats.bytesPublished) }}</div>
            <div class="stat-label">发布流量</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ formatBytes(store.mqttStats.bytesReceived) }}</div>
            <div class="stat-label">接收流量</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ store.mqttStats.subscriptionCount }}</div>
            <div class="stat-label">订阅数量</div>
          </div>
        </div>
      </div>

      <!-- 消息历史 -->
      <div class="messages-panel">
        <div class="messages-header">
          <h3>消息历史</h3>
          <div class="message-controls">
            <label class="checkbox-label">
              <input v-model="store.mqttAutoScroll" type="checkbox" />
              自动滚动
            </label>
            <button class="clear-btn" @click="clearMessages">清空消息</button>
          </div>
        </div>

        <div ref="messagesContainer" class="messages-container">
          <div v-if="store.mqttMessages.length === 0" class="empty-messages">暂无消息</div>
          <div
            v-for="message in store.mqttMessages"
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
                <span class="timestamp">{{ formatTimestamp(message.timestamp) }}</span>
                <span v-if="message.type !== 'system'" class="qos">QoS {{ message.qos }}</span>
              </div>
            </div>

            <div v-if="message.type !== 'system'" class="message-topic">
              主题: {{ message.topic }}
            </div>

            <div class="message-content">
              <pre class="text-content">{{ message.payload }}</pre>
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
import { MqttTester } from '@/utils/mqttUtils'
import type { MqttMessage } from '@/types'

const store = useToolStore()

// 组件状态
const mqttTester = ref<MqttTester | null>(null)
const messagesContainer = ref<HTMLElement>()
const toasts = ref<Array<{ id: string; type: 'success' | 'error' | 'info'; message: string }>>([])
const passwordVisible = ref(false)

// 计算属性
const isConnected = computed(() => store.mqttConnectionInfo.state === 'connected')
const isConnecting = computed(() => store.mqttConnectionInfo.state === 'connecting')
const isValidConfig = computed(() => {
  return store.mqttBrokerUrl.trim() !== ''
})

// URL处理相关
const urlWithoutProtocol = computed(() => {
  const currentUrl = store.mqttBrokerUrl
  return currentUrl.replace(/^(ws:\/\/|wss:\/\/)/i, '')
})

// 更新完整URL
const updateFullUrl = (event: Event) => {
  const target = event.target as HTMLInputElement
  const urlPart = target.value
  store.mqttBrokerUrl = `${store.mqttProtocol}://${urlPart}`
}

// 连接处理
const handleConnect = async () => {
  if (isConnected.value) {
    await disconnect()
  } else {
    // 如果是错误状态，清空错误信息和重连计数
    if (store.mqttConnectionInfo.state === 'error') {
      store.mqttConnectionInfo.lastError = undefined
      store.mqttConnectionInfo.reconnectCount = 0
      store.mqttStats.reconnectCount = 0
      // 清空错误消息
      store.mqttMessages.splice(0)
    }
    await connect()
  }
}

// 更新URL协议前缀
const updateUrlProtocol = () => {
  const urlPart = urlWithoutProtocol.value
  store.mqttBrokerUrl = `${store.mqttProtocol}://${urlPart}`
}

// 连接到MQTT代理
const connect = async () => {
  try {
    // 生成客户端ID（如果未提供）
    if (!store.mqttClientId.trim()) {
      store.mqttClientId = `mqtt-client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    // 构建连接配置
    const config = {
      ...store.mqttConnectionConfig,
      brokerUrl: store.mqttBrokerUrl,
      port: store.mqttPort,
      clientId: store.mqttClientId,
      username: store.mqttUsername || undefined,
      password: store.mqttPassword || undefined,
      protocol: store.mqttProtocol,
    }

    store.mqttConnectionInfo.state = 'connecting'
    store.mqttConnectionInfo.brokerUrl = config.brokerUrl
    store.mqttConnectionInfo.clientId = config.clientId
    store.mqttConnectionInfo.protocol = config.protocol

    mqttTester.value = new MqttTester(config)
    setupEventListeners()

    await mqttTester.value.connect()
    showToast('success', '连接成功！')
  } catch (error) {
    console.error('MQTT连接失败:', error)
    const errorMessage = error instanceof Error ? error.message : '连接失败'
    store.mqttConnectionInfo.lastError = errorMessage
    store.mqttConnectionInfo.state = 'disconnected'
    showToast('error', `连接失败: ${errorMessage}`)
  }
}

// 断开连接
const disconnect = async () => {
  try {
    if (mqttTester.value) {
      await mqttTester.value.disconnect()
      mqttTester.value = null
    }
    store.mqttConnectionInfo.state = 'disconnected'
    store.mqttConnectionInfo.lastError = undefined
    store.mqttStats.connectionDuration = 0
    showToast('info', '已断开连接')
  } catch (error) {
    console.error('断开连接失败:', error)
    showToast('error', '断开连接失败')
  }
}

// 发布消息
const publishMessage = async () => {
  if (!isConnected.value || !mqttTester.value) {
    showToast('error', '请先连接到MQTT代理')
    return
  }

  if (!store.mqttPublishTopic.trim()) {
    showToast('error', '请输入主题')
    return
  }

  try {
    mqttTester.value.publishMessage(
      store.mqttPublishTopic,
      store.mqttPublishPayload,
      store.mqttPublishQos,
      store.mqttPublishRetain,
    )
    showToast('success', '消息发布成功')
  } catch (error) {
    console.error('发布消息失败:', error)
    showToast('error', '发布消息失败')
  }
}

// 订阅主题
const subscribeToTopic = async () => {
  if (!isConnected.value || !mqttTester.value) {
    showToast('error', '请先连接到MQTT代理')
    return
  }

  if (!store.mqttSubscribeTopic.trim()) {
    showToast('error', '请输入主题')
    return
  }

  // 检查是否已经订阅
  const existing = store.mqttSubscriptions.find((sub) => sub.topic === store.mqttSubscribeTopic)
  if (existing) {
    showToast('error', '该主题已订阅')
    return
  }

  try {
    mqttTester.value.subscribe(store.mqttSubscribeTopic, store.mqttSubscribeQos)
    showToast('success', `订阅主题 "${store.mqttSubscribeTopic}" 成功`)
    // 清空输入
    store.mqttSubscribeTopic = ''
  } catch (error) {
    console.error('订阅主题失败:', error)
    showToast('error', '订阅主题失败')
  }
}

// 取消订阅
const unsubscribeFromTopic = async (topic: string) => {
  if (!isConnected.value || !mqttTester.value) {
    showToast('error', '请先连接到MQTT代理')
    return
  }

  try {
    mqttTester.value.unsubscribe(topic)
    showToast('success', `取消订阅主题 "${topic}" 成功`)
  } catch (error) {
    console.error('取消订阅失败:', error)
    showToast('error', '取消订阅失败')
  }
}

// 已移除预设代理服务器功能

// 清空消息
const clearMessages = () => {
  store.mqttMessages.splice(0)
  showToast('info', '消息已清空')
}

// 设置事件监听器
const setupEventListeners = () => {
  if (!mqttTester.value) return

  mqttTester.value.on('connected', () => {
    store.mqttConnectionInfo.state = 'connected'
    store.mqttConnectionInfo.lastError = undefined
    addSystemMessage('连接成功')
  })

  mqttTester.value.on('disconnected', () => {
    store.mqttConnectionInfo.state = 'disconnected'
    addSystemMessage('连接已断开')
  })

  mqttTester.value.on('error', (error: unknown) => {
    const errorObj = error as Error
    store.mqttConnectionInfo.lastError = errorObj.message
    addSystemMessage(`错误: ${errorObj.message}`)
  })

  mqttTester.value.on('messageReceived', (message: unknown) => {
    const msg = message as MqttMessage
    store.mqttMessages.push(msg)

    // 更新统计
    store.mqttStats.messagesReceived++
    store.mqttStats.bytesReceived += msg.size
    store.mqttStats.lastActivity = Date.now()

    // 自动滚动
    if (store.mqttAutoScroll) {
      nextTick(() => scrollToBottom())
    }
  })

  mqttTester.value.on('messagePublished', (message: unknown) => {
    const msg = message as MqttMessage
    store.mqttMessages.push(msg)

    // 更新统计
    store.mqttStats.messagesPublished++
    store.mqttStats.bytesPublished += msg.size
    store.mqttStats.lastActivity = Date.now()

    // 自动滚动
    if (store.mqttAutoScroll) {
      nextTick(() => scrollToBottom())
    }
  })

  mqttTester.value.on('subscribed', (subscription: unknown) => {
    const sub_data = subscription as { topic: string; qos: 0 | 1 | 2 }
    const sub = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      topic: sub_data.topic,
      qos: sub_data.qos,
      subscribedAt: Date.now(),
      messageCount: 0,
    }
    store.mqttSubscriptions.push(sub)
    store.mqttStats.subscriptionCount = store.mqttSubscriptions.length
    addSystemMessage(`订阅主题 "${sub_data.topic}" 成功 (QoS ${sub_data.qos})`)
  })

  mqttTester.value.on('unsubscribed', (topic: unknown) => {
    const topicStr = topic as string
    const index = store.mqttSubscriptions.findIndex((sub) => sub.topic === topicStr)
    if (index !== -1) {
      store.mqttSubscriptions.splice(index, 1)
      store.mqttStats.subscriptionCount = store.mqttSubscriptions.length
    }
    addSystemMessage(`取消订阅主题 "${topicStr}" 成功`)
  })

  mqttTester.value.on('stateChange', (state: unknown) => {
    const stateStr = state as string
    if (stateStr === 'reconnecting') {
      store.mqttConnectionInfo.reconnectCount++
      store.mqttStats.reconnectCount++
      addSystemMessage('正在重连...')
    }
  })
}

// 添加系统消息
const addSystemMessage = (content: string) => {
  const message: MqttMessage = {
    id: `sys-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'system',
    topic: '',
    payload: content,
    qos: 0,
    retain: false,
    timestamp: Date.now(),
    size: content.length,
  }
  store.mqttMessages.push(message)

  if (store.mqttAutoScroll) {
    nextTick(() => scrollToBottom())
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Toast 通知
const showToast = (type: 'success' | 'error' | 'info', message: string) => {
  const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  toasts.value.push({ id, type, message })

  // 3秒后自动移除
  setTimeout(() => {
    removeToast(id)
  }, 3000)
}

const removeToast = (id: string) => {
  const index = toasts.value.findIndex((toast) => toast.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

const getToastIcon = (type: string) => {
  switch (type) {
    case 'success':
      return '✓'
    case 'error':
      return '✗'
    case 'info':
    default:
      return 'ℹ'
  }
}

// 工具函数
const getStatusText = (state: string) => {
  switch (state) {
    case 'connected':
      return '已连接'
    case 'connecting':
      return '连接中...'
    case 'disconnected':
      return '未连接'
    case 'reconnecting':
      return '重连中...'
    case 'error':
      return '连接错误'
    default:
      return '未知状态'
  }
}

const getMessageTypeText = (type: string) => {
  switch (type) {
    case 'published':
      return '已发布'
    case 'received':
      return '已接收'
    case 'system':
      return '系统'
    case 'error':
      return '错误'
    default:
      return '未知'
  }
}

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString()
}

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// 连接时长更新
let connectionTimer: number | null = null

const startConnectionTimer = () => {
  const startTime = Date.now()
  connectionTimer = window.setInterval(() => {
    if (isConnected.value) {
      store.mqttStats.connectionDuration = Date.now() - startTime
    }
  }, 1000)
}

const stopConnectionTimer = () => {
  if (connectionTimer) {
    clearInterval(connectionTimer)
    connectionTimer = null
  }
}

// 监听连接状态变化
watch(
  () => store.mqttConnectionInfo.state,
  (newState, oldState) => {
    if (newState === 'connected' && oldState !== 'connected') {
      startConnectionTimer()
    } else if (newState !== 'connected' && oldState === 'connected') {
      stopConnectionTimer()
    }
  },
)

// 生命周期
onMounted(() => {
  // 初始化配置
  store.mqttConnectionConfig.brokerUrl = store.mqttBrokerUrl
  store.mqttConnectionConfig.port = store.mqttPort
  store.mqttConnectionConfig.clientId = store.mqttClientId
  store.mqttConnectionConfig.protocol = store.mqttProtocol
})

onUnmounted(() => {
  // 清理连接
  if (mqttTester.value) {
    mqttTester.value.disconnect()
  }
  stopConnectionTimer()
})
</script>

<style scoped>
.mqtt-tool {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  color: var(--color-text);
}

.tool-header {
  margin-bottom: 32px;
  text-align: center;
}

.tool-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 8px;
}

.tool-header p {
  font-size: 1.1rem;
  color: var(--color-text-2);
  margin: 0;
}

/* 连接配置区域 */
.connection-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

.config-panel,
.status-panel {
  background: var(--color-background-mute);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--color-border);
}

.config-panel h3,
.status-panel h3 {
  margin: 0 0 20px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-heading);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.flex-2 {
  grid-column: span 2;
}

.form-group label {
  font-weight: 500;
  margin-bottom: 6px;
  color: var(--color-text);
  font-size: 0.9rem;
}

.form-input,
.form-select,
.form-textarea {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-brand);
}

.form-input:disabled,
.form-select:disabled {
  background-color: var(--color-background-soft);
  color: var(--color-text-2);
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.input-help {
  font-size: 0.8rem;
  color: var(--color-text-2);
  margin-top: 4px;
  font-style: italic;
}

/* URL输入框和预设选择器 */
.url-input-wrapper {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
  background: var(--color-background);
  transition: border-color 0.2s;
}

.url-input-wrapper:focus-within {
  border-color: var(--color-brand);
}

.protocol-prefix {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: var(--color-background-soft);
  border-right: 1px solid var(--color-border);
  color: var(--color-text-2);
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  user-select: none;
  min-width: fit-content;
}

.url-main-input {
  flex: 1;
  border: none;
  padding: 10px 12px;
  background: transparent;
  color: var(--color-text);
  font-size: 0.9rem;
}

.url-main-input:focus {
  outline: none;
}

.url-main-input:disabled {
  background-color: transparent;
  color: var(--color-text-2);
  cursor: not-allowed;
}

/* 密码输入框 */
.password-input-group {
  position: relative;
  display: block;
}

.password-input {
  padding-right: 48px !important;
  width: 100%;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  color: var(--color-text-2);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  z-index: 1;
}

.password-toggle:hover:not(:disabled) {
  color: var(--color-brand);
  background-color: rgba(102, 126, 234, 0.1);
  transform: translateY(-50%) scale(1.1);
}

.password-toggle:active:not(:disabled) {
  transform: translateY(-50%) scale(0.95);
}

.password-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.password-toggle svg {
  stroke-width: 2;
  transition: all 0.2s ease;
  width: 16px;
  height: 16px;
}

/* 高级配置 */
.advanced-config {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}

.advanced-config h4 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text);
}

/* 连接按钮 */
.connect-actions {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.connect-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 140px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  position: relative;
  overflow: hidden;
}

.connect-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.connect-btn:hover:not(:disabled)::before {
  left: 100%;
}

.connect-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
}

.connect-btn:active:not(:disabled) {
  transform: translateY(0);
}

.connect-btn:disabled {
  background: linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%);
  color: #ecf0f1;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.connect-btn--disconnect {
  background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%);
  box-shadow: 0 4px 15px rgba(253, 121, 168, 0.4);
}

.connect-btn--disconnect:hover:not(:disabled) {
  box-shadow: 0 8px 25px rgba(253, 121, 168, 0.6);
}

.connect-btn--connecting {
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
  cursor: wait;
  box-shadow: 0 4px 15px rgba(116, 185, 255, 0.4);
}

.connect-btn--connecting .connect-btn__icon {
  animation: spin 1s linear infinite;
}

.connect-btn--error {
  background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%);
  box-shadow: 0 4px 15px rgba(253, 203, 110, 0.4);
}

.connect-btn--error:hover:not(:disabled) {
  box-shadow: 0 8px 25px rgba(253, 203, 110, 0.6);
}

.connect-btn__icon {
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.connect-btn__text {
  font-weight: 600;
  letter-spacing: 0.5px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 连接状态 */
.status-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #6c757d;
  transition: background-color 0.2s;
}

.status-dot.connected {
  background: #28a745;
  animation: pulse 2s infinite;
}

.status-dot.connecting {
  background: #ffc107;
  animation: pulse 1s infinite;
}

.status-dot.reconnecting {
  background: #fd7e14;
  animation: pulse 0.5s infinite;
}

.status-dot.error {
  background: #dc3545;
  animation: pulse 2s infinite;
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
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.detail-item span:first-child {
  color: var(--color-text-2);
}

.detail-item span:last-child {
  font-weight: 500;
  color: var(--color-text);
}

.error-message {
  padding: 8px 12px;
  background: #f8d7da;
  color: #721c24;
  border-radius: 6px;
  font-size: 0.9rem;
  border: 1px solid #f5c6cb;
}

.reconnect-info {
  padding: 8px 12px;
  background: #d1ecf1;
  color: #0c5460;
  border-radius: 6px;
  font-size: 0.9rem;
  border: 1px solid #bee5eb;
  text-align: center;
  font-weight: 500;
}

/* 操作区域 */
.operations-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

.publish-panel,
.subscribe-panel {
  background: var(--color-background-mute);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--color-border);
}

.publish-panel h3,
.subscribe-panel h3 {
  margin: 0 0 20px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-heading);
}

.publish-actions,
.subscribe-form > button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--color-text);
  cursor: pointer;
}

.checkbox-label input[type='checkbox'] {
  margin: 0;
}

.publish-btn,
.subscribe-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  letter-spacing: 0.5px;
  text-transform: none;
}

.publish-btn:hover:not(:disabled),
.subscribe-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
}

.publish-btn:active:not(:disabled),
.subscribe-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.publish-btn:disabled,
.subscribe-btn:disabled {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
  color: #f3f4f6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 订阅列表 */
.subscriptions-list {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}

.subscriptions-list h4 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text);
}

.empty-subscriptions {
  text-align: center;
  color: var(--color-text-2);
  font-style: italic;
  padding: 20px;
}

.subscription-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-bottom: 8px;
}

.subscription-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topic {
  font-weight: 500;
  color: var(--color-text);
}

.qos-badge {
  background: var(--color-brand-light);
  color: var(--color-brand);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.unsubscribe-btn {
  padding: 6px 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.unsubscribe-btn:hover {
  background: #c82333;
}

/* 数据展示区域 */
.data-section {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
}

.stats-panel,
.messages-panel {
  background: var(--color-background-mute);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--color-border);
}

.stats-panel h3,
.messages-panel h3 {
  margin: 0 0 20px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-heading);
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
  background: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-brand);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--color-text-2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 消息历史 */
.messages-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.message-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.clear-btn {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-btn:hover {
  background: #5a6268;
}

.messages-container {
  height: 400px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  background: var(--color-background);
}

.empty-messages {
  text-align: center;
  color: var(--color-text-2);
  font-style: italic;
  padding: 40px 20px;
}

.message-item {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #6c757d;
  background: var(--color-background-soft);
}

.message-item.published {
  border-left-color: #28a745;
}

.message-item.received {
  border-left-color: #007bff;
}

.message-item.system {
  border-left-color: #ffc107;
}

.message-item.error {
  border-left-color: #dc3545;
}

.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
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
  background: #6c757d;
}

.type-indicator.published {
  background: #28a745;
}

.type-indicator.received {
  background: #007bff;
}

.type-indicator.system {
  background: #ffc107;
}

.type-indicator.error {
  background: #dc3545;
}

.type-text {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text);
  text-transform: uppercase;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--color-text-2);
}

.qos {
  background: var(--color-background-mute);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
}

.message-topic {
  font-size: 0.9rem;
  color: var(--color-text-2);
  margin-bottom: 8px;
  font-style: italic;
}

.message-content {
  margin-top: 8px;
}

.text-content {
  background: var(--color-background);
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  color: var(--color-text);
}

/* Toast 通知 */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-left: 4px solid #007bff;
  animation: slideIn 0.3s ease-out;
}

.toast.success {
  border-left-color: #28a745;
}

.toast.error {
  border-left-color: #dc3545;
}

.toast.info {
  border-left-color: #17a2b8;
}

.toast-content {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 8px;
}

.toast-icon {
  font-weight: bold;
  font-size: 1.1rem;
}

.toast.success .toast-icon {
  color: #28a745;
}

.toast.error .toast-icon {
  color: #dc3545;
}

.toast.info .toast-icon {
  color: #17a2b8;
}

.toast-message {
  flex: 1;
  font-size: 0.9rem;
  color: var(--color-text);
}

.toast-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--color-text-2);
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-close:hover {
  color: var(--color-text);
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

/* 响应式设计 */
@media (max-width: 1200px) {
  .connection-section,
  .operations-section {
    grid-template-columns: 1fr;
  }

  .data-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .mqtt-tool {
    padding: 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .messages-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .message-controls {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .tool-header h1 {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .toast {
    left: 20px;
    right: 20px;
    top: 20px;
  }
}
</style>
