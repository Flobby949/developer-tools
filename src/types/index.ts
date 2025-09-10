// 工具类型定义

export interface ToolItem {
  name: string
  path: string
  icon?: string
  description?: string
}

export interface ToolCategory {
  title: string
  tools: ToolItem[]
}

// JSON工具相关类型
export interface JsonTool {
  format: (json: string) => string
  compress: (json: string) => string
  toEntity: (json: string, language: string) => string
}

// 编码转换相关类型
export interface EncodeTool {
  urlEncode: (text: string) => string
  urlDecode: (text: string) => string
  base64Encode: (text: string) => string
  base64Decode: (text: string) => string
}

// 正则表达式相关类型
export interface RegexResult {
  match: boolean
  matches: string[]
  groups?: { [key: string]: string }
}

// YAML工具相关类型
export interface YamlTool {
  yamlToProperties: (yaml: string) => string
  propertiesToYaml: (properties: string) => string
}

// WebSocket工具相关类型
export interface WebSocketMessage {
  id: string
  type: 'sent' | 'received' | 'error' | 'system'
  content: string
  timestamp: number
  size: number
  format: 'text' | 'json' | 'binary'
}

export interface WebSocketStats {
  messagesReceived: number
  messagesSent: number
  bytesReceived: number
  bytesSent: number
  averageLatency: number
  maxLatency: number
  minLatency: number
  connectionDuration: number
  lastPingTime: number
}

export interface WebSocketConnectionConfig {
  url: string
  protocols: string[]
  headers: Record<string, string>
  timeout: number
  reconnectAttempts: number
  reconnectInterval: number
  pingInterval: number
  maxMessageSize: number
  maxMessages: number
}

export type WebSocketConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'

export interface WebSocketConnectionInfo {
  state: WebSocketConnectionState
  url: string
  protocol: string
  readyState: number
  lastError?: string
  connectedAt?: number
  reconnectCount: number
}

// MQTT工具相关类型
export interface MqttMessage {
  id: string
  type: 'published' | 'received' | 'system' | 'error'
  topic: string
  payload: string
  qos: 0 | 1 | 2
  retain: boolean
  timestamp: number
  size: number
}

export interface MqttSubscription {
  id: string
  topic: string
  qos: 0 | 1 | 2
  subscribedAt: number
  messageCount: number
}

export interface MqttConnectionConfig {
  brokerUrl: string
  port: number
  clientId: string
  username?: string
  password?: string
  keepAlive: number
  cleanSession: boolean
  reconnectPeriod: number
  connectTimeout: number
  protocol: 'ws' | 'wss'
  maxReconnectTimes: number
}

export interface MqttStats {
  messagesPublished: number
  messagesReceived: number
  bytesPublished: number
  bytesReceived: number
  subscriptionCount: number
  connectionDuration: number
  reconnectCount: number
  lastActivity: number
}

export type MqttConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'

export interface MqttConnectionInfo {
  state: MqttConnectionState
  brokerUrl: string
  clientId: string
  protocol: string
  lastError?: string
  connectedAt?: number
  reconnectCount: number
}
