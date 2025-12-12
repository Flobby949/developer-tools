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
  // 使用稳定的浏览器特征生成加密密钥
  // 注意：不使用屏幕分辨率，因为换显示器会导致密钥变化
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const language = navigator.language

  // 组合特征并生成稳定的密钥
  const fingerprint = `ai-config-${timezone}-${language}`
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

function decryptData(encryptedText: string): string | null {
  try {
    const key = getEncryptionKey()
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key)
    const result = decrypted.toString(CryptoJS.enc.Utf8)
    // 如果解密结果为空，返回 null 表示解密失败
    if (!result) {
      console.warn('解密结果为空，可能是密钥不匹配')
      return null
    }
    return result
  } catch (error) {
    console.warn('解密失败:', error)
    return null
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
    if (decrypted) {
      // 解密成功，解析 JSON
      try {
        return JSON.parse(decrypted)
      } catch (parseError) {
        console.warn('解密后的数据不是有效的 JSON:', parseError)
      }
    }

    // 尝试直接解析（可能是未加密的旧数据）
    try {
      const parsed = JSON.parse(stored)
      // 验证是否是有效的配置对象
      if (typeof parsed === 'object' && parsed !== null) {
        console.log('读取到未加密的旧配置数据')
        return parsed
      }
    } catch {
      // 既不能解密也不能解析，说明数据已损坏或密钥不匹配
      console.warn('无法读取本地配置：数据可能已损坏或使用了不同的加密密钥')
    }

    return {}
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
