/**
 * 环境变量工具函数
 * 支持读取Vite环境变量和本地存储的配置
 */

import CryptoJS from 'crypto-js'

// AI配置接口
export interface AiConfig {
  baseURL: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  memoryMessages: number
}

// 默认AI配置
const DEFAULT_AI_CONFIG: AiConfig = {
  baseURL: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-5',
  temperature: 0.7,
  maxTokens: 2048,
  memoryMessages: 5,
}

/**
 * 获取AI配置
 * 从本地存储获取配置，如果没有则使用默认值
 */
export function getAiConfig(): AiConfig {
  const storedConfig = getStoredConfig()
  const config: AiConfig = {
    baseURL: storedConfig.baseURL || DEFAULT_AI_CONFIG.baseURL,
    apiKey: storedConfig.apiKey || DEFAULT_AI_CONFIG.apiKey,
    model: storedConfig.model || DEFAULT_AI_CONFIG.model,
    temperature: storedConfig.temperature || DEFAULT_AI_CONFIG.temperature,
    maxTokens: storedConfig.maxTokens || DEFAULT_AI_CONFIG.maxTokens,
    memoryMessages: storedConfig.memoryMessages || DEFAULT_AI_CONFIG.memoryMessages,
  }

  // 验证数值范围
  config.temperature = Math.max(0, Math.min(2, config.temperature))
  config.maxTokens = Math.max(1, Math.min(4096, config.maxTokens))
  config.memoryMessages = Math.max(0, Math.min(20, config.memoryMessages))

  return config
}

/**
 * 加密/解密工具函数（使用 AES 加密）
 */
function getEncryptionKey(): string {
  // 使用浏览器特征生成加密密钥
  const userAgent = navigator.userAgent
  const screen = `${window.screen.width}x${window.screen.height}`
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const language = navigator.language

  // 组合特征并生成稳定的密钥
  const fingerprint = `${userAgent}-${screen}-${timezone}-${language}`
  return CryptoJS.SHA256(fingerprint).toString().substring(0, 32)
}

function encryptData(text: string): string {
  try {
    const key = getEncryptionKey()
    const encrypted = CryptoJS.AES.encrypt(text, key).toString()
    return encrypted
  } catch (error) {
    console.error('加密失败:', error)
    return text // 如果加密失败，返回原文
  }
}

function decryptData(encryptedText: string): string {
  try {
    const key = getEncryptionKey()
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key)
    const result = decrypted.toString(CryptoJS.enc.Utf8)
    return result || encryptedText // 如果解密失败，可能是未加密的数据
  } catch (error) {
    console.warn('解密失败，尝试作为未加密数据处理:', error)
    return encryptedText
  }
}
/**
 * 从本地存储获取AI配置（解密）
 */
function getStoredConfig(): Partial<AiConfig> {
  try {
    const stored = localStorage.getItem('ai-config')
    if (!stored) return {}

    // 尝试解密
    const decrypted = decryptData(stored)
    if (decrypted && decrypted !== stored) {
      // 解密成功，解析 JSON
      return JSON.parse(decrypted)
    } else {
      // 可能是未加密的旧数据，直接解析
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('读取本地AI配置失败:', error)
    return {}
  }
}

/**
 * 保存AI配置到本地存储（加密）
 * @param config 配置对象
 * @param persistent 是否持久化存储
 */
export function saveAiConfig(config: Partial<AiConfig>, persistent: boolean = false): void {
  if (!persistent) {
    // 不持久化，直接返回
    return
  }

  try {
    const currentConfig = getStoredConfig()
    const newConfig = { ...currentConfig, ...config }

    // 使用 AES 加密整个配置
    const configString = JSON.stringify(newConfig)
    const encrypted = encryptData(configString)

    localStorage.setItem('ai-config', encrypted)
    console.log('AI配置已加密保存')
  } catch (error) {
    console.error('保存AI配置失败:', error)
  }
}

/**
 * 清除本地存储的AI配置
 */
export function clearAiConfig(): void {
  try {
    localStorage.removeItem('ai-config')
  } catch (error) {
    console.error('清除AI配置失败:', error)
  }
}

/**
 * 验证AI配置是否完整
 */
export function validateAiConfig(config: Partial<AiConfig>): boolean {
  return !!(config.baseURL && config.apiKey && config.model)
}
