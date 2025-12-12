import { ref, reactive, watch } from 'vue'
import { defineStore } from 'pinia'
import type { ToolCategory } from '@/types'

// 主题持久化的键名
const THEME_STORAGE_KEY = 'developer-tools-theme'
const THEME_PREFERENCE_KEY = 'developer-tools-theme-preference' // 用户主题偏好：'auto' | 'light' | 'dark'

// 检测系统主题
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// 从 localStorage 读取用户主题偏好
const getThemePreference = (): 'auto' | 'light' | 'dark' => {
  try {
    const stored = localStorage.getItem(THEME_PREFERENCE_KEY)
    return stored === 'auto' || stored === 'light' || stored === 'dark' ? stored : 'auto'
  } catch {
    return 'auto'
  }
}

// 根据用户偏好计算实际主题
const getActualTheme = (preference: 'auto' | 'light' | 'dark'): 'light' | 'dark' => {
  if (preference === 'auto') {
    return getSystemTheme()
  }
  return preference
}

// 保存主题设置到 localStorage
const saveTheme = (theme: 'light' | 'dark') => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // 忽略存储错误（如隐私模式）
  }
}

// 保存用户主题偏好
const saveThemePreference = (preference: 'auto' | 'light' | 'dark') => {
  try {
    localStorage.setItem(THEME_PREFERENCE_KEY, preference)
  } catch {
    // 忽略存储错误（如隐私模式）
  }
}

// 更新页面主题色
const updateThemeColor = (theme: 'light' | 'dark') => {
  if (typeof document === 'undefined') return

  // 移除现有的theme-color meta标签
  const existingMeta = document.querySelectorAll('meta[name="theme-color"]')
  existingMeta.forEach((meta) => meta.remove())

  // 添加新的theme-color
  const meta = document.createElement('meta')
  meta.name = 'theme-color'
  meta.content = theme === 'dark' ? '#1a1a1a' : '#10b981'
  document.head.appendChild(meta)
}

// 应用主题类到根元素
const applyThemeClasses = (
  preference: 'auto' | 'light' | 'dark',
  actualTheme: 'light' | 'dark',
) => {
  if (typeof document === 'undefined') return

  const html = document.documentElement

  // 移除所有主题相关类
  html.classList.remove('theme-light', 'theme-dark', 'dark')

  // 根据用户偏好应用相应类
  if (preference === 'light') {
    html.classList.add('theme-light')
  } else if (preference === 'dark') {
    html.classList.add('theme-dark')
  }
  // 如果是 'auto'，不添加任何类，让系统主题生效

  // 为了向后兼容，在深色主题时添加 'dark' 类
  if (actualTheme === 'dark') {
    html.classList.add('dark')
  }
}

export const useAppStore = defineStore('app', () => {
  // 当前选中的工具
  const currentTool = ref('ai-chat')

  // 用户主题偏好
  const themePreference = ref<'auto' | 'light' | 'dark'>(getThemePreference())

  // 实际主题 - 根据用户偏好和系统主题计算
  const theme = ref<'light' | 'dark'>(getActualTheme(themePreference.value))

  // 工具分类和列表
  const toolCategories = reactive<ToolCategory[]>([
    {
      title: '图像工具',
      tools: [
        {
          name: 'ICO图标生成',
          path: '/ico-generator',
          description: '将PNG/JPG等图片转换为ICO图标格式，支持多尺寸',
        },
        {
          name: '图片压缩转换',
          path: '/image-compressor',
          description: '在线压缩图片、调整尺寸、转换格式，支持PNG/JPG/WebP',
        },
      ],
    },
    {
      title: 'AI工具',
      tools: [
        {
          name: 'AI对话助手',
          path: '/ai-chat',
          description: '与大语言模型进行对话，支持自定义API配置',
        },
      ],
    },
    {
      title: 'JSON工具',
      tools: [
        { name: 'JSON格式化', path: '/json-formatter', description: '格式化和压缩JSON字符串' },
        { name: 'JSON转实体类', path: '/json-to-entity', description: '将JSON转换为实体类代码' },
        {
          name: '实体类Mock数据',
          path: '/entity-to-mock',
          description: '将Java实体类转换为Mock数据，支持JSON和Form格式',
        },
      ],
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
        {
          name: 'Byte字节转换',
          path: '/byte-converter',
          description: '字符串与字节数组的相互转换，支持多种编码格式',
        },
        {
          name: 'Unicode编解码',
          path: '/unicode-encoder',
          description: 'Unicode编码和解码，支持多种Unicode格式转换',
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
      title: 'YAML工具',
      tools: [{ name: 'YAML转Properties', path: '/yaml', description: 'YAML与Properties格式互转' }],
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
      title: '文本工具',
      tools: [
        {
          name: '文本对比',
          path: '/text-diff',
          description: '比较两段文本的差异，类似于 diff 功能',
        },
        {
          name: '文本格式化',
          path: '/text-formatter',
          description: '去空格、去换行、大小写转换、驼峰/下划线命名转换',
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
        {
          name: 'HTML预览工具',
          path: '/html-preview',
          description: '输入HTML并在新标签页预览，含合法性校验',
        },
      ],
    },
  ])

  // 更新当前工具
  const setCurrentTool = (tool: string) => {
    currentTool.value = tool
  }

  // 设置主题偏好
  const setThemePreference = (preference: 'auto' | 'light' | 'dark') => {
    themePreference.value = preference
    theme.value = getActualTheme(preference)
    applyThemeClasses(preference, theme.value)
  }

  // 切换主题（在 auto -> light -> dark -> auto 之间循环）
  const toggleTheme = () => {
    const preferences: Array<'auto' | 'light' | 'dark'> = ['auto', 'light', 'dark']
    const currentIndex = preferences.indexOf(themePreference.value)
    const nextIndex = (currentIndex + 1) % preferences.length
    setThemePreference(preferences[nextIndex])
  }

  // 获取主题显示名称
  const getThemeDisplayName = () => {
    const names = {
      auto: '跟随系统',
      light: '浅色模式',
      dark: '深色模式',
    }
    return names[themePreference.value]
  }

  // 获取主题图标
  const getThemeIcon = () => {
    const icons = {
      auto: '🌐', // 地球图标表示跟随系统
      light: '☀️', // 太阳
      dark: '🌙', // 月亮
    }
    return icons[themePreference.value]
  }

  // 监听系统主题变化
  const initSystemThemeListener = () => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      if (themePreference.value === 'auto') {
        const newTheme = getSystemTheme()
        theme.value = newTheme
        applyThemeClasses('auto', newTheme)
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)

    // 初始化时也要应用主题类
    applyThemeClasses(themePreference.value, theme.value)

    // 返回清理函数
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }

  // 监听主题偏好变化并持久化
  watch(
    themePreference,
    (newPreference) => {
      saveThemePreference(newPreference)
    },
    { immediate: false },
  )

  // 监听实际主题变化并更新页面主题色
  watch(
    theme,
    (newTheme) => {
      saveTheme(newTheme)
      updateThemeColor(newTheme)
    },
    { immediate: true }, // 初始化时也要执行
  )

  return {
    currentTool,
    theme,
    themePreference,
    toolCategories,
    setCurrentTool,
    toggleTheme,
    setThemePreference,
    getThemeDisplayName,
    getThemeIcon,
    initSystemThemeListener,
  }
})
