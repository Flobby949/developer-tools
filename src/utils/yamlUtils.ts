// YAML工具函数
import * as yaml from 'js-yaml'

/**
 * YAML转Properties格式
 */
export const yamlToProperties = (yamlString: string): string => {
  try {
    const obj = yaml.load(yamlString) as Record<string, any>
    return objectToProperties(obj)
  } catch (error) {
    throw new Error('Invalid YAML format')
  }
}

/**
 * Properties转YAML格式
 */
export const propertiesToYaml = (propertiesString: string): string => {
  try {
    const obj = propertiesToObject(propertiesString)
    return yaml.dump(obj, { indent: 2 })
  } catch (error) {
    throw new Error('Invalid Properties format')
  }
}

/**
 * 对象转Properties格式
 */
const objectToProperties = (obj: Record<string, any>, prefix: string = ''): string => {
  let result = ''

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result += objectToProperties(value, fullKey)
    } else {
      result += `${fullKey}=${value}\n`
    }
  }

  return result
}

/**
 * Properties字符串转对象
 */
const propertiesToObject = (propertiesString: string): Record<string, any> => {
  const result: Record<string, any> = {}
  const lines = propertiesString.trim().split('\n')

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith('#')) continue

    const equalIndex = trimmedLine.indexOf('=')
    if (equalIndex === -1) continue

    const key = trimmedLine.substring(0, equalIndex).trim()
    const value = trimmedLine.substring(equalIndex + 1).trim()

    setNestedProperty(result, key, value)
  }

  return result
}

/**
 * 设置嵌套属性
 */
const setNestedProperty = (obj: Record<string, any>, key: string, value: string): void => {
  const keys = key.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    if (!(k in current) || typeof current[k] !== 'object') {
      current[k] = {}
    }
    current = current[k]
  }

  const lastKey = keys[keys.length - 1]
  current[lastKey] = parseValue(value)
}

/**
 * 解析值类型
 */
const parseValue = (value: string): any => {
  // 尝试解析为数字
  if (/^\d+$/.test(value)) {
    return parseInt(value, 10)
  }

  if (/^\d+\.\d+$/.test(value)) {
    return parseFloat(value)
  }

  // 尝试解析为布尔值
  if (value.toLowerCase() === 'true') return true
  if (value.toLowerCase() === 'false') return false

  // 默认为字符串
  return value
}
