<template>
  <ToolPanel title="Unicode编解码" description="提供Unicode编码和解码功能，支持多种Unicode格式转换">
    <!-- 操作工具栏 -->
    <div class="encode-toolbar">
      <div class="tool-group">
        <label class="format-label">编码格式：</label>
        <select v-model="encodeFormat" class="format-select">
          <option value="\\u">\\uXXXX (JavaScript/Java)</option>
          <option value="&#x">&amp;#xXXXX; (HTML Hex)</option>
          <option value="&#">&amp;#XXXXX; (HTML Decimal)</option>
          <option value="U+">U+XXXX (标准Unicode)</option>
        </select>
      </div>
      <div class="tool-group">
        <button @click="clearAll" class="btn btn-error">
          <span class="btn-icon">🗑️</span>
          清空
        </button>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <div class="editor-layout">
      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.unicodeInput"
          language="text"
          title="原始文本"
          placeholder="请输入需要编码的文本或Unicode编码..."
          height="400px"
          :show-clear="true"
          :show-copy="true"
        />
      </div>

      <!-- 操作按钮区域 -->
      <div class="operation-buttons">
        <button
          @click="encodeText"
          class="btn btn-primary operation-btn"
          :disabled="!toolStore.unicodeInput.trim()"
        >
          <span class="btn-icon">→</span>
          Unicode编码
        </button>
        <button
          @click="decodeText"
          class="btn btn-secondary operation-btn"
          :disabled="!toolStore.unicodeInput.trim()"
        >
          <span class="btn-icon">←</span>
          Unicode解码
        </button>
      </div>

      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.unicodeOutput"
          language="text"
          title="处理结果"
          height="400px"
          :show-clear="false"
          :show-copy="true"
        />
      </div>
    </div>

    <!-- 状态信息 -->
    <div v-if="statusMessage" class="alert" :class="`alert-${statusType}`">
      {{ statusMessage }}
    </div>

    <!-- 示例区域 -->
    <div class="examples-section">
      <h3>示例</h3>
      <div class="examples-grid">
        <div class="example-card">
          <h4>中文编码</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">你好，世界！</code>
          </div>
          <div class="example-item">
            <span class="example-label">编码：</span>
            <code class="example-text">\u4f60\u597d\uff0c\u4e16\u754c\uff01</code>
          </div>
          <button @click="loadChineseExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>表情符号编码</h4>
          <div class="example-item">
            <span class="example-label">原文：</span>
            <code class="example-text">Hello 😀🎉</code>
          </div>
          <div class="example-item">
            <span class="example-label">编码：</span>
            <code class="example-text">Hello \ud83d\ude00\ud83c\udf89</code>
          </div>
          <button @click="loadEmojiExample" class="example-btn">使用此示例</button>
        </div>
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="info-section">
      <h3>功能说明</h3>
      <div class="info-grid">
        <div class="info-card">
          <h4>Unicode编码</h4>
          <p>
            将文本中的非ASCII字符转换为Unicode转义序列。常用于程序代码中处理国际化字符。
          </p>
          <h5>支持的格式：</h5>
          <ul>
            <li>\uXXXX - JavaScript/Java格式</li>
            <li>&amp;#xXXXX; - HTML十六进制</li>
            <li>&amp;#XXXXX; - HTML十进制</li>
            <li>U+XXXX - 标准Unicode表示</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>Unicode解码</h4>
          <p>将Unicode转义序列还原为原始字符。支持自动识别多种编码格式。</p>
          <h5>使用场景：</h5>
          <ul>
            <li>解析程序代码中的Unicode字符串</li>
            <li>处理JSON中的转义字符</li>
            <li>解析HTML实体编码</li>
            <li>查看Unicode编码的原始内容</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>注意事项</h4>
          <ul>
            <li>编码时ASCII字符不会被转换</li>
            <li>表情符号等需要代理对的字符会生成两个\uXXXX</li>
            <li>解码支持自动识别多种格式混合</li>
            <li>U+XXXX格式会自动转换为空格分隔</li>
          </ul>
        </div>
      </div>
    </div>
  </ToolPanel>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import { useToolStore } from '@/stores/tool'

const toolStore = useToolStore()
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')
const encodeFormat = ref<'\\u' | '&#x' | '&#' | 'U+'>('\\u')

// 示例数据
const chineseExample = '你好，世界！'
const emojiExample = 'Hello 😀🎉'

// 显示状态消息
const showStatus = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  statusMessage.value = message
  statusType.value = type

  // 3秒后自动清除消息
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

// Unicode编码
const encodeText = () => {
  try {
    const input = toolStore.unicodeInput
    let result = ''

    for (const char of input) {
      const codePoint = char.codePointAt(0)!
      if (codePoint <= 127) {
        // ASCII字符保持不变
        result += char
      } else if (codePoint <= 0xffff) {
        // BMP字符
        result += formatCodePoint(codePoint)
      } else {
        // 超出BMP的字符，需要代理对
        const highSurrogate = Math.floor((codePoint - 0x10000) / 0x400) + 0xd800
        const lowSurrogate = ((codePoint - 0x10000) % 0x400) + 0xdc00
        result += formatCodePoint(highSurrogate) + formatCodePoint(lowSurrogate)
      }
    }

    toolStore.unicodeOutput = result
    showStatus('Unicode编码成功', 'success')
  } catch (error) {
    showStatus('编码失败：' + (error as Error).message, 'error')
  }
}

// 根据选择的格式输出编码
const formatCodePoint = (codePoint: number): string => {
  const hex = codePoint.toString(16).padStart(4, '0')
  switch (encodeFormat.value) {
    case '\\u':
      return `\\u${hex}`
    case '&#x':
      return `&#x${hex};`
    case '&#':
      return `&#${codePoint};`
    case 'U+':
      return `U+${hex.toUpperCase()} `
    default:
      return `\\u${hex}`
  }
}

// Unicode解码
const decodeText = () => {
  try {
    let input = toolStore.unicodeInput
    let result = input

    // 解码 \uXXXX 格式 (JavaScript/Java)
    result = result.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
      return String.fromCharCode(parseInt(hex, 16))
    })

    // 解码 &#xXXXX; 格式 (HTML十六进制)
    result = result.replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => {
      const codePoint = parseInt(hex, 16)
      return String.fromCodePoint(codePoint)
    })

    // 解码 &#XXXXX; 格式 (HTML十进制)
    result = result.replace(/&#(\d+);/g, (_, dec) => {
      const codePoint = parseInt(dec, 10)
      return String.fromCodePoint(codePoint)
    })

    // 解码 U+XXXX 格式 (标准Unicode，可能有空格分隔)
    result = result.replace(/U\+([0-9a-fA-F]{4,6})\s*/gi, (_, hex) => {
      const codePoint = parseInt(hex, 16)
      return String.fromCodePoint(codePoint)
    })

    toolStore.unicodeOutput = result
    showStatus('Unicode解码成功', 'success')
  } catch (error) {
    showStatus('解码失败：' + (error as Error).message, 'error')
  }
}

// 清空所有内容
const clearAll = () => {
  toolStore.unicodeInput = ''
  toolStore.unicodeOutput = ''
  showStatus('已清空所有内容', 'info')
}

// 加载示例
const loadChineseExample = () => {
  toolStore.unicodeInput = chineseExample
  showStatus('已加载中文编码示例', 'info')
}

const loadEmojiExample = () => {
  toolStore.unicodeInput = emojiExample
  showStatus('已加载表情符号示例', 'info')
}
</script>

<style scoped>
.encode-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.format-label {
  font-weight: 500;
  color: var(--color-text);
}

.format-select {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.format-select:hover {
  border-color: var(--vt-c-green);
}

.format-select:focus {
  outline: none;
  border-color: var(--vt-c-green);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.editor-layout {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1.5rem;
  height: 400px;
  margin-bottom: 2rem;
  align-items: center;
}

.operation-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 1rem;
  align-items: center;
}

.operation-btn {
  min-width: 120px;
  padding: 0.75rem 1rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.operation-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.operation-btn .btn-icon {
  font-size: 1.2rem;
  margin-right: 0.5rem;
}

.editor-section {
  display: flex;
  flex-direction: column;
}

.examples-section {
  margin-bottom: 2rem;
}

.examples-section h3,
.info-section h3 {
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.examples-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.example-card,
.info-card {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-background-soft);
}

.example-card h4,
.info-card h4 {
  margin: 0 0 0.75rem 0;
  color: var(--color-heading);
  font-size: 1rem;
}

.info-card h5 {
  margin: 0.75rem 0 0.5rem 0;
  color: var(--color-heading);
  font-size: 0.9rem;
}

.example-item {
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.example-label {
  font-size: 0.8rem;
  color: var(--color-text-light);
}

.example-text {
  background-color: var(--color-background-mute);
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  border: 1px solid var(--color-border);
  word-break: break-all;
}

.example-btn {
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background-color: var(--vt-c-green);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s ease;
}

.example-btn:hover {
  background-color: #369870;
}

.info-card p {
  color: var(--color-text);
  line-height: 1.5;
  margin: 0 0 0.75rem 0;
}

.info-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-card li {
  padding: 0.25rem 0;
  color: var(--color-text);
  position: relative;
  padding-left: 1rem;
}

.info-card li::before {
  content: '•';
  color: var(--vt-c-green);
  font-weight: bold;
  position: absolute;
  left: 0;
}

@media (max-width: 768px) {
  .editor-layout {
    grid-template-columns: 1fr;
    height: auto;
    gap: 1rem;
  }

  .operation-buttons {
    order: -1;
    flex-direction: row;
    justify-content: center;
    padding: 1rem 0;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 1rem;
  }

  .examples-grid {
    grid-template-columns: 1fr;
  }

  .encode-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .tool-group {
    justify-content: center;
  }
}
</style>
