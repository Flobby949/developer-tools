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
      title: '其他工具',
      tools: [
        { name: '正则表达式测试', path: '/regex', description: '在线正则表达式测试' },
        {
          name: 'JWT解析工具',
          path: '/jwt-decoder',
          description: '解析JWT令牌，查看Header、Payload和Signature',
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
