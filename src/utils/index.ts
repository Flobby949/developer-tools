// 通用工具函数

/**
 * 复制文本到剪贴板
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy text: ', err)
    return false
  }
}

/**
 * 格式化JSON字符串
 */
export const formatJson = (jsonString: string, indent: number = 2): string => {
  try {
    const parsed = JSON.parse(jsonString)
    return JSON.stringify(parsed, null, indent)
  } catch (error) {
    throw new Error('Invalid JSON format')
  }
}

/**
 * 压缩JSON字符串
 */
export const compressJson = (jsonString: string): string => {
  try {
    const parsed = JSON.parse(jsonString)
    return JSON.stringify(parsed)
  } catch (error) {
    throw new Error('Invalid JSON format')
  }
}

/**
 * 验证JSON格式
 */
export const isValidJson = (jsonString: string): boolean => {
  try {
    JSON.parse(jsonString)
    return true
  } catch {
    return false
  }
}

/**
 * URL编码
 */
export const urlEncode = (text: string): string => {
  return encodeURIComponent(text)
}

/**
 * URL解码
 */
export const urlDecode = (text: string): string => {
  try {
    return decodeURIComponent(text)
  } catch (error) {
    throw new Error('Invalid URL encoded string')
  }
}

/**
 * Base64编码
 */
export const base64Encode = (text: string): string => {
  return btoa(unescape(encodeURIComponent(text)))
}

/**
 * Base64解码
 */
export const base64Decode = (text: string): string => {
  try {
    return decodeURIComponent(escape(atob(text)))
  } catch (error) {
    throw new Error('Invalid Base64 string')
  }
}

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
