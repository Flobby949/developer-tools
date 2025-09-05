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
  } catch {
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
  } catch {
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
 * 获取JSON验证的详细错误信息
 */
export const validateJsonWithDetails = (
  jsonString: string,
): { isValid: boolean; error?: string } => {
  if (!jsonString.trim()) {
    return { isValid: false, error: '输入不能为空' }
  }

  try {
    JSON.parse(jsonString)
    return { isValid: true }
  } catch (error) {
    const errorMessage = (error as Error).message

    // 解析常见的JSON错误类型
    if (errorMessage.includes('Unexpected token')) {
      const match = errorMessage.match(/Unexpected token (.) in JSON at position (\d+)/)
      if (match) {
        const [, token, position] = match
        const pos = parseInt(position, 10)
        const lineInfo = getLineAndColumn(jsonString, pos)
        return {
          isValid: false,
          error: `第 ${lineInfo.line} 行第 ${lineInfo.column} 列：意外的字符 '${token}'`,
        }
      }
    }

    if (errorMessage.includes('Unexpected end of JSON input')) {
      return { isValid: false, error: 'JSON结构不完整，缺少结束符号' }
    }

    if (errorMessage.includes('Unterminated string')) {
      return { isValid: false, error: '字符串未正确结束，缺少引号' }
    }

    if (errorMessage.includes('Expected property name')) {
      return { isValid: false, error: '缺少属性名或属性名格式错误' }
    }

    // 返回原始错误信息
    return { isValid: false, error: errorMessage }
  }
}

/**
 * 获取指定位置的行号和列号
 */
const getLineAndColumn = (text: string, position: number): { line: number; column: number } => {
  const lines = text.slice(0, position).split('\n')
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
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
  } catch {
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
  } catch {
    throw new Error('Invalid Base64 string')
  }
}

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
