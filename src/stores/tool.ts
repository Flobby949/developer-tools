import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useToolStore = defineStore('tool', () => {
  // JSON工具相关状态
  const jsonInput = ref('')
  const jsonOutput = ref('')
  const jsonLanguage = ref('java')
  const jsonClassName = ref('Entity')

  // YAML工具相关状态
  const yamlInput = ref('')
  const yamlOutput = ref('')
  const yamlMode = ref<'toProperties' | 'toYaml'>('toProperties')

  // 编码工具相关状态
  const encodeInput = ref('')
  const encodeOutput = ref('')
  const encodeMode = ref<'urlEncode' | 'urlDecode' | 'base64Encode' | 'base64Decode'>('urlEncode')

  // 正则工具相关状态
  const regexPattern = ref('')
  const regexText = ref('')
  const regexFlags = ref('g')
  const regexMatches = ref<string[]>([])

  // 清空所有数据
  const clearAll = () => {
    jsonInput.value = ''
    jsonOutput.value = ''
    yamlInput.value = ''
    yamlOutput.value = ''
    encodeInput.value = ''
    encodeOutput.value = ''
    regexPattern.value = ''
    regexText.value = ''
    regexMatches.value = []
  }

  return {
    // JSON
    jsonInput,
    jsonOutput,
    jsonLanguage,
    jsonClassName,

    // YAML
    yamlInput,
    yamlOutput,
    yamlMode,

    // Encode
    encodeInput,
    encodeOutput,
    encodeMode,

    // Regex
    regexPattern,
    regexText,
    regexFlags,
    regexMatches,

    // Methods
    clearAll,
  }
})
