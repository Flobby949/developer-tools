import type {
  WebSocketMessage,
  WebSocketStats,
  WebSocketConnectionConfig,
  WebSocketConnectionInfo,
} from '@/types'

/**
 * WebSocket测试工具类
 * 提供连接管理、消息处理、性能监控等功能
 * 注重性能优化和内存管理
 */
export class WebSocketTester {
  private ws: WebSocket | null = null
  private config: WebSocketConnectionConfig
  private stats: WebSocketStats
  private connectionInfo: WebSocketConnectionInfo
  private messages: WebSocketMessage[] = []
  private listeners: Map<string, ((...args: unknown[]) => void)[]> = new Map()
  private pingTimer: number | null = null
  private reconnectTimer: number | null = null
  private lastPingTime = 0
  private isManualDisconnect = false

  constructor(config: Partial<WebSocketConnectionConfig> = {}) {
    this.config = {
      url: '',
      protocols: [],
      headers: {},
      timeout: 5000,
      reconnectAttempts: 3,
      reconnectInterval: 1000,
      pingInterval: 60000, // 1分钟ping一次，仅用于保活和连通性检测
      maxMessageSize: 1024 * 1024, // 1MB
      maxMessages: 1000,
      ...config,
    }

    this.stats = {
      messagesReceived: 0,
      messagesSent: 0,
      bytesReceived: 0,
      bytesSent: 0,
      averageLatency: 0,
      maxLatency: 0,
      minLatency: 0,
      connectionDuration: 0,
      lastPingTime: 0,
    }

    this.connectionInfo = {
      state: 'disconnected',
      url: '',
      protocol: '',
      readyState: WebSocket.CLOSED,
      reconnectCount: 0,
    }
  }

  /**
   * 连接WebSocket服务器
   */
  async connect(url: string, protocols?: string[]): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      throw new Error('WebSocket is already connected')
    }

    // 切换连接时清空之前的数据
    if (this.config.url !== url) {
      this.clearMessages()
      this.resetStats()
    }

    this.config.url = url
    if (protocols) {
      this.config.protocols = protocols
    }

    this.isManualDisconnect = false
    this.connectionInfo.state = 'connecting'
    this.connectionInfo.url = url
    this.emit('stateChange', this.connectionInfo.state)

    return new Promise<void>((resolve, reject) => {
      try {
        this.ws = new WebSocket(url, this.config.protocols)
        this.setupEventListeners(resolve, reject)
      } catch (error) {
        this.handleConnectionError(error as Error)
        reject(error)
      }
    })
  }

  /**
   * 断开WebSocket连接
   */
  disconnect(): void {
    this.isManualDisconnect = true
    this.clearTimers()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.connectionInfo.state = 'disconnected'
    this.connectionInfo.readyState = WebSocket.CLOSED
    this.emit('stateChange', this.connectionInfo.state)
    this.addSystemMessage('连接已断开')
  }

  /**
   * 发送消息
   */
  sendMessage(content: string, format: 'text' | 'json' | 'binary' = 'text'): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }

    // 消息大小检查
    const messageSize = new Blob([content]).size
    if (messageSize > this.config.maxMessageSize) {
      throw new Error(
        `Message size (${messageSize} bytes) exceeds maximum allowed size (${this.config.maxMessageSize} bytes)`,
      )
    }

    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: 'sent',
      content,
      timestamp: Date.now(),
      size: messageSize,
      format,
    }

    try {
      if (format === 'binary') {
        const encoder = new TextEncoder()
        this.ws.send(encoder.encode(content))
      } else {
        this.ws.send(content)
      }

      this.addMessage(message)
      this.updateStats('sent', messageSize)
      this.emit('messageSent', message)
    } catch (error) {
      this.handleSendError(error as Error, message)
    }
  }

  /**
   * 发送Ping消息（用于延迟测试）
   */
  sendPing(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    this.lastPingTime = Date.now()
    this.sendMessage(JSON.stringify({ type: 'ping', timestamp: this.lastPingTime }), 'json')
  }

  /**
   * 获取连接信息
   */
  getConnectionInfo(): WebSocketConnectionInfo {
    return { ...this.connectionInfo }
  }

  /**
   * 获取统计信息
   */
  getStats(): WebSocketStats {
    // 实时计算连接时长
    if (this.connectionInfo.connectedAt && this.connectionInfo.state === 'connected') {
      this.stats.connectionDuration = Date.now() - this.connectionInfo.connectedAt
    }
    return { ...this.stats }
  }

  /**
   * 获取消息历史
   */
  getMessages(): WebSocketMessage[] {
    return [...this.messages]
  }

  /**
   * 清空消息历史
   */
  clearMessages(): void {
    this.messages = []
    this.emit('messagesCleared')
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
  }

  // 私有方法

  private setupEventListeners(
    resolve: (value: void | PromiseLike<void>) => void,
    reject: (reason?: unknown) => void,
  ): void {
    if (!this.ws) return

    const timeout = setTimeout(() => {
      this.handleConnectionError(new Error('Connection timeout'))
      reject(new Error('Connection timeout'))
    }, this.config.timeout)

    this.ws.onopen = (event) => {
      clearTimeout(timeout)
      this.handleConnectionOpen(event)
      resolve()
    }

    this.ws.onmessage = (event) => {
      this.handleMessage(event)
    }

    this.ws.onclose = (event) => {
      clearTimeout(timeout)
      this.handleConnectionClose(event)
    }

    this.ws.onerror = (event) => {
      clearTimeout(timeout)
      this.handleConnectionError(event)
      reject(event)
    }
  }

  private handleConnectionOpen(event: Event): void {
    this.connectionInfo.state = 'connected'
    this.connectionInfo.connectedAt = Date.now()
    this.connectionInfo.readyState = WebSocket.OPEN
    this.connectionInfo.protocol = this.ws?.protocol || ''
    this.connectionInfo.reconnectCount = 0
    // 清空之前的错误信息
    this.connectionInfo.lastError = undefined

    this.startPingTimer()
    this.addSystemMessage('连接已建立')
    this.emit('stateChange', this.connectionInfo.state)
    this.emit('connected', event)
  }

  private handleMessage(event: MessageEvent): void {
    const messageSize = event.data instanceof Blob ? event.data.size : new Blob([event.data]).size

    let content: string
    let format: 'text' | 'json' | 'binary' = 'text'

    if (event.data instanceof ArrayBuffer) {
      const decoder = new TextDecoder()
      content = decoder.decode(event.data)
      format = 'binary'
    } else if (typeof event.data === 'string') {
      content = event.data
      try {
        JSON.parse(content)
        format = 'json'

        // 处理Pong响应（延迟计算）
        const parsed = JSON.parse(content)
        if (parsed.type === 'pong' && this.lastPingTime) {
          const latency = Date.now() - this.lastPingTime
          this.updateLatencyStats(latency)
          this.stats.lastPingTime = latency
        }
      } catch {
        format = 'text'
      }
    } else {
      content = String(event.data)
    }

    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: 'received',
      content,
      timestamp: Date.now(),
      size: messageSize,
      format,
    }

    this.addMessage(message)
    this.updateStats('received', messageSize)
    this.emit('messageReceived', message)
  }

  private handleConnectionClose(event: CloseEvent): void {
    this.clearTimers()
    this.connectionInfo.state = 'disconnected'
    this.connectionInfo.readyState = WebSocket.CLOSED

    if (
      !this.isManualDisconnect &&
      this.connectionInfo.reconnectCount < this.config.reconnectAttempts
    ) {
      this.connectionInfo.state = 'reconnecting'
      this.connectionInfo.reconnectCount++
      this.addSystemMessage(
        `连接断开，尝试重连 (${this.connectionInfo.reconnectCount}/${this.config.reconnectAttempts})`,
      )

      this.reconnectTimer = window.setTimeout(() => {
        this.connect(this.config.url, this.config.protocols).catch(() => {
          // 重连失败，继续尝试或放弃
        })
      }, this.config.reconnectInterval)
    } else {
      this.addSystemMessage(`连接已关闭 (代码: ${event.code}, 原因: ${event.reason || '未知'})`)
    }

    this.emit('stateChange', this.connectionInfo.state)
    this.emit('disconnected', event)
  }

  private handleConnectionError(error: Error | Event): void {
    this.connectionInfo.state = 'error'
    this.connectionInfo.lastError = error instanceof Error ? error.message : '连接错误'

    const errorMessage: WebSocketMessage = {
      id: this.generateMessageId(),
      type: 'error',
      content: `连接错误: ${this.connectionInfo.lastError}`,
      timestamp: Date.now(),
      size: 0,
      format: 'text',
    }

    this.addMessage(errorMessage)
    this.emit('stateChange', this.connectionInfo.state)
    this.emit('error', error)
  }

  private handleSendError(error: Error, message: WebSocketMessage): void {
    const errorMessage: WebSocketMessage = {
      ...message,
      type: 'error',
      content: `发送失败: ${error.message}`,
    }

    this.addMessage(errorMessage)
    this.emit('sendError', error)
  }

  private addMessage(message: WebSocketMessage): void {
    this.messages.push(message)

    // 内存管理：限制消息数量
    if (this.messages.length > this.config.maxMessages) {
      this.messages.splice(0, this.messages.length - this.config.maxMessages)
    }
  }

  private addSystemMessage(content: string): void {
    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: 'system',
      content,
      timestamp: Date.now(),
      size: 0,
      format: 'text',
    }
    this.addMessage(message)
  }

  private updateStats(type: 'sent' | 'received', size: number): void {
    if (type === 'sent') {
      this.stats.messagesSent++
      this.stats.bytesSent += size
    } else {
      this.stats.messagesReceived++
      this.stats.bytesReceived += size
    }
  }

  private updateLatencyStats(latency: number): void {
    if (this.stats.minLatency === 0 || latency < this.stats.minLatency) {
      this.stats.minLatency = latency
    }
    if (latency > this.stats.maxLatency) {
      this.stats.maxLatency = latency
    }

    // 计算平均延迟（简单移动平均）
    const totalPings = this.stats.messagesSent
    this.stats.averageLatency =
      (this.stats.averageLatency * (totalPings - 1) + latency) / totalPings
  }

  private resetStats(): void {
    this.stats = {
      messagesReceived: 0,
      messagesSent: 0,
      bytesReceived: 0,
      bytesSent: 0,
      averageLatency: 0,
      maxLatency: 0,
      minLatency: 0,
      connectionDuration: 0,
      lastPingTime: 0,
    }
  }

  private startPingTimer(): void {
    if (this.config.pingInterval > 0) {
      this.pingTimer = window.setInterval(() => {
        this.sendPing()
      }, this.config.pingInterval)
    }
  }

  private clearTimers(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
 * 创建WebSocket测试器实例
 */
export function createWebSocketTester(
  config?: Partial<WebSocketConnectionConfig>,
): WebSocketTester {
  return new WebSocketTester(config)
}

/**
 * 验证WebSocket URL格式
 */
export function validateWebSocketUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'ws:' || parsed.protocol === 'wss:'
  } catch {
    return false
  }
}

/**
 * 格式化字节数
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化延迟时间
 */
export function formatLatency(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * 格式化持续时间
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}
