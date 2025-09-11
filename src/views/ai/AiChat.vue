<template>
  <ToolPanel
    title="AI对话助手"
    description="与大语言模型进行对话，支持自定义API配置"
    :show-header="shouldShowHeader"
  >
    <div class="ai-chat-container" :class="{ 'compact-mode': !shouldShowHeader }">
      <!-- 配置面板 -->
      <div class="config-section" :class="{ collapsed: !showConfig }">
        <div class="config-header" @click="showConfig = !showConfig">
          <h3>AI配置</h3>
          <span class="toggle-icon">{{ showConfig ? '▼' : '▶' }}</span>
        </div>

        <div v-show="showConfig" class="config-form-container">
          <div class="config-form">
            <div class="form-row">
              <div class="form-group base-url-group">
                <label>Base URL:</label>
                <div class="base-url-container">
                  <select
                    v-model="selectedBaseUrlOption"
                    @change="onBaseUrlOptionChange"
                    class="base-url-select"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="claude">Claude</option>
                    <option value="local">本地部署</option>
                    <option value="custom">自定义</option>
                  </select>
                  <input
                    v-model="localConfig.baseURL"
                    type="text"
                    placeholder="https://api.openai.com/v1"
                    @blur="saveConfig"
                    class="base-url-input"
                  />
                </div>
                <div class="endpoint-display">→ {{ displayEndpoint }}</div>
              </div>
              <div class="form-group">
                <label>API Key:</label>
                <input
                  v-model="localConfig.apiKey"
                  type="password"
                  placeholder="sk-..."
                  @blur="saveConfig"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group model-group">
                <label>模型:</label>
                <div class="model-input-container">
                  <input
                    v-model="localConfig.model"
                    type="text"
                    placeholder="输入模型名称"
                    @blur="saveConfig"
                    list="model-suggestions"
                    class="model-input"
                  />
                  <datalist id="model-suggestions">
                    <option value="gpt-5">GPT-5</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="deepseek-chat">DeepSeek</option>
                    <option value="qwen-plus">千问-plus</option>
                    <option value="glm-4.5">GLM-4.5</option>
                  </datalist>
                </div>
              </div>
              <div class="form-group">
                <label>温度 ({{ localConfig.temperature }}):</label>
                <input
                  v-model.number="localConfig.temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  @input="saveConfig"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>最大令牌数:</label>
                <input
                  v-model.number="localConfig.maxTokens"
                  type="number"
                  min="1"
                  max="4096"
                  @blur="saveConfig"
                />
              </div>
              <div class="form-group">
                <label>记忆消息数 ({{ localConfig.memoryMessages }}):</label>
                <input
                  v-model.number="localConfig.memoryMessages"
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  @input="saveConfig"
                />
                <div class="memory-hint">设置为0表示不保留历史消息</div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full-width">
                <label>系统提示:</label>
                <textarea
                  v-model="toolStore.aiChatSystemPrompt"
                  placeholder="你是一个有用的AI助手。"
                  rows="2"
                  class="system-prompt-textarea"
                ></textarea>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    v-model="toolStore.aiChatPersistent"
                    @change="onPersistentChange"
                  />
                  <span class="checkbox-text">本地持久化配置</span>
                </label>
                <div class="persistent-hint">
                  勾选后配置信息将被加密保存在本地浏览器中，下次打开时自动加载
                </div>
              </div>
            </div>

            <!-- 调试用：添加更多配置项来测试滚动 -->
            <!-- 临时移除测试配置项，保持界面简洁 -->

            <div class="config-actions">
              <button @click="clearConfig" class="btn-danger">清除配置</button>
              <button @click="testConnection" :disabled="isConnecting" class="btn-primary">
                {{ isConnecting ? '测试中...' : '测试连接' }}
              </button>
            </div>

            <div v-if="configStatus" class="config-status" :class="configStatus.type">
              {{ configStatus.message }}
            </div>
          </div>
        </div>
      </div>

      <!-- 聊天区域 -->
      <div class="chat-section">
        <div class="chat-messages" ref="messagesContainer" @scroll="handleScroll">
          <div v-if="toolStore.aiChatMessages.length === 0" class="empty-state">
            <div class="empty-icon">🤖</div>
            <h3>开始与AI对话</h3>
            <p>请在下方输入您的问题，我会尽力帮助您。</p>
          </div>

          <div
            v-for="message in toolStore.aiChatMessages"
            :key="message.id"
            class="message"
            :class="{
              'user-message': message.role === 'user',
              'assistant-message': message.role === 'assistant',
            }"
          >
            <div class="message-header">
              <span class="message-role">{{ message.role === 'user' ? '用户' : 'AI助手' }}</span>
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div class="message-content" v-html="formatMessageContent(message.content)"></div>
            <div class="message-footer">
              <div class="message-actions">
                <button @click="copyMessage(message.content)" class="action-btn copy-btn">
                  <span class="btn-icon">📋</span>复制
                </button>
                <button @click="deleteMessage(message.id)" class="action-btn delete-btn">
                  <span class="btn-icon">🗑️</span>删除
                </button>
              </div>
              <div class="message-tokens">Tokens: {{ estimateTokens(message.content) }}</div>
            </div>
          </div>

          <!-- 流式输出显示 -->
          <div v-if="isStreaming && streamingMessage" class="message assistant-message streaming">
            <div class="message-header">
              <span class="message-role">AI助手</span>
              <span class="message-time">正在回复...</span>
            </div>
            <div class="message-content" v-html="formatMessageContent(streamingMessage)"></div>
            <div class="message-footer">
              <div class="streaming-indicator">
                <div class="typing-cursor">|</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 回到底部按钮 -->
        <div v-if="userScrolling" class="scroll-to-bottom" @click="scrollToBottomAndReset">
          <span class="scroll-icon">↓</span>
          <span class="scroll-text">回到底部</span>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input-section">
          <div class="input-container">
            <textarea
              v-model="toolStore.aiChatInput"
              :placeholder="placeholderText"
              @keydown="handleKeydown"
              @input="adjustTextareaHeight"
              @focus="handleInputFocus"
              ref="inputTextarea"
              :disabled="toolStore.aiChatLoading"
            ></textarea>
            <button @click="sendMessage" :disabled="!canSend" class="send-button">
              <span v-if="toolStore.aiChatLoading">⏸</span>
              <span v-else>🚀</span>
            </button>
          </div>

          <div class="input-actions">
            <button @click="clearChat" class="btn-secondary">清空对话</button>
            <!-- <button @click="exportChat" class="btn-secondary">导出对话</button> -->
            <div class="input-stats">
              <span class="context-tokens">上下文: {{ calculateContextTokens() }} tokens</span>
              <span class="input-count">{{ toolStore.aiChatInput.length }}/2000</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast 通知 -->
    <div v-if="toastMessage" class="toast-notification" :class="toastMessage.type">
      <div class="toast-content">
        <span class="toast-icon">
          {{ toastMessage.type === 'success' ? '✓' : toastMessage.type === 'error' ? '✗' : 'i' }}
        </span>
        <span class="toast-text">{{ toastMessage.message }}</span>
        <button @click="hideToast" class="toast-close">×</button>
      </div>
    </div>
  </ToolPanel>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'
import { useToolStore } from '@/stores/tool'
import {
  getAiConfig,
  saveAiConfig,
  clearAiConfig,
  validateAiConfig,
  type AiConfig,
} from '@/utils/envUtils'
import { safeRenderMarkdown, setupCodeCopyFunction } from '@/utils/markdownUtils'

const toolStore = useToolStore()

// 组件状态
const showConfig = ref(false)
const isConnecting = ref(false)
const messagesContainer = ref<HTMLElement>()
const inputTextarea = ref<HTMLTextAreaElement>()
const localConfig = ref<AiConfig>({ ...toolStore.aiChatConfig })
const configStatus = ref<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)
const selectedBaseUrlOption = ref('custom')
const streamingMessage = ref('')
const isStreaming = ref(false)
const toastMessage = ref<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

// Base URL 预设选项
const baseUrlOptions = {
  openai: 'https://api.openai.com/v1',
  claude: 'https://api.anthropic.com/v1',
  local: 'http://localhost:11434/v1',
  custom: '',
}

// 计算属性
const canSend = computed(() => {
  return (
    !toolStore.aiChatLoading &&
    toolStore.aiChatInput.trim().length > 0 &&
    toolStore.aiChatInput.length <= 2000 &&
    validateAiConfig(localConfig.value)
  )
})

// 显示API端点
const displayEndpoint = computed(() => {
  const baseUrl = localConfig.value.baseURL
  if (!baseUrl) return 'chat/completions'

  // 如果URL已经以/v1结尾，则显示完整的端点
  if (baseUrl.endsWith('/v1')) {
    return `${baseUrl}/chat/completions`
  }

  // 否则只显示端点部分
  return 'chat/completions'
})

// 动态 placeholder 文本
const placeholderText = computed(() => {
  const isConfigured = validateAiConfig(localConfig.value)
  if (!isConfigured) {
    return '请先配置 API Key 和模型，然后开始对话...'
  }
  return '请输入您的问题... (Shift+Enter换行，Enter发送)'
})

// 是否显示ToolPanel头部
const shouldShowHeader = computed(() => {
  // 在移动端且有消息时隐藏头部，节省空间
  if (window.innerWidth <= 768 && toolStore.aiChatMessages.length > 0) {
    return false
  }
  return true
})

// 初始化
onMounted(() => {
  loadConfig()
  adjustTextareaHeight()
  setupCodeCopyFunction()
})

// 清理资源
onUnmounted(() => {
  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value)
  }
})

// 滚动优化相关
const scrollTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
const userScrolling = ref(false)
const lastScrollTime = ref(0)

// 监听消息变化，自动滚动到底部
watch(
  () => toolStore.aiChatMessages.length,
  () => {
    nextTick(() => {
      smoothScrollToBottom()
    })
  },
)

// 监听流式消息变化，优化滚动
watch(
  () => streamingMessage.value,
  () => {
    if (isStreaming.value) {
      debouncedScrollToBottom()
    }
  },
)

// 配置管理
function loadConfig() {
  const envConfig = getAiConfig()
  localConfig.value = { ...envConfig }
  toolStore.aiChatConfig = { ...envConfig }

  // 检查是否有本地持久化配置
  const hasLocalConfig = localStorage.getItem('ai-config')
  toolStore.aiChatPersistent = !!hasLocalConfig

  initBaseUrlOption()
}

function saveConfig() {
  toolStore.aiChatConfig = { ...localConfig.value }
  if (toolStore.aiChatPersistent) {
    saveAiConfig(localConfig.value, true)
    showConfigStatus('success', '配置已保存并持久化')
  } else {
    showConfigStatus('success', '配置已保存（仅当前会话）')
  }
}

// 持久化选项处理
function onPersistentChange() {
  if (toolStore.aiChatPersistent) {
    // 弹框提醒用户
    const confirmed = confirm(
      '开启本地持久化后，您的API配置（包括API Key）将被加密保存在本地浏览器中。\n\n请确保：\n1. 您使用的是个人设备\n2. 没有其他人可以访问您的浏览器\n3. 已了解相关安全风险\n\n是否继续开启持久化？',
    )

    if (confirmed) {
      // 用户确认，保存当前配置
      saveAiConfig(localConfig.value, true)
      showToast('success', '已开启本地持久化，配置已加密保存')
    } else {
      // 用户取消，取消勾选
      toolStore.aiChatPersistent = false
    }
  } else {
    // 关闭持久化，提醒用户清理本地数据
    const shouldClear = confirm('关闭持久化后，是否同时清除已保存的本地配置？')
    if (shouldClear) {
      clearAiConfig()
      showToast('info', '已关闭持久化并清除本地配置')
    } else {
      showToast('info', '已关闭持久化，本地配置保留')
    }
  }
}

function clearConfig() {
  clearAiConfig()
  localConfig.value = {
    baseURL: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2048,
    memoryMessages: 10,
  }
  toolStore.aiChatConfig = { ...localConfig.value }
  toolStore.aiChatPersistent = false
  selectedBaseUrlOption.value = 'openai'
  showConfigStatus('warning', '配置已清除')
}

function showConfigStatus(type: 'success' | 'error' | 'warning', message: string) {
  configStatus.value = { type, message }
  setTimeout(() => {
    configStatus.value = null
  }, 3000)
}

// Base URL 选项处理
function onBaseUrlOptionChange() {
  if (selectedBaseUrlOption.value !== 'custom') {
    localConfig.value.baseURL =
      baseUrlOptions[selectedBaseUrlOption.value as keyof typeof baseUrlOptions]
    saveConfig()
  }
}

// 初始化Base URL选项
function initBaseUrlOption() {
  const currentUrl = localConfig.value.baseURL
  for (const [key, url] of Object.entries(baseUrlOptions)) {
    if (url === currentUrl) {
      selectedBaseUrlOption.value = key
      return
    }
  }
  selectedBaseUrlOption.value = 'custom'
}

// 连接测试
async function testConnection() {
  if (!validateAiConfig(localConfig.value)) {
    showConfigStatus('error', '请填写完整的配置信息')
    return
  }

  isConnecting.value = true

  try {
    const response = await fetch(`${localConfig.value.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localConfig.value.apiKey}`,
      },
      body: JSON.stringify({
        model: localConfig.value.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 1,
      }),
    })

    if (response.ok) {
      showConfigStatus('success', '连接测试成功！')
    } else {
      const error = await response.text()
      showConfigStatus('error', `连接失败: ${response.status} ${error}`)
    }
  } catch (error) {
    showConfigStatus('error', `连接错误: ${error instanceof Error ? error.message : '未知错误'}`)
  } finally {
    isConnecting.value = false
  }
}

// 消息处理
async function sendMessage() {
  if (!canSend.value) return

  const userMessage = {
    id: Date.now().toString(),
    role: 'user' as const,
    content: toolStore.aiChatInput.trim(),
    timestamp: Date.now(),
  }

  toolStore.aiChatMessages.push(userMessage)
  toolStore.aiChatInput = ''
  toolStore.aiChatLoading = true
  isStreaming.value = true
  streamingMessage.value = ''

  try {
    // 构建消息列表，应用记忆限制
    const allMessages = toolStore.aiChatMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    // 如果设置了记忆消息数限制，只取最近的消息
    const recentMessages =
      localConfig.value.memoryMessages > 0
        ? allMessages.slice(-localConfig.value.memoryMessages)
        : allMessages

    const messages = [{ role: 'system', content: toolStore.aiChatSystemPrompt }, ...recentMessages]

    const response = await fetch(`${localConfig.value.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localConfig.value.apiKey}`,
      },
      body: JSON.stringify({
        model: localConfig.value.model,
        messages,
        temperature: localConfig.value.temperature,
        max_tokens: localConfig.value.maxTokens,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
    }

    // 处理流式输出
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let assistantContent = ''

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                assistantContent += content
                streamingMessage.value = assistantContent

                // 使用防抖滚动优化
                debouncedScrollToBottom()
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    }

    // 流式输出完成，保存消息
    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: assistantContent || '抱歉，我没有收到有效的响应。',
      timestamp: Date.now(),
    }

    toolStore.aiChatMessages.push(assistantMessage)
  } catch (error) {
    const errorMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: `抱歉，发生了错误: ${error instanceof Error ? error.message : '未知错误'}`,
      timestamp: Date.now(),
    }
    toolStore.aiChatMessages.push(errorMessage)
  } finally {
    toolStore.aiChatLoading = false
    isStreaming.value = false
    streamingMessage.value = ''
    adjustTextareaHeight()
  }
}

// 键盘事件处理
function handleKeydown(event: KeyboardEvent) {
  // 检查是否在中文输入法编写状态（composing）
  if (event.isComposing || event.keyCode === 229) {
    return // 如果正在输入中文，不处理回车事件
  }

  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// 输入框获得焦点时的处理
function handleInputFocus() {
  // 自动收起 AI 配置面板
  if (showConfig.value) {
    showConfig.value = false
  }
}

// 文本框高度调整
function adjustTextareaHeight() {
  nextTick(() => {
    if (inputTextarea.value) {
      inputTextarea.value.style.height = 'auto'
      inputTextarea.value.style.height = Math.min(inputTextarea.value.scrollHeight, 150) + 'px'
    }
  })
}

// 检测用户是否正在滚动
function handleScroll() {
  if (!messagesContainer.value) return

  const container = messagesContainer.value
  const threshold = 100 // 距离底部100px内认为用户想看最新消息
  const isNearBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight < threshold

  userScrolling.value = !isNearBottom
  lastScrollTime.value = Date.now()
}

// 防抖滚动到底部
function debouncedScrollToBottom() {
  if (userScrolling.value) return // 用户正在滚动时不自动滚动

  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value)
  }

  scrollTimeout.value = setTimeout(() => {
    smoothScrollToBottom()
  }, 100) // 100ms 防抖
}

// 平滑滚动到底部
function smoothScrollToBottom() {
  if (messagesContainer.value && !userScrolling.value) {
    const container = messagesContainer.value
    const targetScrollTop = container.scrollHeight - container.clientHeight

    // 如果已经在底部附近，直接设置
    if (Math.abs(container.scrollTop - targetScrollTop) < 50) {
      container.scrollTop = targetScrollTop
      return
    }

    // 使用平滑滚动
    container.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth',
    })
  }
}

// 立即滚动到底部（不检查用户状态）
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 用户点击回到底部按钮
function scrollToBottomAndReset() {
  userScrolling.value = false
  scrollToBottom()
}

// 工具函数
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// 简单的Token估算函数（粗略估算）
function estimateTokens(text: string): number {
  // 中文字符每个字约为1.5-2个token，英文单词平均约1.3个token
  const chineseChars = (text.match(/[一-鿿]/g) || []).length
  const englishWords = text
    .replace(/[一-鿿]/g, '')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length
  const otherChars = text.length - chineseChars - text.replace(/[一-鿿]/g, '').length

  return Math.ceil(chineseChars * 1.8 + englishWords * 1.3 + otherChars * 0.5)
}

// 计算上下文Token使用量
function calculateContextTokens(): number {
  const systemPromptTokens = estimateTokens(toolStore.aiChatSystemPrompt)

  const allMessages = toolStore.aiChatMessages.map((msg) => msg.content)
  const recentMessages =
    localConfig.value.memoryMessages > 0
      ? allMessages.slice(-localConfig.value.memoryMessages)
      : allMessages

  const contextTokens = recentMessages.reduce((total, content) => {
    return total + estimateTokens(content)
  }, 0)

  return systemPromptTokens + contextTokens
}

function formatMessageContent(content: string): string {
  // 使用专业Markdown渲染库
  return safeRenderMarkdown(content)
}

function copyMessage(content: string) {
  navigator.clipboard
    .writeText(content)
    .then(() => {
      showToast('success', '已复制到剪贴板')
    })
    .catch(() => {
      showToast('error', '复制失败')
    })
}

function deleteMessage(id: string) {
  const index = toolStore.aiChatMessages.findIndex((msg) => msg.id === id)
  if (index > -1) {
    toolStore.aiChatMessages.splice(index, 1)
    showToast('success', '消息已删除')
  }
}

// Toast 通知函数
function showToast(type: 'success' | 'error' | 'info', message: string) {
  toastMessage.value = { type, message }

  const duration = type === 'success' ? 2000 : type === 'error' ? 4000 : 3000
  setTimeout(() => {
    toastMessage.value = null
  }, duration)
}

function hideToast() {
  toastMessage.value = null
}

function clearChat() {
  if (confirm('确定要清空所有对话记录吗？')) {
    toolStore.aiChatMessages.splice(0)
  }
}

// function exportChat() {
//   const chatData = {
//     timestamp: new Date().toISOString(),
//     config: {
//       model: localConfig.value.model,
//       temperature: localConfig.value.temperature,
//     },
//     messages: toolStore.aiChatMessages,
//   }

//   const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' })
//   const url = URL.createObjectURL(blob)
//   const a = document.createElement('a')
//   a.href = url
//   a.download = `ai-chat-${new Date().toISOString().split('T')[0]}.json`
//   document.body.appendChild(a)
//   a.click()
//   document.body.removeChild(a)
//   URL.revokeObjectURL(url)
// }
</script>

<style scoped>
@import 'highlight.js/styles/github.css';

.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: 70vh;
  max-height: 800px;
  gap: var(--spacing);
}

.ai-chat-container.compact-mode {
  height: 90vh; /* 减少到90vh，为状态栏等留出空间 */
  max-height: 90vh;
  gap: var(--spacing-sm);
}

/* 配置面板样式 */
.config-section {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: all 0.3s ease;
  max-height: 65vh; /* 减少桌面端最大高度 */
}

.config-section.collapsed {
  max-height: 60px;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing);
  background: var(--color-background-mute);
  cursor: pointer;
  user-select: none;
}

.config-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.toggle-icon {
  transition: transform 0.3s ease;
  font-size: 0.8rem;
}

.config-form-container {
  max-height: 60vh; /* 减少桌面端最大高度，留出更多空间 */
  overflow-y: auto; /* 允许滚动 */
  overflow-x: hidden; /* 隐藏水平滚动 */
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
  /* 添加底部内边距，确保最后的按钮能完整显示 */
  padding-bottom: var(--spacing);
}

/* Webkit 浏览器滚动条样式 */
.config-form-container::-webkit-scrollbar {
  width: 8px;
}

.config-form-container::-webkit-scrollbar-track {
  background: var(--color-background-mute);
  border-radius: 4px;
}

.config-form-container::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
  transition: background 0.2s ease;
}

.config-form-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-light);
}

.config-form {
  padding: var(--spacing);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing);
  margin-bottom: var(--spacing);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-light);
}

.form-group input,
.form-group select {
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.9rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

/* Base URL 特殊样式 */
.base-url-group {
  position: relative;
}

.base-url-container {
  display: flex;
  gap: var(--spacing-xs);
}

.base-url-select {
  min-width: 100px;
  flex-shrink: 0;
}

.base-url-input {
  flex: 1;
}

.endpoint-display {
  font-size: 0.8rem;
  color: var(--color-text-light);
  margin-top: var(--spacing-xs);
  padding: var(--spacing-xs);
  background: var(--color-background-mute);
  border-radius: var(--radius-sm);
  font-family: 'Monaco', 'Menlo', monospace;
}

/* 模型输入样式 */
.model-group {
  position: relative;
}

.model-input-container {
  position: relative;
}

.model-input {
  width: 100%;
}

/* 记忆提示样式 */
.memory-hint {
  font-size: 0.75rem;
  color: var(--color-text-lighter);
  margin-top: var(--spacing-xs);
  font-style: italic;
}

/* 系统提示样式 */
.full-width {
  grid-column: 1 / -1;
}

.system-prompt-textarea {
  width: 100%;
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
  line-height: 1.4;
  padding: var(--spacing-sm);
  border: 1px solid #dee2e6;
  border-radius: var(--radius-sm);
  background: #ffffff;
  color: #495057;
  transition: all 0.2s ease;
}

.system-prompt-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
  background: #ffffff;
}

.config-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  margin-top: var(--spacing); /* 增加顶部间距 */
  margin-bottom: var(--spacing); /* 添加底部间距，确保按钮不被截断 */
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: var(--spacing-sm) var(--spacing);
  border: 1px solid;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f8f9fa;
  border-color: #dee2e6;
  color: #495057;
}

.btn-secondary:hover {
  background: #e9ecef;
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-danger {
  background: var(--color-danger);
  border-color: var(--color-danger);
  color: white;
}

.btn-danger:hover {
  background: var(--color-danger-hover);
  border-color: var(--color-danger-hover);
  color: white;
}

.config-status {
  margin-top: var(--spacing);
  margin-bottom: var(--spacing); /* 添加底部间距 */
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}

.config-status.success {
  background: var(--color-success-light);
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

.config-status.error {
  background: var(--color-danger-light);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}

.config-status.warning {
  background: var(--color-warning-light);
  color: var(--color-warning);
  border: 1px solid var(--color-warning);
}

/* 回到底部按钮样式 */
.scroll-to-bottom {
  position: absolute;
  bottom: 200px; /* 留出输入区的空间 */
  right: 20px;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  z-index: 10;
  transition: all 0.3s ease;
  animation: slideUp 0.3s ease;
}

.scroll-to-bottom:hover {
  background: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.scroll-icon {
  font-size: 1.1rem;
  font-weight: bold;
}

.scroll-text {
  white-space: nowrap;
}

/* 深色模式下的回到底部按钮 */
.dark .scroll-to-bottom {
  background: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.dark .scroll-to-bottom:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 聊天区域样式 */
.chat-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
  position: relative;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing);
  display: flex;
  flex-direction: column;
  gap: var(--spacing);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--color-text-light);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing);
}

.empty-state h3 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: 1.2rem;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
}

.message {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing);
  border-radius: var(--radius);
  max-width: 80%;
  position: relative;
}

.message.user-message {
  align-self: flex-end;
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.message.assistant-message {
  align-self: flex-start;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
}

.message.loading {
  opacity: 0.7;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--color-text-light);
  margin-bottom: var(--spacing-xs);
}

.message-role {
  font-weight: 600;
}

.message-content {
  line-height: 1.6;
  word-wrap: break-word;
  margin-bottom: var(--spacing-xs);
}

/* Markdown 样式 */
.message-content :deep(h1),
.message-content :deep(h2),
.message-content :deep(h3),
.message-content :deep(h4),
.message-content :deep(h5),
.message-content :deep(h6) {
  margin: 1em 0 0.5em 0;
  font-weight: 600;
  line-height: 1.4;
}

.message-content :deep(h1) {
  font-size: 1.5em;
}
.message-content :deep(h2) {
  font-size: 1.3em;
}
.message-content :deep(h3) {
  font-size: 1.2em;
}
.message-content :deep(h4) {
  font-size: 1.1em;
}

.message-content :deep(p) {
  margin: 0.5em 0;
  line-height: 1.6;
}

.message-content :deep(ul),
.message-content :deep(ol) {
  margin: 0.5em 0;
  padding-left: 2em;
}

.message-content :deep(li) {
  margin: 0.25em 0;
}

.message-content :deep(strong) {
  font-weight: 600;
  color: var(--color-text-active);
}

.message-content :deep(em) {
  font-style: italic;
  color: var(--color-text);
}

.message-content :deep(code) {
  background: var(--color-background-mute);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.9em;
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}

/* 代码块样式 */
.message-content :deep(.code-block) {
  margin: 1em 0;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.message-content :deep(.code-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5em 1em;
  background: var(--color-background-mute);
  border-bottom: 1px solid var(--color-border);
  font-size: 0.85em;
}

.message-content :deep(.code-language) {
  color: var(--color-text-light);
  font-weight: 500;
  text-transform: uppercase;
  font-size: 0.8em;
}

.message-content :deep(.code-copy-btn) {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-light);
  cursor: pointer;
  font-size: 0.8em;
  transition: all 0.2s ease;
}

.message-content :deep(.code-copy-btn:hover) {
  background: var(--color-background-soft);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.message-content :deep(.code-block pre) {
  margin: 0;
  padding: 1em;
  background: var(--color-background-soft);
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.9em;
  line-height: 1.5;
}

/* 表格样式 */
.message-content :deep(.markdown-table-wrapper) {
  overflow-x: auto;
  margin: 1em 0;
}

.message-content :deep(.markdown-table) {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
}

.message-content :deep(.markdown-table th),
.message-content :deep(.markdown-table td) {
  padding: 0.75em;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.message-content :deep(.markdown-table th) {
  background: var(--color-background-mute);
  font-weight: 600;
  color: var(--color-text-active);
}

.message-content :deep(.markdown-table tr:nth-child(even)) {
  background: var(--color-background-soft);
}

.message-content :deep(.markdown-table tr:hover) {
  background: var(--color-primary-light);
}

/* 引用块样式 */
.message-content :deep(.markdown-blockquote) {
  margin: 1em 0;
  padding: 0.75em 1em;
  border-left: 4px solid var(--color-primary);
  background: var(--color-background-soft);
  color: var(--color-text-light);
  font-style: italic;
  border-radius: 0 var(--radius) var(--radius) 0;
}

/* 链接样式 */
.message-content :deep(a) {
  color: var(--color-primary);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
}

.message-content :deep(a:hover) {
  border-bottom-color: var(--color-primary);
  color: var(--color-primary-hover);
}

/* 分割线样式 */
.message-content :deep(hr) {
  margin: 1.5em 0;
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-border), transparent);
}

.message-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-xs);
}

.message-actions {
  display: flex;
  gap: var(--spacing-xs);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.message:hover .message-actions {
  opacity: 1;
}

.message-tokens {
  font-size: 0.75rem;
  color: var(--color-text-lighter);
  font-family: 'Monaco', 'Menlo', monospace;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-light);
  border-radius: var(--radius-xs);
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--color-background-soft);
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.copy-btn:hover {
  background: var(--color-success-light);
  border-color: var(--color-success);
  color: var(--color-success);
}

.delete-btn:hover {
  background: var(--color-danger-light);
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.btn-icon {
  font-size: 0.8rem;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-text-lighter);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}
.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 输入区域样式 */
.chat-input-section {
  border-top: 1px solid var(--color-border);
  padding: var(--spacing);
  background: var(--color-background-soft);
}

.input-container {
  display: flex;
  gap: var(--spacing-sm);
  align-items: flex-end;
  margin-bottom: var(--spacing-sm);
}

.input-container textarea {
  flex: 1;
  min-height: 60px;
  max-height: 150px;
  resize: none;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-background);
  color: var(--color-text);
  font-family: inherit;
  line-height: 1.4;
}

.input-container textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.input-container textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-button {
  padding: var(--spacing-sm);
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 1.1rem;
  min-width: 48px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.send-button:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.send-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
}

.input-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-xs);
}

.context-tokens {
  font-size: 0.75rem;
  color: var(--color-text-lighter);
  font-family: 'Monaco', 'Menlo', monospace;
}

.input-count {
  font-size: 0.8rem;
  color: var(--color-text-light);
}

/* 流式输出样式 */
.streaming {
  border-left: 3px solid var(--color-primary);
}

.streaming-indicator {
  display: flex;
  align-items: center;
}

.typing-cursor {
  display: inline-block;
  font-weight: bold;
  color: var(--color-primary);
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

/* Toast 通知样式 */
.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  min-width: 300px;
  max-width: 400px;
  padding: 0;
  border-radius: var(--radius);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  animation: slideInRight 0.3s ease;
}

.toast-notification.success {
  background: var(--color-success);
  color: white;
}

.toast-notification.error {
  background: var(--color-danger);
  color: white;
}

.toast-notification.info {
  background: var(--color-primary);
  color: white;
}

.toast-content {
  display: flex;
  align-items: center;
  padding: var(--spacing);
  gap: var(--spacing-sm);
}

.toast-icon {
  font-size: 1.2rem;
  font-weight: bold;
  flex-shrink: 0;
}

.toast-text {
  flex: 1;
  font-size: 0.9rem;
}

.toast-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  transition: background 0.2s ease;
}

.toast-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 安全警告样式 */
.security-warning {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
  padding: var(--spacing-xs);
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: var(--radius-sm);
  color: #856404;
  font-size: 0.8rem;
  line-height: 1.4;
}

.security-warning svg {
  flex-shrink: 0;
  color: #f39c12;
}

.dark .security-warning {
  background: rgba(255, 193, 7, 0.1);
  border-color: rgba(255, 193, 7, 0.3);
  color: #ffc107;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-chat-container {
    height: 60vh;
  }

  .ai-chat-container.compact-mode {
    height: 92vh; /* 移动端紧凑模式更小的高度 */
    max-height: 92vh;
  }

  /* 移动端配置面板优化 */
  .config-section {
    position: relative;
    z-index: 5;
    max-height: 55vh; /* 减少移动端最大高度 */
    overflow: hidden; /* 避免外层滚动 */
  }

  .config-form-container {
    max-height: 50vh; /* 减少移动端的最大高度 */
    overflow-y: auto; /* 只允许垂直滚动 */
    overflow-x: hidden; /* 隐藏水平滚动 */
    /* 自定义滚动条样式 */
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;
    /* 移动端也添加底部内边距 */
    padding-bottom: var(--spacing);
  }

  .config-form-container::-webkit-scrollbar {
    width: 6px;
  }

  .config-form-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .config-form-container::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;
  }

  .config-form-container::-webkit-scrollbar-thumb:hover {
    background: var(--color-text-light);
  }

  .config-form {
    padding: var(--spacing);
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .message {
    max-width: 95%;
  }

  .config-actions {
    justify-content: center;
  }

  .input-actions {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-xs);
  }

  /* 移动端回到底部按钮优化 */
  .scroll-to-bottom {
    bottom: 200px; /* 移动端给输入区域更多空间 */
    right: 15px;
    padding: var(--spacing-sm);
    min-width: 44px; /* 确保足够的触摸目标大小 */
    min-height: 44px;
    border-radius: 50%; /* 圆形按钮更适合移动端 */
    justify-content: center;
  }

  .scroll-text {
    display: none; /* 移动端隐藏文字，只显示图标 */
  }

  .scroll-icon {
    font-size: 1.2rem; /* 稍微增大图标以便触摸 */
  }
}

/* 持久化选项样式 */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  font-size: 0.9rem;
  user-select: none;
}

.checkbox-label input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.checkbox-text {
  font-weight: 500;
  color: var(--color-text);
}

.persistent-hint {
  margin-top: var(--spacing-xs);
  font-size: 0.8rem;
  color: var(--color-text-light);
  line-height: 1.4;
  padding-left: 26px; /* 与复选框对齐 */
}

.dark .checkbox-text {
  color: var(--color-text);
}

.dark .persistent-hint {
  color: var(--color-text-light);
}

/* 深色模式下的按钮和表单元素样式 */
.dark .btn-secondary {
  background: var(--color-background-soft);
  border-color: var(--color-border);
  color: var(--color-text);
}

.dark .btn-secondary:hover {
  background: var(--color-background-mute);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.dark .system-prompt-textarea {
  background: var(--color-background-soft);
  border-color: var(--color-border);
  color: var(--color-text);
}

.dark .system-prompt-textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

/* 深色模式下的配置状态样式 */
.dark .config-status.success {
  background: rgba(34, 197, 94, 0.1);
  color: #4ade80;
  border-color: rgba(34, 197, 94, 0.3);
}

.dark .config-status.error {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.3);
}

.dark .config-status.warning {
  background: rgba(245, 158, 11, 0.1);
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.3);
}

/* 深色模式下的滚动条样式 */
.dark .config-form-container::-webkit-scrollbar-track {
  background: var(--color-background-soft);
}

.dark .config-form-container::-webkit-scrollbar-thumb {
  background: var(--color-border);
}

.dark .config-form-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-light);
}
</style>
