import CryptoJS from 'crypto-js'

// MD5 哈希
export const md5Hash = (text: string): string => {
  return CryptoJS.MD5(text).toString()
}

// SHA1 哈希
export const sha1Hash = (text: string): string => {
  return CryptoJS.SHA1(text).toString()
}

// SHA256 哈希
export const sha256Hash = (text: string): string => {
  return CryptoJS.SHA256(text).toString()
}

// SHA512 哈希
export const sha512Hash = (text: string): string => {
  return CryptoJS.SHA512(text).toString()
}

// AES 加密选项接口
export interface AESOptions {
  key: string
  iv?: string
  mode?: 'CBC' | 'ECB' | 'CFB' | 'OFB' | 'CTR'
  padding?: 'Pkcs7' | 'NoPadding' | 'AnsiX923' | 'Iso10126' | 'ZeroPadding'
  keySize?: 128 | 192 | 256
  outputFormat?: 'hex' | 'base64'
}

// AES 加密
export const aesEncrypt = (text: string, options: AESOptions): string => {
  try {
    const {
      key,
      iv,
      mode = 'CBC',
      padding = 'Pkcs7',
      keySize = 256,
      outputFormat = 'hex',
    } = options

    // 处理密钥长度
    let processedKey = CryptoJS.enc.Utf8.parse(key)
    const requiredKeyLength = keySize / 8

    if (processedKey.sigBytes > requiredKeyLength) {
      // 密钥过长，截取
      processedKey = CryptoJS.lib.WordArray.create(
        processedKey.words.slice(0, requiredKeyLength / 4),
      )
      processedKey.sigBytes = requiredKeyLength
    } else if (processedKey.sigBytes < requiredKeyLength) {
      // 密钥过短，填充
      const padding = CryptoJS.lib.WordArray.create([], requiredKeyLength - processedKey.sigBytes)
      processedKey = processedKey.concat(padding)
    }

    // 配置选项
    const config: {
      mode: any
      padding: any
      iv?: any
    } = {
      mode: CryptoJS.mode[mode],
      padding: CryptoJS.pad[padding],
    }

    // 处理初始向量
    if (iv && mode !== 'ECB') {
      config.iv = CryptoJS.enc.Utf8.parse(iv)
    }

    const encrypted = CryptoJS.AES.encrypt(text, processedKey, config)

    return outputFormat === 'hex' ? encrypted.ciphertext.toString() : encrypted.toString()
  } catch (error) {
    throw new Error('AES加密失败：' + (error as Error).message)
  }
}

// AES 解密
export const aesDecrypt = (encryptedText: string, options: AESOptions): string => {
  try {
    const {
      key,
      iv,
      mode = 'CBC',
      padding = 'Pkcs7',
      keySize = 256,
      outputFormat = 'hex',
    } = options

    // 处理密钥长度
    let processedKey = CryptoJS.enc.Utf8.parse(key)
    const requiredKeyLength = keySize / 8

    if (processedKey.sigBytes > requiredKeyLength) {
      processedKey = CryptoJS.lib.WordArray.create(
        processedKey.words.slice(0, requiredKeyLength / 4),
      )
      processedKey.sigBytes = requiredKeyLength
    } else if (processedKey.sigBytes < requiredKeyLength) {
      const padding = CryptoJS.lib.WordArray.create([], requiredKeyLength - processedKey.sigBytes)
      processedKey = processedKey.concat(padding)
    }

    // 配置选项
    const config: {
      mode: any
      padding: any
      iv?: any
    } = {
      mode: CryptoJS.mode[mode],
      padding: CryptoJS.pad[padding],
    }

    // 处理初始向量
    if (iv && mode !== 'ECB') {
      config.iv = CryptoJS.enc.Utf8.parse(iv)
    }

    // 处理加密文本格式
    let cipherParams
    if (outputFormat === 'hex') {
      cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Hex.parse(encryptedText),
      })
    } else {
      cipherParams = encryptedText
    }

    const decrypted = CryptoJS.AES.decrypt(cipherParams, processedKey, config)
    const result = decrypted.toString(CryptoJS.enc.Utf8)

    if (!result) {
      throw new Error('解密失败，请检查密钥或加密文本是否正确')
    }

    return result
  } catch (error) {
    throw new Error('AES解密失败：' + (error as Error).message)
  }
}

// RSA 密钥对生成（模拟）
export interface RSAKeyPair {
  publicKey: string
  privateKey: string
}

// 生成RSA密钥对（简化版，实际应用中应使用专业的RSA库）
export const generateRSAKeyPair = (keySize: 1024 | 2048 | 4096 = 2048): RSAKeyPair => {
  // 生成一个固定的密钥标识，用于加密和解密的配对
  const keyId = Math.random().toString(36).substring(2, 15)
  const keyInfo = `${keySize}-${keyId}`

  const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${btoa(keyInfo)}
-----END PUBLIC KEY-----`

  const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQD${btoa(keyInfo)}
-----END PRIVATE KEY-----`

  return { publicKey, privateKey }
}

// RSA 加密（使用公钥）- 简化实现
export const rsaEncrypt = (text: string, publicKey: string): string => {
  try {
    // 提取公钥中的密钥标识
    const keyMatch = publicKey.match(
      /MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA([A-Za-z0-9+/=]+)/,
    )
    if (!keyMatch) {
      throw new Error('无效的公钥格式')
    }

    const keyIdentifier = keyMatch[1]

    // 创建加密数据：原文 + 分隔符 + 密钥标识符
    const encryptedData = text + '|RSA|' + keyIdentifier

    // 使用Base64编码模拟加密
    const encrypted = btoa(unescape(encodeURIComponent(encryptedData)))
    return encrypted
  } catch (error) {
    throw new Error('RSA加密失败：' + (error as Error).message)
  }
}

// RSA 解密（使用私钥）- 简化实现
export const rsaDecrypt = (encryptedText: string, privateKey: string): string => {
  try {
    // 提取私钥中的密钥标识
    const keyMatch = privateKey.match(
      /MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQD([A-Za-z0-9+/=]+)/,
    )
    if (!keyMatch) {
      throw new Error('无效的私钥格式')
    }

    const expectedKeyIdentifier = keyMatch[1]

    // 解密Base64数据
    const decryptedData = decodeURIComponent(escape(atob(encryptedText)))

    // 检查数据格式：原文|RSA|密钥标识符
    const parts = decryptedData.split('|RSA|')
    if (parts.length !== 2) {
      throw new Error('加密数据格式错误')
    }

    const [originalText, keyIdentifier] = parts

    // 验证密钥是否匹配
    if (keyIdentifier !== expectedKeyIdentifier) {
      throw new Error('私钥与加密数据不匹配')
    }

    return originalText
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('RSA解密失败：数据格式错误或私钥不匹配')
  }
}

// HMAC 计算
export const hmacSha256 = (text: string, key: string): string => {
  return CryptoJS.HmacSHA256(text, key).toString()
}

export const hmacSha1 = (text: string, key: string): string => {
  return CryptoJS.HmacSHA1(text, key).toString()
}

export const hmacMd5 = (text: string, key: string): string => {
  return CryptoJS.HmacMD5(text, key).toString()
}

// 大小写转换工具
export const toUpperCase = (text: string): string => {
  return text.toUpperCase()
}

export const toLowerCase = (text: string): string => {
  return text.toLowerCase()
}

// 随机密钥生成
export const generateRandomKey = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 随机IV生成
export const generateRandomIV = (length: number = 16): string => {
  return generateRandomKey(length)
}
