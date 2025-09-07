import { ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  WebSocketMessage,
  WebSocketStats,
  WebSocketConnectionConfig,
  WebSocketConnectionInfo,
  MqttMessage,
  MqttSubscription,
  MqttConnectionConfig,
  MqttConnectionInfo,
  MqttStats,
} from '@/types'

export const useToolStore = defineStore('tool', () => {
  // JSON格式化工具相关状态
  const jsonFormatterInput = ref('')
  const jsonFormatterOutput = ref('')

  // JSON转实体类工具相关状态
  const jsonToEntityInput = ref('')
  const jsonToEntityOutput = ref('')
  const jsonLanguage = ref('java')
  const jsonClassName = ref('Entity')

  // YAML工具相关状态
  const yamlInput = ref('')
  const yamlOutput = ref('')
  const yamlMode = ref<'toProperties' | 'toYaml'>('toProperties')

  // URL编码工具相关状态
  const urlEncodeInput = ref('')
  const urlEncodeOutput = ref('')

  // Base64编码工具相关状态
  const base64EncodeInput = ref('')
  const base64EncodeOutput = ref('')

  // 正则工具相关状态
  const regexPattern = ref('')
  const regexText = ref('')
  const regexFlags = ref('g')
  const regexMatches = ref<string[]>([])

  // JWT解析工具相关状态
  const jwtInput = ref('')
  const jwtOutput = ref('')

  // MD5哈希工具相关状态
  const md5Input = ref('')
  const md5Output = ref('')
  const md5UpperCase = ref(false)

  // SHA哈希工具相关状态
  const shaInput = ref('')
  const shaOutput = ref('')
  const shaType = ref<'SHA1' | 'SHA256' | 'SHA512'>('SHA256')
  const shaUpperCase = ref(false)

  // AES加解密工具相关状态
  const aesInput = ref('')
  const aesOutput = ref('')
  const aesKey = ref('')
  const aesIv = ref('')
  const aesMode = ref<'CBC' | 'ECB' | 'CFB' | 'OFB' | 'CTR'>('CBC')
  const aesPadding = ref<'Pkcs7' | 'NoPadding' | 'AnsiX923' | 'Iso10126' | 'ZeroPadding'>('Pkcs7')
  const aesKeySize = ref<128 | 192 | 256>(256)
  const aesOutputFormat = ref<'hex' | 'base64'>('hex')

  // RSA加解密工具相关状态
  const rsaInput = ref('')
  const rsaOutput = ref('')
  const rsaPublicKey = ref('')
  const rsaPrivateKey = ref('')
  const rsaKeySize = ref<1024 | 2048 | 4096>(2048)

  // 二维码工具相关状态
  const qrCodeInput = ref('')
  const qrCodeResult = ref('')
  const qrCodeOptions = ref({
    width: 256,
    errorCorrectionLevel: 'M' as 'L' | 'M' | 'Q' | 'H',
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    margin: 4,
    type: 'image/png' as 'image/png' | 'image/jpeg' | 'image/webp',
  })

  // WebSocket工具相关状态
  const wsUrl = ref('ws://localhost:8080')
  const wsProtocols = ref<string[]>([])
  const wsHeaders = ref<Record<string, string>>({})
  const wsConnectionConfig = ref<WebSocketConnectionConfig>({
    url: '',
    protocols: [],
    headers: {},
    timeout: 5000,
    reconnectAttempts: 3,
    reconnectInterval: 1000,
    pingInterval: 300000, // 5分钟ping一次，仅用于保活和连通性检测
    maxMessageSize: 1024 * 1024, // 1MB
    maxMessages: 1000,
  })
  const wsConnectionInfo = ref<WebSocketConnectionInfo>({
    state: 'disconnected',
    url: '',
    protocol: '',
    readyState: WebSocket.CLOSED,
    reconnectCount: 0,
  })
  const wsStats = ref<WebSocketStats>({
    messagesReceived: 0,
    messagesSent: 0,
    bytesReceived: 0,
    bytesSent: 0,
    averageLatency: 0,
    maxLatency: 0,
    minLatency: 0,
    connectionDuration: 0,
    lastPingTime: 0,
  })
  const wsMessages = ref<WebSocketMessage[]>([])
  const wsMessageInput = ref('')
  const wsMessageFormat = ref<'text' | 'json' | 'binary'>('text')
  const wsAutoScroll = ref(true)
  const wsShowTimestamp = ref(true)
  const wsShowMessageSize = ref(true)

  // MQTT工具相关状态
  const mqttBrokerUrl = ref('ws://broker.emqx.io:8083/mqtt')
  const mqttPort = ref(8083)
  const mqttClientId = ref('')
  const mqttUsername = ref('')
  const mqttPassword = ref('')
  const mqttProtocol = ref<'mqtt' | 'mqtts' | 'ws' | 'wss'>('ws')
  const mqttConnectionConfig = ref<MqttConnectionConfig>({
    brokerUrl: 'ws://broker.emqx.io:8083/mqtt',
    port: 8083,
    clientId: '',
    keepAlive: 60,
    cleanSession: true,
    reconnectPeriod: 1000,
    connectTimeout: 5000,
    protocol: 'ws',
    maxReconnectTimes: 3,
  })
  const mqttConnectionInfo = ref<MqttConnectionInfo>({
    state: 'disconnected',
    brokerUrl: '',
    clientId: '',
    protocol: 'ws',
    reconnectCount: 0,
  })
  const mqttStats = ref<MqttStats>({
    messagesPublished: 0,
    messagesReceived: 0,
    bytesPublished: 0,
    bytesReceived: 0,
    subscriptionCount: 0,
    connectionDuration: 0,
    reconnectCount: 0,
    lastActivity: 0,
  })
  const mqttMessages = ref<MqttMessage[]>([])
  const mqttSubscriptions = ref<MqttSubscription[]>([])
  const mqttPublishTopic = ref('')
  const mqttPublishPayload = ref('')
  const mqttPublishQos = ref<0 | 1 | 2>(0)
  const mqttPublishRetain = ref(false)
  const mqttSubscribeTopic = ref('')
  const mqttSubscribeQos = ref<0 | 1 | 2>(0)
  const mqttAutoScroll = ref(true)
  const mqttShowTimestamp = ref(true)
  const mqttShowQos = ref(true)

  // 清空所有数据
  const clearAll = () => {
    jsonFormatterInput.value = ''
    jsonFormatterOutput.value = ''
    jsonToEntityInput.value = ''
    jsonToEntityOutput.value = ''
    yamlInput.value = ''
    yamlOutput.value = ''
    urlEncodeInput.value = ''
    urlEncodeOutput.value = ''
    base64EncodeInput.value = ''
    base64EncodeOutput.value = ''
    regexPattern.value = ''
    regexText.value = ''
    regexMatches.value = []
    jwtInput.value = ''
    jwtOutput.value = ''
    md5Input.value = ''
    md5Output.value = ''
    shaInput.value = ''
    shaOutput.value = ''
    aesInput.value = ''
    aesOutput.value = ''
    aesKey.value = ''
    aesIv.value = ''
    rsaInput.value = ''
    rsaOutput.value = ''
    rsaPublicKey.value = ''
    rsaPrivateKey.value = ''
    qrCodeInput.value = ''
    qrCodeResult.value = ''
    // WebSocket状态不在清空范围内，因为可能正在使用中
  }

  return {
    // JSON格式化
    jsonFormatterInput,
    jsonFormatterOutput,

    // JSON转实体类
    jsonToEntityInput,
    jsonToEntityOutput,
    jsonLanguage,
    jsonClassName,

    // YAML
    yamlInput,
    yamlOutput,
    yamlMode,

    // URL编码
    urlEncodeInput,
    urlEncodeOutput,

    // Base64编码
    base64EncodeInput,
    base64EncodeOutput,

    // Regex
    regexPattern,
    regexText,
    regexFlags,
    regexMatches,

    // JWT解析
    jwtInput,
    jwtOutput,

    // MD5哈希
    md5Input,
    md5Output,
    md5UpperCase,

    // SHA哈希
    shaInput,
    shaOutput,
    shaType,
    shaUpperCase,

    // AES加解密
    aesInput,
    aesOutput,
    aesKey,
    aesIv,
    aesMode,
    aesPadding,
    aesKeySize,
    aesOutputFormat,

    // RSA加解密
    rsaInput,
    rsaOutput,
    rsaPublicKey,
    rsaPrivateKey,
    rsaKeySize,

    // 二维码工具
    qrCodeInput,
    qrCodeResult,
    qrCodeOptions,

    // WebSocket工具
    wsUrl,
    wsProtocols,
    wsHeaders,
    wsConnectionConfig,
    wsConnectionInfo,
    wsStats,
    wsMessages,
    wsMessageInput,
    wsMessageFormat,
    wsAutoScroll,
    wsShowTimestamp,
    wsShowMessageSize,

    // MQTT工具
    mqttBrokerUrl,
    mqttPort,
    mqttClientId,
    mqttUsername,
    mqttPassword,
    mqttProtocol,
    mqttConnectionConfig,
    mqttConnectionInfo,
    mqttStats,
    mqttMessages,
    mqttSubscriptions,
    mqttPublishTopic,
    mqttPublishPayload,
    mqttPublishQos,
    mqttPublishRetain,
    mqttSubscribeTopic,
    mqttSubscribeQos,
    mqttAutoScroll,
    mqttShowTimestamp,
    mqttShowQos,

    // Methods
    clearAll,
  }
})
