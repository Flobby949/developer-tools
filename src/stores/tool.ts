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
  const urlEncodeMode = ref<'encode' | 'decode'>('encode')

  // Base64编码工具相关状态
  const base64EncodeInput = ref('')
  const base64EncodeOutput = ref('')
  const base64EncodeMode = ref<'encode' | 'decode'>('encode')

  // 正则工具相关状态
  const regexPattern = ref('')
  const regexText = ref('')
  const regexFlags = ref('g')
  const regexMatches = ref<string[]>([])

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
    urlEncodeMode,

    // Base64编码
    base64EncodeInput,
    base64EncodeOutput,
    base64EncodeMode,

    // Regex
    regexPattern,
    regexText,
    regexFlags,
    regexMatches,

    // Methods
    clearAll,
  }
})
