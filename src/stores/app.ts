import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'
import type { ToolCategory } from '@/types'

export const useAppStore = defineStore('app', () => {
  // 当前选中的工具
  const currentTool = ref('json-formatter')

  // 主题设置
  const theme = ref<'light' | 'dark'>('light')

  // 工具分类和列表
  const toolCategories = reactive<ToolCategory[]>([
    {
      title: 'JSON工具',
      tools: [
        { name: 'JSON格式化', path: '/json-formatter', description: '格式化和压缩JSON字符串' },
        { name: 'JSON转实体类', path: '/json-to-entity', description: '将JSON转换为实体类代码' },
      ],
    },
    {
      title: 'YAML工具',
      tools: [{ name: 'YAML转Properties', path: '/yaml', description: 'YAML与Properties格式互转' }],
    },
    {
      title: '编码转换',
      tools: [
        { name: 'URL编解码', path: '/url-encoder', description: 'URL编码和解码' },
        { name: 'Base64编解码', path: '/base64-encoder', description: 'Base64编码和解码' },
        {
          name: 'Base64文件转换',
          path: '/base64-file-converter',
          description: '文件与Base64格式的相互转换',
        },
      ],
    },
    {
      title: '加解密工具',
      tools: [
        { name: 'MD5哈希工具', path: '/md5-hasher', description: 'MD5哈希计算，支持大小写转换' },
        {
          name: 'SHA哈希工具',
          path: '/sha-hasher',
          description: '支持SHA1、SHA256、SHA512等哈希算法',
        },
        {
          name: 'AES加解密工具',
          path: '/aes-crypto',
          description: 'AES对称加密，支持多种模式和密钥长度',
        },
        {
          name: 'RSA加解密工具',
          path: '/rsa-crypto',
          description: 'RSA非对称加密，支持密钥对生成',
        },
      ],
    },
    {
      title: '通信测试',
      tools: [
        {
          name: 'WebSocket测试工具',
          path: '/websocket-tool',
          description: '测试WebSocket连接，发送和接收消息，监控连接性能',
        },
        {
          name: 'MQTT测试工具',
          path: '/mqtt-tool',
          description: '测试 MQTT 连接、发布/订阅与性能统计',
        },
      ],
    },
    {
      title: '其他工具',
      tools: [
        { name: '正则表达式测试', path: '/regex', description: '在线正则表达式测试' },
        {
          name: 'JWT解析工具',
          path: '/jwt-decoder',
          description: '解析JWT令牌，查看Header、Payload和Signature',
        },
        {
          name: '二维码工具',
          path: '/qrcode-tool',
          description: '生成和解析二维码，支持自定义参数',
        },
        {
          name: '时间戳工具',
          path: '/timestamp-tool',
          description: '秒/毫秒时间戳与日期互转，支持时区显示与转换',
        },
        {
          name: '调色盘',
          path: '/color-palette',
          description: '颜色选择与 HEX/RGB/HSL/HSV 等格式转换',
        },
      ],
    },
  ])

  // 更新当前工具
  const setCurrentTool = (tool: string) => {
    currentTool.value = tool
  }

  // 切换主题
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return {
    currentTool,
    theme,
    toolCategories,
    setCurrentTool,
    toggleTheme,
  }
})
