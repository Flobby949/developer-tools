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

    // Methods
    clearAll,
  }
})
