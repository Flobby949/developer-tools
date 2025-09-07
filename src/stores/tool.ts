import { ref } from 'vue'
import { defineStore } from 'pinia'

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

    // Methods
    clearAll,
  }
})
