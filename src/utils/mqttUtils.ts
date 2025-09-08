import mqtt, { type IClientOptions, type MqttClient } from 'mqtt'
import type {
  MqttMessage,
  MqttSubscription,
  MqttConnectionConfig,
  MqttConnectionState,
  MqttConnectionInfo,
  MqttStats,
} from '@/types'

/**
 * MQTT测试工具类
 * 提供连接管理、消息发布/订阅、性能监控等功能
 * 注重性能优化和内存管理
 */
export class MqttTester {
  private client: MqttClient | null = null
  private config: MqttConnectionConfig
  private stats: MqttStats
  private connectionInfo: MqttConnectionInfo
  private messages: MqttMessage[] = []
  private subscriptions: Map<string, MqttSubscription> = new Map()
  private listeners: Map<string, ((...args: unknown[]) => void)[]> = new Map()
  private isManualDisconnect = false
  private maxMessages = 1000

  constructor(config: Partial<MqttConnectionConfig> = {}) {
    this.config = {
      brokerUrl: 'mqtt://localhost',
      port: 1883,
      clientId: this.generateClientId(),
      keepAlive: 60,
      cleanSession: true,
      reconnectPeriod: 1000,
      connectTimeout: 5000,
      protocol: 'mqtt',
      maxReconnectTimes: 3,
      ...config,
    }

    this.stats = {
      messagesPublished: 0,
      messagesReceived: 0,
      bytesPublished: 0,
      bytesReceived: 0,
      subscriptionCount: 0,
      connectionDuration: 0,
      reconnectCount: 0,
      lastActivity: 0,
    }

    this.connectionInfo = {
      state: 'disconnected',
      brokerUrl: '',
      clientId: this.config.clientId,
      protocol: this.config.protocol,
      reconnectCount: 0,
    }
  }

  /**
   * 连接MQTT代理服务器
   */
  async connect(): Promise<void> {
    if (this.client && this.client.connected) {
      throw new Error('MQTT client is already connected')
    }

    this.isManualDisconnect = false
    this.connectionInfo.state = 'connecting'
    this.connectionInfo.brokerUrl = this.config.brokerUrl
    this.connectionInfo.lastError = undefined
    this.emit('stateChange', this.connectionInfo.state)

    const brokerUrl = this.buildBrokerUrl()

    const options: IClientOptions = {
      clientId: this.config.clientId,
      keepalive: this.config.keepAlive,
      clean: this.config.cleanSession,
      reconnectPeriod: this.config.reconnectPeriod,
      connectTimeout: this.config.connectTimeout,
      username: this.config.username,
      password: this.config.password,
      rejectUnauthorized: false, // 允许自签名证书
    }

    return new Promise((resolve, reject) => {
      try {
        this.client = mqtt.connect(brokerUrl, options)
        this.setupEventListeners(resolve, reject)
      } catch (error) {
        this.handleConnectionError(error as Error)
        reject(error)
      }
    })
  }

  /**
   * 断开MQTT连接
   */
  disconnect(): void {
    this.isManualDisconnect = true

    if (this.client) {
      this.client.end(true)
      this.client = null
    }

    this.connectionInfo.state = 'disconnected'
    this.emit('stateChange', this.connectionInfo.state)
    this.addSystemMessage('连接已断开')
  }

  /**
   * 发布消息到指定主题
   */
  publishMessage(topic: string, payload: string, qos: 0 | 1 | 2 = 0, retain = false): void {
    if (!this.client || !this.client.connected) {
      throw new Error('MQTT client is not connected')
    }

    const message: MqttMessage = {
      id: this.generateMessageId(),
      type: 'published',
      topic,
      payload,
      qos,
      retain,
      timestamp: Date.now(),
      size: new Blob([payload]).size,
    }

    this.client.publish(topic, payload, { qos, retain }, (error) => {
      if (error) {
        this.handlePublishError(error, message)
      } else {
        this.addMessage(message)
        this.updateStats('published', message.size)
        this.emit('messagePublished', message)
      }
    })
  }

  /**
   * 订阅主题
   */
  subscribe(topic: string, qos: 0 | 1 | 2 = 0): void {
    if (!this.client || !this.client.connected) {
      throw new Error('MQTT client is not connected')
    }

    this.client.subscribe(topic, { qos }, (error) => {
      if (error) {
        this.addErrorMessage(`订阅失败: ${error.message}`)
      } else {
        const subscription: MqttSubscription = {
          id: this.generateSubscriptionId(),
          topic,
          qos,
          subscribedAt: Date.now(),
          messageCount: 0,
        }

        this.subscriptions.set(topic, subscription)
        this.stats.subscriptionCount = this.subscriptions.size
        this.addSystemMessage(`已订阅主题: ${topic} (QoS: ${qos})`)
        this.emit('subscribed', subscription)
      }
    })
  }

  /**
   * 取消订阅主题
   */
  unsubscribe(topic: string): void {
    if (!this.client || !this.client.connected) {
      throw new Error('MQTT client is not connected')
    }

    this.client.unsubscribe(topic, (error) => {
      if (error) {
        this.addErrorMessage(`取消订阅失败: ${error.message}`)
      } else {
        this.subscriptions.delete(topic)
        this.stats.subscriptionCount = this.subscriptions.size
        this.addSystemMessage(`已取消订阅主题: ${topic}`)
        this.emit('unsubscribed', topic)
      }
    })
  }

  /**
   * 获取连接信息
   */
  getConnectionInfo(): MqttConnectionInfo {
    return { ...this.connectionInfo }
  }

  /**
   * 获取统计信息
   */
  getStats(): MqttStats {
    if (this.connectionInfo.connectedAt && this.connectionInfo.state === 'connected') {
      this.stats.connectionDuration = Date.now() - this.connectionInfo.connectedAt
    }
    return { ...this.stats }
  }

  /**
   * 获取消息历史
   */
  getMessages(): MqttMessage[] {
    return [...this.messages]
  }

  /**
   * 获取订阅列表
   */
  getSubscriptions(): MqttSubscription[] {
    return Array.from(this.subscriptions.values())
  }

  /**
   * 清空消息历史
   */
  clearMessages(): void {
    this.messages = []
    this.emit('messagesCleared')
  }

  /**
   * 清空所有订阅
   */
  clearAllSubscriptions(): void {
    if (this.client && this.client.connected) {
      const topics = Array.from(this.subscriptions.keys())
      topics.forEach((topic) => this.unsubscribe(topic))
    }
  }

  /**
   * 更新连接配置
   */
  updateConfig(config: Partial<MqttConnectionConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 添加事件监听器
   */
  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  /**
   * 移除事件监听器
   */
  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) return

    if (callback) {
      const callbacks = this.listeners.get(event)!
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    } else {
      this.listeners.delete(event)
    }
  }

  /**
   * 销毁实例，清理资源
   */
  destroy(): void {
    this.disconnect()
    this.listeners.clear()
    this.messages = []
    this.subscriptions.clear()
  }

  // 私有方法

  private buildBrokerUrl(): string {
    const { brokerUrl, port, protocol } = this.config

    // 如果URL已经包含协议，直接使用
    if (brokerUrl.includes('://')) {
      return brokerUrl
    }

    // 根据协议构建完整URL
    let fullUrl = `${protocol}://${brokerUrl}`

    // 添加端口（如果需要）
    if (
      port &&
      ((protocol === 'mqtt' && port !== 1883) ||
        (protocol === 'mqtts' && port !== 8883) ||
        (protocol === 'ws' && port !== 80) ||
        (protocol === 'wss' && port !== 443))
    ) {
      fullUrl += `:${port}`
    }

    // 为WebSocket协议添加默认路径
    if (protocol === 'ws' || protocol === 'wss') {
      if (!fullUrl.includes('/', fullUrl.indexOf('://') + 3)) {
        fullUrl += '/mqtt'
      }
    }

    return fullUrl
  }

  private setupEventListeners(resolve: Function, reject: Function): void {
    if (!this.client) return

    const timeout = setTimeout(() => {
      this.handleConnectionError(new Error('Connection timeout'))
      reject(new Error('Connection timeout'))
    }, this.config.connectTimeout)

    this.client.on('connect', () => {
      clearTimeout(timeout)
      this.handleConnectionOpen()
      resolve()
    })

    this.client.on('message', (topic, payload, packet) => {
      this.handleMessage(topic, payload, packet)
    })

    this.client.on('close', () => {
      this.handleConnectionClose()
    })

    this.client.on('error', (error) => {
      clearTimeout(timeout)
      this.handleConnectionError(error)
      reject(error)
    })

    this.client.on('reconnect', () => {
      this.handleReconnect()
    })

    this.client.on('offline', () => {
      this.handleOffline()
    })
  }

  private handleConnectionOpen(): void {
    this.connectionInfo.state = 'connected'
    this.connectionInfo.connectedAt = Date.now()
    this.connectionInfo.reconnectCount = 0
    this.connectionInfo.lastError = undefined

    this.addSystemMessage('MQTT连接已建立')
    // 重连成功后恢复订阅
    this.resubscribeAll()
    this.emit('stateChange', this.connectionInfo.state)
    this.emit('connected')
  }

  private handleMessage(topic: string, payload: Buffer, packet: any): void {
    const payloadStr = payload.toString()
    const messageSize = payload.length

    const message: MqttMessage = {
      id: this.generateMessageId(),
      type: 'received',
      topic,
      payload: payloadStr,
      qos: packet.qos,
      retain: packet.retain,
      timestamp: Date.now(),
      size: messageSize,
    }

    // 更新订阅统计：支持通配符匹配
    this.subscriptions.forEach((subscription) => {
      if (this.topicMatches(subscription.topic, topic)) {
        subscription.messageCount++
      }
    })

    this.addMessage(message)
    this.updateStats('received', messageSize)
    this.stats.lastActivity = Date.now()
    this.emit('messageReceived', message)
  }

  private handleConnectionClose(): void {
    this.connectionInfo.state = 'disconnected'

    if (
      !this.isManualDisconnect &&
      this.connectionInfo.reconnectCount < this.config.maxReconnectTimes
    ) {
      this.connectionInfo.state = 'reconnecting'
      this.addSystemMessage(
        `连接断开，正在重连... (${this.connectionInfo.reconnectCount + 1}/${this.config.maxReconnectTimes})`,
      )
    } else if (
      !this.isManualDisconnect &&
      this.connectionInfo.reconnectCount >= this.config.maxReconnectTimes
    ) {
      this.addErrorMessage(`重连失败，已达到最大重连次数 (${this.config.maxReconnectTimes})`)
      this.connectionInfo.state = 'error'
      if (this.client) {
        // 达到最大重连次数后强制结束，避免 mqtt.js 继续重连
        this.client.end(true)
      }
    } else {
      this.addSystemMessage('MQTT连接已关闭')
    }

    this.emit('stateChange', this.connectionInfo.state)
    this.emit('disconnected')
  }

  private handleConnectionError(error: Error): void {
    this.connectionInfo.state = 'error'
    this.connectionInfo.lastError = error.message

    this.addErrorMessage(`连接错误: ${error.message}`)
    this.emit('stateChange', this.connectionInfo.state)
    this.emit('error', error)
  }

  private handleReconnect(): void {
    this.connectionInfo.state = 'reconnecting'
    this.connectionInfo.reconnectCount++
    this.stats.reconnectCount++

    this.addSystemMessage(
      `重连尝试 ${this.connectionInfo.reconnectCount}/${this.config.maxReconnectTimes}`,
    )
    this.emit('stateChange', this.connectionInfo.state)

    // 超过最大重连次数后停止重连
    if (this.connectionInfo.reconnectCount > this.config.maxReconnectTimes) {
      if (this.client) {
        this.client.end(true)
      }
      this.connectionInfo.state = 'error'
      this.addErrorMessage(`已超过最大重连次数 (${this.config.maxReconnectTimes})，停止重连`)
      this.emit('stateChange', this.connectionInfo.state)
    }
  }

  private handleOffline(): void {
    this.addSystemMessage('MQTT客户端离线')
  }

  private handlePublishError(error: Error, message: MqttMessage): void {
    const errorMessage: MqttMessage = {
      ...message,
      type: 'error',
      payload: `发布失败: ${error.message}`,
    }

    this.addMessage(errorMessage)
    this.emit('publishError', error)
  }

  private addMessage(message: MqttMessage): void {
    this.messages.push(message)

    // 内存管理：限制消息数量
    if (this.messages.length > this.maxMessages) {
      this.messages.splice(0, this.messages.length - this.maxMessages)
    }
  }

  // 在成功连接后，自动恢复订阅
  private resubscribeAll(): void {
    if (!this.client || !this.client.connected) return
    this.subscriptions.forEach((sub) => {
      this.client!.subscribe(sub.topic, { qos: sub.qos }, (error) => {
        if (error) {
          this.addErrorMessage(`重订阅失败: ${sub.topic} - ${error.message}`)
        } else {
          this.addSystemMessage(`已重订阅: ${sub.topic} (QoS: ${sub.qos})`)
        }
      })
    })
  }

  // 主题匹配（支持 + / # 通配符）
  private topicMatches(filter: string, topic: string): boolean {
    if (filter === topic) return true
    const filterLevels = filter.split('/')
    const topicLevels = topic.split('/')

    for (let i = 0; i < filterLevels.length; i++) {
      const current = filterLevels[i]
      const isLastFilterLevel = i === filterLevels.length - 1
      if (current === '#') {
        return true
      }
      if (current === '+') {
        if (!topicLevels[i]) return false
        continue
      }
      if (current !== topicLevels[i]) {
        return false
      }
      if (isLastFilterLevel && i !== topicLevels.length - 1) {
        return false
      }
    }
    return filterLevels.length === topicLevels.length
  }

  private addSystemMessage(content: string): void {
    const message: MqttMessage = {
      id: this.generateMessageId(),
      type: 'system',
      topic: 'system',
      payload: content,
      qos: 0,
      retain: false,
      timestamp: Date.now(),
      size: 0,
    }
    this.addMessage(message)
  }

  private addErrorMessage(content: string): void {
    const message: MqttMessage = {
      id: this.generateMessageId(),
      type: 'error',
      topic: 'error',
      payload: content,
      qos: 0,
      retain: false,
      timestamp: Date.now(),
      size: 0,
    }
    this.addMessage(message)
  }

  private updateStats(type: 'published' | 'received', size: number): void {
    if (type === 'published') {
      this.stats.messagesPublished++
      this.stats.bytesPublished += size
    } else {
      this.stats.messagesReceived++
      this.stats.bytesReceived += size
    }
  }

  private generateClientId(): string {
    return `mqtt_client_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private emit(event: string, ...args: unknown[]): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(...args)
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }
}

/**
 * 创建MQTT测试器实例
 */
export function createMqttTester(config?: Partial<MqttConnectionConfig>): MqttTester {
  return new MqttTester(config)
}

/**
 * 验证MQTT代理URL格式
 */
export function validateMqttBrokerUrl(url: string): boolean {
  try {
    // 检查是否包含协议
    if (url.includes('://')) {
      const parsed = new URL(url)
      return ['mqtt:', 'mqtts:', 'ws:', 'wss:'].includes(parsed.protocol)
    } else {
      // 简单的域名或IP格式验证
      return /^[a-zA-Z0-9.-]+$/.test(url)
    }
  } catch {
    return false
  }
}

/**
 * 验证MQTT主题格式
 */
export function validateMqttTopic(topic: string): boolean {
  if (!topic || topic.length === 0) return false

  // MQTT主题规则：不能包含+、#在非通配符位置
  // 这里简化验证，主要检查基本格式
  return !/[+#]/.test(topic) || /^[a-zA-Z0-9/_-]+(\+|#)?$/.test(topic)
}

/**
 * 格式化QoS等级描述
 */
export function formatQoSDescription(qos: 0 | 1 | 2): string {
  const descriptions = {
    0: '最多一次 (At most once)',
    1: '至少一次 (At least once)',
    2: '仅一次 (Exactly once)',
  }
  return descriptions[qos]
}
