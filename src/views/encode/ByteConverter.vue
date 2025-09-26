<template>
  <ToolPanel
    title="Byte字节转换"
    description="提供字符串与字节数组的相互转换功能，支持多种编码格式"
  >
    <!-- 操作工具栏 -->
    <div class="byte-toolbar">
      <div class="mode-buttons">
        <button
          @click="setMode('stringToBytes')"
          class="mode-btn"
          :class="{ active: conversionMode === 'stringToBytes' }"
        >
          <span class="mode-icon">📤</span>
          字符串 → 字节数组
        </button>
        <button
          @click="setMode('bytesToString')"
          class="mode-btn"
          :class="{ active: conversionMode === 'bytesToString' }"
        >
          <span class="mode-icon">📥</span>
          字节数组 → 字符串
        </button>
      </div>
      <div class="config-group">
        <div class="tool-group">
          <label class="field-label">编码格式：</label>
          <select v-model="encoding" class="form-select">
            <option value="utf-8">UTF-8</option>
            <option value="ascii">ASCII</option>
            <option value="utf-16">UTF-16</option>
            <option value="latin1">Latin1</option>
          </select>
        </div>
        <div class="tool-group">
          <label class="field-label">字节格式：</label>
          <select v-model="byteFormat" class="form-select">
            <option value="decimal">十进制 (123,45,67)</option>
            <option value="hex">十六进制 (0x7B,0x2D,0x43)</option>
            <option value="binary">二进制 (01111011,00101101)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <div class="editor-layout">
      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.byteConverterInput"
          language="text"
          :title="inputTitle"
          :placeholder="inputPlaceholder"
          height="400px"
          :show-clear="true"
          :show-copy="true"
        />
      </div>

      <!-- 操作按钮区域 -->
      <div class="operation-buttons">
        <button
          @click="convert"
          class="btn btn-primary operation-btn"
          :disabled="!toolStore.byteConverterInput.trim()"
        >
          <span class="btn-icon">🔄</span>
          转换
        </button>
        <button @click="clearAll" class="btn btn-error operation-btn">
          <span class="btn-icon">🗑️</span>
          清空
        </button>
      </div>

      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.byteConverterOutput"
          language="text"
          :title="outputTitle"
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

    <!-- 统计信息 -->
    <div v-if="stats.visible" class="stats-section">
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">字符数：</span>
          <span class="stat-value">{{ stats.charCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">字节数：</span>
          <span class="stat-value">{{ stats.byteCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">编码：</span>
          <span class="stat-value">{{ encoding.toUpperCase() }}</span>
        </div>
      </div>
    </div>

    <!-- 示例区域 -->
    <div class="examples-section">
      <h3>示例</h3>
      <div class="examples-grid">
        <div class="example-card">
          <h4>中文字符串转换</h4>
          <div class="example-item">
            <span class="example-label">字符串：</span>
            <code class="example-text">你好世界</code>
          </div>
          <div class="example-item">
            <span class="example-label">UTF-8字节：</span>
            <code class="example-text">228,189,160,229,165,189,228,184,150,231,149,140</code>
          </div>
          <button @click="loadChineseExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>Java有符号字节数组</h4>
          <div class="example-item">
            <span class="example-label">Java字节数组：</span>
            <code class="example-text">123, -28, -72, -83, 65, 66, 67</code>
          </div>
          <div class="example-item">
            <span class="example-label">转换后的字符串：</span>
            <code class="example-text">中文和英文混合</code>
          </div>
          <button @click="loadJavaExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>英文字符串转换</h4>
          <div class="example-item">
            <span class="example-label">字符串：</span>
            <code class="example-text">Hello World!</code>
          </div>
          <div class="example-item">
            <span class="example-label">ASCII字节：</span>
            <code class="example-text">72,101,108,108,111,32,87,111,114,108,100,33</code>
          </div>
          <button @click="loadEnglishExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>十六进制字节转换</h4>
          <div class="example-item">
            <span class="example-label">十六进制：</span>
            <code class="example-text">0x48,0x65,0x6C,0x6C,0x6F</code>
          </div>
          <div class="example-item">
            <span class="example-label">字符串：</span>
            <code class="example-text">Hello</code>
          </div>
          <button @click="loadHexExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>二进制字节转换</h4>
          <div class="example-item">
            <span class="example-label">二进制：</span>
            <code class="example-text">01001000,01100101,01101100,01101100,01101111</code>
          </div>
          <div class="example-item">
            <span class="example-label">字符串：</span>
            <code class="example-text">Hello</code>
          </div>
          <button @click="loadBinaryExample" class="example-btn">使用此示例</button>
        </div>
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="info-section">
      <h3>功能说明</h3>
      <div class="info-grid">
        <div class="info-card">
          <h4>字符串转字节数组</h4>
          <p>将文本字符串按指定编码格式转换为字节数组，支持多种显示格式。</p>
          <h5>支持特性：</h5>
          <ul>
            <li>UTF-8、ASCII、UTF-16、Latin1编码</li>
            <li>十进制、十六进制、二进制显示</li>
            <li>自动统计字符数和字节数</li>
            <li>支持中文、英文、特殊字符</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>字节数组转字符串</h4>
          <p>将字节数组按指定编码格式解码为可读的文本字符串。</p>
          <h5>输入格式：</h5>
          <ul>
            <li>逗号分隔：123,45,67,89</li>
            <li>空格分隔：123 45 67 89</li>
            <li>十六进制：0x7B,0x2D,0x43或7B 2D 43</li>
            <li>二进制：01111011,00101101</li>
            <li>Java有符号字节：123,-28,-72,-83（支持-128到127）</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>编码格式说明</h4>
          <ul>
            <li><strong>UTF-8：</strong>变长编码，中文3字节，英文1字节</li>
            <li><strong>ASCII：</strong>单字节编码，仅支持0-127字符</li>
            <li><strong>UTF-16：</strong>双字节编码，每字符2或4字节</li>
            <li><strong>Latin1：</strong>单字节编码，支持0-255字符</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>应用场景</h4>
          <ul>
            <li><strong>网络传输：</strong>协议开发中的数据格式调试</li>
            <li><strong>文件处理：</strong>二进制文件内容分析</li>
            <li><strong>编码调试：</strong>字符编码问题排查</li>
            <li><strong>数据解析：</strong>协议报文解析验证</li>
            <li><strong>加密解密：</strong>密钥和密文的字节分析</li>
          </ul>
        </div>
      </div>
    </div>
  </ToolPanel>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import { useToolStore } from '@/stores/tool'

const toolStore = useToolStore()
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')

// 转换模式
const conversionMode = ref<'stringToBytes' | 'bytesToString'>('stringToBytes')

// 配置选项
const encoding = ref<'utf-8' | 'ascii' | 'utf-16' | 'latin1'>('utf-8')
const byteFormat = ref<'decimal' | 'hex' | 'binary'>('decimal')

// 统计信息
const stats = reactive({
  visible: false,
  charCount: 0,
  byteCount: 0,
})

// 计算属性
const inputTitle = computed(() => {
  return conversionMode.value === 'stringToBytes' ? '字符串输入' : '字节数组输入'
})

const outputTitle = computed(() => {
  return conversionMode.value === 'stringToBytes' ? '字节数组输出' : '字符串输出'
})

const inputPlaceholder = computed(() => {
  return conversionMode.value === 'stringToBytes'
    ? '请输入要转换的字符串...'
    : '请输入字节数组（如：123,45,67 或 0x7B,0x2D,0x43）...'
})

// 示例数据
const examples = {
  chinese: '你好世界',
  english: 'Hello World!',
  hex: '0x48,0x65,0x6C,0x6C,0x6F',
  binary: '01001000,01100101,01101100,01101100,01101111',
  java: '123, -28, -72, -83, 65, 66, 67',
}

// 显示状态消息
const showStatus = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  statusMessage.value = message
  statusType.value = type

  // 3秒后自动清除消息
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

// 更新统计信息
const updateStats = (text: string, bytes: number[]) => {
  stats.charCount = text.length
  stats.byteCount = bytes.length
  stats.visible = true
}

// 设置转换模式
const setMode = (mode: 'stringToBytes' | 'bytesToString') => {
  conversionMode.value = mode
  showStatus(
    `转换模式: ${mode === 'stringToBytes' ? '字符串 → 字节数组' : '字节数组 → 字符串'}`,
    'info',
  )
}

// 统一转换功能
const convert = () => {
  if (conversionMode.value === 'stringToBytes') {
    stringToBytes()
  } else {
    bytesToString()
  }
}

// 字符串转字节数组
const stringToBytes = () => {
  try {
    const text = toolStore.byteConverterInput.trim()
    if (!text) {
      showStatus('请输入要转换的字符串', 'error')
      return
    }

    let bytes: number[]

    // 根据编码格式转换
    switch (encoding.value) {
      case 'utf-8':
        bytes = Array.from(new TextEncoder().encode(text))
        break
      case 'ascii':
        // 检查是否包含非ASCII字符
        if (!/^[\x00-\x7F]*$/.test(text)) {
          showStatus('ASCII编码不支持非ASCII字符，请使用UTF-8编码', 'error')
          return
        }
        bytes = Array.from(text).map((char: string) => char.charCodeAt(0))
        break
      case 'utf-16':
        // UTF-16编码，包含BOM
        const utf16Buffer = new TextEncoder().encode('\uFEFF' + text)
        bytes = Array.from(utf16Buffer)
        break
      case 'latin1':
        // Latin1编码
        bytes = Array.from(text).map((char: string) => {
          const code = char.charCodeAt(0)
          if (code > 255) {
            throw new Error(`字符 "${char}" 不能用Latin1编码表示`)
          }
          return code
        })
        break
      default:
        bytes = Array.from(new TextEncoder().encode(text))
    }

    // 根据显示格式转换
    let result: string
    switch (byteFormat.value) {
      case 'decimal':
        result = bytes.join(',')
        break
      case 'hex':
        result = bytes.map((b) => `0x${b.toString(16).toUpperCase().padStart(2, '0')}`).join(',')
        break
      case 'binary':
        result = bytes.map((b) => b.toString(2).padStart(8, '0')).join(',')
        break
      default:
        result = bytes.join(',')
    }

    toolStore.byteConverterOutput = result
    updateStats(text, bytes)
    showStatus(`成功转换，共${bytes.length}个字节`, 'success')
  } catch (error) {
    showStatus('转换失败：' + (error as Error).message, 'error')
    stats.visible = false
  }
}

// 字节数组转字符串
const bytesToString = () => {
  try {
    const input = toolStore.byteConverterInput.trim()
    if (!input) {
      showStatus('请输入要转换的字节数组', 'error')
      return
    }

    // 解析字节数组
    let bytes: number[]

    // 尝试不同的格式解析
    if (input.includes('0x') || input.includes('0X')) {
      // 十六进制格式
      bytes = input
        .split(/[,\s]+/)
        .map((s: string) => {
          const hex = s.trim().replace(/^0x/i, '')
          const num = parseInt(hex, 16)
          if (isNaN(num) || num < 0 || num > 255) {
            throw new Error(`无效的十六进制字节值: ${s}`)
          }
          return num
        })
        .filter((n: number) => !isNaN(n))
    } else if (input.includes('0') && input.includes('1') && !input.includes('2')) {
      // 可能是二进制格式
      bytes = input
        .split(/[,\s]+/)
        .map((s: string) => {
          const binary = s.trim()
          if (!/^[01]+$/.test(binary)) {
            throw new Error(`无效的二进制字节值: ${s}`)
          }
          const num = parseInt(binary, 2)
          if (num > 255) {
            throw new Error(`二进制值超出字节范围: ${s}`)
          }
          return num
        })
        .filter((n: number) => !isNaN(n))
    } else {
      // 十进制格式，支持Java有符号字节（-128到127）和无符号字节（0到255）
      bytes = input
        .split(/[,\s]+/)
        .map((s: string) => {
          const num = parseInt(s.trim(), 10)
          if (isNaN(num)) {
            throw new Error(`无效的字节值: ${s}`)
          }
          // 处理Java有符号字节：将-128到-1转换为128到255
          if (num >= -128 && num <= -1) {
            return num + 256
          }
          // 处理标准字节范围
          if (num >= 0 && num <= 255) {
            return num
          }
          throw new Error(`字节值超出范围: ${s} (有效范围: -128到127或0到255)`)
        })
        .filter((n: number) => !isNaN(n))
    }

    if (bytes.length === 0) {
      throw new Error('未找到有效的字节数据')
    }

    // 根据编码格式解码
    let result: string
    const uint8Array = new Uint8Array(bytes)

    switch (encoding.value) {
      case 'utf-8':
        result = new TextDecoder('utf-8').decode(uint8Array)
        break
      case 'ascii':
        // 检查是否所有字节都在ASCII范围内
        if (bytes.some((b) => b > 127)) {
          showStatus('警告：某些字节值超出ASCII范围，可能显示异常', 'error')
        }
        result = String.fromCharCode(...bytes)
        break
      case 'utf-16':
        result = new TextDecoder('utf-16').decode(uint8Array)
        break
      case 'latin1':
        result = String.fromCharCode(...bytes)
        break
      default:
        result = new TextDecoder('utf-8').decode(uint8Array)
    }

    toolStore.byteConverterOutput = result
    updateStats(result, bytes)
    showStatus(`成功转换，共${result.length}个字符`, 'success')
  } catch (error) {
    showStatus('转换失败：' + (error as Error).message, 'error')
    stats.visible = false
  }
}

// 清空所有内容
const clearAll = () => {
  toolStore.byteConverterInput = ''
  toolStore.byteConverterOutput = ''
  stats.visible = false
  showStatus('已清空所有内容', 'info')
}

// 加载示例
const loadChineseExample = () => {
  toolStore.byteConverterInput = examples.chinese
  encoding.value = 'utf-8'
  byteFormat.value = 'decimal'
  showStatus('已加载中文示例', 'info')
}

const loadEnglishExample = () => {
  toolStore.byteConverterInput = examples.english
  encoding.value = 'ascii'
  byteFormat.value = 'decimal'
  showStatus('已加载英文示例', 'info')
}

const loadHexExample = () => {
  toolStore.byteConverterInput = examples.hex
  encoding.value = 'ascii'
  byteFormat.value = 'hex'
  showStatus('已加载十六进制示例', 'info')
}

const loadBinaryExample = () => {
  toolStore.byteConverterInput = examples.binary
  encoding.value = 'ascii'
  byteFormat.value = 'binary'
  showStatus('已加载二进制示例', 'info')
}

const loadJavaExample = () => {
  toolStore.byteConverterInput = examples.java
  conversionMode.value = 'bytesToString'
  encoding.value = 'utf-8'
  showStatus('已加载Java有符号字节数组示例', 'info')
}
</script>

<style scoped>
.byte-toolbar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.mode-buttons {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  background-color: var(--color-background-mute);
  padding: 0.25rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  background-color: transparent;
  color: var(--color-text);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.mode-btn:hover {
  background-color: var(--color-background-soft);
  color: var(--color-text-active);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.mode-btn.active {
  background-color: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-md);
}

.mode-btn.active:hover {
  background-color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.mode-icon {
  font-size: 1rem;
}

.config-group {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.field-label {
  font-size: 0.875rem;
  color: var(--color-text);
  font-weight: 500;
}

.form-select {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
  min-width: 120px;
}

.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
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

.stats-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-light);
}

.stat-value {
  font-weight: 600;
  color: var(--color-text);
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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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

.info-card li strong {
  color: var(--color-heading);
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

  .byte-toolbar {
    padding: 0.75rem;
  }

  .mode-buttons {
    flex-direction: column;
    width: 100%;
  }

  .mode-btn {
    justify-content: center;
  }

  .config-group {
    flex-direction: column;
    gap: 1rem;
  }

  .tool-group {
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
