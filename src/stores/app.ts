import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'
import type { ToolCategory } from '@/types'

export const useAppStore = defineStore('app', () => {
  // 当前选中的工具
  const currentTool = ref('json')

  // 主题设置
  const theme = ref<'light' | 'dark'>('light')

  // 工具分类和列表
  const toolCategories = reactive<ToolCategory[]>([
    {
      title: 'JSON工具',
      tools: [
        { name: 'JSON格式化', path: '/json', description: '格式化JSON字符串' },
        { name: 'JSON压缩', path: '/json', description: '压缩JSON字符串' },
        { name: 'JSON转实体类', path: '/json', description: '将JSON转换为实体类' },
      ],
    },
    {
      title: 'YAML工具',
      tools: [{ name: 'YAML转Properties', path: '/yaml', description: 'YAML与Properties格式互转' }],
    },
    {
      title: '编码转换',
      tools: [
        { name: 'URL编码/解码', path: '/encode', description: 'URL编码和解码' },
        { name: 'Base64编码/解码', path: '/encode', description: 'Base64编码和解码' },
      ],
    },
    {
      title: '其他工具',
      tools: [{ name: '正则表达式测试', path: '/regex', description: '在线正则表达式测试' }],
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
