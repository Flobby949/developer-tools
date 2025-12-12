<template>
  <ToolPanel title="文本格式化" description="提供文本格式化、大小写转换、命名格式转换等常用文本处理功能">
    <!-- 操作工具栏 -->
    <div class="encode-toolbar">
      <div class="tool-group">
        <button @click="clearAll" class="btn btn-error">
          <span class="btn-icon">🗑️</span>
          清空
        </button>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <div class="format-layout">
      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.textFormatInput"
          language="text"
          title="输入文本"
          placeholder="请输入需要格式化的文本..."
          height="200px"
          :show-clear="true"
          :show-copy="true"
        />
      </div>

      <!-- 格式化操作 -->
      <div class="format-actions">
        <div class="action-group">
          <h4>空白处理</h4>
          <div class="action-buttons">
            <button @click="trimSpaces" class="action-btn">去除首尾空格</button>
            <button @click="removeAllSpaces" class="action-btn">去除所有空格</button>
            <button @click="removeExtraSpaces" class="action-btn">合并多余空格</button>
            <button @click="removeLineBreaks" class="action-btn">去除换行</button>
            <button @click="removeEmptyLines" class="action-btn">去除空行</button>
          </div>
        </div>

        <div class="action-group">
          <h4>大小写转换</h4>
          <div class="action-buttons">
            <button @click="toUpperCase" class="action-btn">全部大写</button>
            <button @click="toLowerCase" class="action-btn">全部小写</button>
            <button @click="capitalizeFirst" class="action-btn">首字母大写</button>
            <button @click="capitalizeWords" class="action-btn">每词首字母大写</button>
            <button @click="toggleCase" class="action-btn">大小写互换</button>
          </div>
        </div>

        <div class="action-group">
          <h4>命名格式转换</h4>
          <div class="action-buttons">
            <button @click="toCamelCase" class="action-btn">驼峰命名 (camelCase)</button>
            <button @click="toPascalCase" class="action-btn">帕斯卡命名 (PascalCase)</button>
            <button @click="toSnakeCase" class="action-btn">下划线命名 (snake_case)</button>
            <button @click="toKebabCase" class="action-btn">短横线命名 (kebab-case)</button>
            <button @click="toConstantCase" class="action-btn">常量命名 (CONSTANT_CASE)</button>
          </div>
        </div>

        <div class="action-group">
          <h4>其他处理</h4>
          <div class="action-buttons">
            <button @click="reverseText" class="action-btn">文本反转</button>
            <button @click="sortLines" class="action-btn">按行排序</button>
            <button @click="removeDuplicateLines" class="action-btn">去除重复行</button>
            <button @click="countStats" class="action-btn">统计字符</button>
          </div>
        </div>
      </div>

      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.textFormatOutput"
          language="text"
          title="输出结果"
          height="200px"
          :show-clear="false"
          :show-copy="true"
        />
      </div>
    </div>

    <!-- 统计结果 -->
    <div v-if="charStats" class="stats-result">
      <h3>字符统计</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ charStats.totalChars }}</span>
          <span class="stat-label">总字符数</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ charStats.charsNoSpaces }}</span>
          <span class="stat-label">字符数(不含空格)</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ charStats.words }}</span>
          <span class="stat-label">单词数</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ charStats.lines }}</span>
          <span class="stat-label">行数</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ charStats.chineseChars }}</span>
          <span class="stat-label">中文字符</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ charStats.englishChars }}</span>
          <span class="stat-label">英文字符</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ charStats.numbers }}</span>
          <span class="stat-label">数字</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ charStats.spaces }}</span>
          <span class="stat-label">空格</span>
        </div>
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
          <h4>命名转换</h4>
          <div class="example-item">
            <span class="example-label">输入：</span>
            <code class="example-text">user_login_name</code>
          </div>
          <div class="example-item">
            <span class="example-label">驼峰：</span>
            <code class="example-text">userLoginName</code>
          </div>
          <div class="example-item">
            <span class="example-label">帕斯卡：</span>
            <code class="example-text">UserLoginName</code>
          </div>
          <button @click="loadNamingExample" class="example-btn">使用此示例</button>
        </div>
        <div class="example-card">
          <h4>文本清理</h4>
          <div class="example-item">
            <span class="example-label">输入：</span>
            <code class="example-text">  Hello   World  </code>
          </div>
          <div class="example-item">
            <span class="example-label">去首尾空格：</span>
            <code class="example-text">Hello   World</code>
          </div>
          <div class="example-item">
            <span class="example-label">合并多余空格：</span>
            <code class="example-text">Hello World</code>
          </div>
          <button @click="loadCleanExample" class="example-btn">使用此示例</button>
        </div>
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="info-section">
      <h3>功能说明</h3>
      <div class="info-grid">
        <div class="info-card">
          <h4>空白处理</h4>
          <ul>
            <li>去除首尾空格：移除文本开头和结尾的空格</li>
            <li>去除所有空格：移除文本中的所有空白字符</li>
            <li>合并多余空格：将连续的多个空格合并为一个</li>
            <li>去除换行：移除所有换行符</li>
            <li>去除空行：移除只包含空白的行</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>命名格式转换</h4>
          <ul>
            <li>驼峰命名 (camelCase)：首字母小写</li>
            <li>帕斯卡命名 (PascalCase)：首字母大写</li>
            <li>下划线命名 (snake_case)：单词用下划线连接</li>
            <li>短横线命名 (kebab-case)：单词用短横线连接</li>
            <li>常量命名 (CONSTANT_CASE)：全大写下划线连接</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>其他功能</h4>
          <ul>
            <li>大小写转换：支持多种转换方式</li>
            <li>文本反转：将文本内容倒序排列</li>
            <li>按行排序：按字母顺序排列每行</li>
            <li>去除重复行：移除重复的文本行</li>
            <li>字符统计：统计各类字符数量</li>
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

// 状态消息
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')

// 字符统计
interface CharStats {
  totalChars: number
  charsNoSpaces: number
  words: number
  lines: number
  chineseChars: number
  englishChars: number
  numbers: number
  spaces: number
}
const charStats = ref<CharStats | null>(null)

// 显示状态消息
const showStatus = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  statusMessage.value = message
  statusType.value = type
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

const clearAll = () => {
  toolStore.textFormatInput = ''
  toolStore.textFormatOutput = ''
  charStats.value = null
  showStatus('已清空', 'info')
}

// ===== 空白处理 =====
const trimSpaces = () => {
  toolStore.textFormatOutput = toolStore.textFormatInput.trim()
  showStatus('已去除首尾空格', 'success')
}

const removeAllSpaces = () => {
  toolStore.textFormatOutput = toolStore.textFormatInput.replace(/\s/g, '')
  showStatus('已去除所有空格', 'success')
}

const removeExtraSpaces = () => {
  toolStore.textFormatOutput = toolStore.textFormatInput.replace(/[ \t]+/g, ' ').trim()
  showStatus('已合并多余空格', 'success')
}

const removeLineBreaks = () => {
  toolStore.textFormatOutput = toolStore.textFormatInput.replace(/[\r\n]+/g, '')
  showStatus('已去除换行', 'success')
}

const removeEmptyLines = () => {
  toolStore.textFormatOutput = toolStore.textFormatInput
    .split('\n')
    .filter((line) => line.trim() !== '')
    .join('\n')
  showStatus('已去除空行', 'success')
}

// ===== 大小写转换 =====
const toUpperCase = () => {
  toolStore.textFormatOutput = toolStore.textFormatInput.toUpperCase()
  showStatus('已转换为大写', 'success')
}

const toLowerCase = () => {
  toolStore.textFormatOutput = toolStore.textFormatInput.toLowerCase()
  showStatus('已转换为小写', 'success')
}

const capitalizeFirst = () => {
  const text = toolStore.textFormatInput
  toolStore.textFormatOutput = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  showStatus('已转换首字母大写', 'success')
}

const capitalizeWords = () => {
  toolStore.textFormatOutput = toolStore.textFormatInput.replace(/\b\w/g, (char) =>
    char.toUpperCase(),
  )
  showStatus('已转换每词首字母大写', 'success')
}

const toggleCase = () => {
  toolStore.textFormatOutput = toolStore.textFormatInput
    .split('')
    .map((char) => {
      if (char === char.toUpperCase()) {
        return char.toLowerCase()
      }
      return char.toUpperCase()
    })
    .join('')
  showStatus('已互换大小写', 'success')
}

// ===== 命名格式转换 =====
const splitIntoWords = (text: string): string[] => {
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
}

const toCamelCase = () => {
  const words = splitIntoWords(toolStore.textFormatInput)
  if (words.length === 0) {
    toolStore.textFormatOutput = ''
    return
  }
  toolStore.textFormatOutput =
    words[0] + words.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
  showStatus('已转换为驼峰命名', 'success')
}

const toPascalCase = () => {
  const words = splitIntoWords(toolStore.textFormatInput)
  toolStore.textFormatOutput = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
  showStatus('已转换为帕斯卡命名', 'success')
}

const toSnakeCase = () => {
  const words = splitIntoWords(toolStore.textFormatInput)
  toolStore.textFormatOutput = words.join('_')
  showStatus('已转换为下划线命名', 'success')
}

const toKebabCase = () => {
  const words = splitIntoWords(toolStore.textFormatInput)
  toolStore.textFormatOutput = words.join('-')
  showStatus('已转换为短横线命名', 'success')
}

const toConstantCase = () => {
  const words = splitIntoWords(toolStore.textFormatInput)
  toolStore.textFormatOutput = words.join('_').toUpperCase()
  showStatus('已转换为常量命名', 'success')
}

// ===== 其他处理 =====
const reverseText = () => {
  toolStore.textFormatOutput = toolStore.textFormatInput.split('').reverse().join('')
  showStatus('已反转文本', 'success')
}

const sortLines = () => {
  toolStore.textFormatOutput = toolStore.textFormatInput.split('\n').sort().join('\n')
  showStatus('已按行排序', 'success')
}

const removeDuplicateLines = () => {
  const lines = toolStore.textFormatInput.split('\n')
  const uniqueLines = [...new Set(lines)]
  toolStore.textFormatOutput = uniqueLines.join('\n')
  showStatus(`已去除重复行，共移除 ${lines.length - uniqueLines.length} 行`, 'success')
}

const countStats = () => {
  const text = toolStore.textFormatInput
  charStats.value = {
    totalChars: text.length,
    charsNoSpaces: text.replace(/\s/g, '').length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text ? text.split('\n').length : 0,
    chineseChars: (text.match(/[\u4e00-\u9fa5]/g) || []).length,
    englishChars: (text.match(/[a-zA-Z]/g) || []).length,
    numbers: (text.match(/\d/g) || []).length,
    spaces: (text.match(/\s/g) || []).length,
  }
  toolStore.textFormatOutput = toolStore.textFormatInput
  showStatus('统计完成', 'success')
}

// ===== 加载示例 =====
const loadNamingExample = () => {
  toolStore.textFormatInput = 'user_login_name'
  showStatus('已加载命名转换示例', 'info')
}

const loadCleanExample = () => {
  toolStore.textFormatInput = '  Hello   World  '
  showStatus('已加载文本清理示例', 'info')
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

.format-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.editor-section {
  display: flex;
  flex-direction: column;
}

/* 格式化操作样式 */
.format-actions {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.action-group h4 {
  margin: 0 0 0.75rem 0;
  color: var(--color-heading);
  font-size: 0.95rem;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: var(--color-background-mute);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* 统计结果样式 */
.stats-result {
  margin-bottom: 2rem;
}

.stats-result h3 {
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.stat-card {
  padding: 1rem;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--color-text-light);
}

/* 示例区域样式 */
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

/* 功能说明样式 */
.info-section {
  margin-top: 2rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .encode-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .tool-group {
    justify-content: center;
  }

  .examples-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
