<template>
  <ToolPanel title="正则表达式测试" description="在线测试和调试正则表达式，支持实时匹配和高亮显示">
    <!-- 正则表达式输入 -->
    <div class="regex-input-section">
      <div class="input-group">
        <label class="input-label">正则表达式</label>
        <div class="regex-input-wrapper">
          <span class="regex-delimiter">/</span>
          <input
            v-model="toolStore.regexPattern"
            @input="testRegex"
            placeholder="请输入正则表达式..."
            class="regex-input"
          />
          <span class="regex-delimiter">/</span>
          <input
            v-model="toolStore.regexFlags"
            @input="testRegex"
            placeholder="flags"
            class="flags-input"
            maxlength="6"
          />
        </div>
      </div>

      <div class="flags-section">
        <span class="flags-label">常用标志：</span>
        <label class="flag-label" v-for="flag in commonFlags" :key="flag.value">
          <input
            type="checkbox"
            :value="flag.value"
            @change="toggleFlag(flag.value)"
            :checked="toolStore.regexFlags.includes(flag.value)"
          />
          <span class="flag-text">{{ flag.label }}</span>
        </label>
      </div>
    </div>

    <!-- 测试文本区域 -->
    <div class="test-section">
      <div class="section-header">
        <h3>测试文本</h3>
        <div class="match-stats">
          <span v-if="matchResult">
            找到 <strong>{{ matchResult.matches.length }}</strong> 个匹配
          </span>
        </div>
      </div>

      <div class="test-input-wrapper">
        <textarea
          v-model="toolStore.regexText"
          @input="testRegex"
          placeholder="请输入要测试的文本..."
          class="test-textarea"
          rows="8"
        ></textarea>

        <!-- 高亮显示匹配结果 -->
        <div v-if="highlightedText" class="highlighted-text" v-html="highlightedText"></div>
      </div>
    </div>

    <!-- 匹配结果 -->
    <div v-if="matchResult && matchResult.matches.length > 0" class="results-section">
      <h3>匹配结果</h3>
      <div class="matches-list">
        <div v-for="(match, index) in matchResult.matches" :key="index" class="match-item">
          <div class="match-header">
            <span class="match-index">匹配 {{ index + 1 }}</span>
            <span class="match-position">位置: {{ getMatchPosition(match) }}</span>
          </div>
          <div class="match-content">
            <code>{{ match }}</code>
          </div>
        </div>
      </div>
    </div>

    <!-- 分组结果 -->
    <div v-if="groupResults && groupResults.length > 0" class="groups-section">
      <h3>分组结果</h3>
      <div class="groups-list">
        <div v-for="(group, index) in groupResults" :key="index" class="group-item">
          <div class="group-header">
            <span class="group-index">分组 {{ index }}</span>
          </div>
          <div class="group-content">
            <code>{{ group }}</code>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误信息 -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <!-- 常用正则表达式示例 -->
    <div class="examples-section">
      <h3>常用正则表达式</h3>
      <div class="examples-grid">
        <div
          v-for="example in regexExamples"
          :key="example.name"
          class="example-card"
          @click="loadExample(example)"
        >
          <h4>{{ example.name }}</h4>
          <code class="example-pattern">{{ example.pattern }}</code>
          <p class="example-desc">{{ example.description }}</p>
        </div>
      </div>
    </div>
  </ToolPanel>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'
import { useToolStore } from '@/stores/tool'
import { debounce } from '@/utils'

interface RegexMatch {
  match: boolean
  matches: string[]
  groups?: string[]
}

interface RegexExample {
  name: string
  pattern: string
  flags: string
  description: string
  testText: string
}

const toolStore = useToolStore()
const matchResult = ref<RegexMatch | null>(null)
const groupResults = ref<string[]>([])
const errorMessage = ref('')

// 常用标志
const commonFlags = [
  { value: 'g', label: 'g (全局匹配)' },
  { value: 'i', label: 'i (忽略大小写)' },
  { value: 'm', label: 'm (多行模式)' },
  { value: 's', label: 's (单行模式)' },
  { value: 'u', label: 'u (Unicode)' },
  { value: 'y', label: 'y (粘性匹配)' },
]

// 正则表达式示例
const regexExamples: RegexExample[] = [
  {
    name: '邮箱地址',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    flags: '',
    description: '匹配有效的邮箱地址',
    testText: 'user@example.com\ninvalid-email\ntest.email+tag@domain.co.uk',
  },
  {
    name: '手机号码',
    pattern: '^1[3-9]\\d{9}$',
    flags: '',
    description: '匹配中国大陆手机号码',
    testText: '13812345678\n12345678901\n15987654321\n10123456789',
  },
  {
    name: 'URL地址',
    pattern: 'https?:\\/\\/[^\\s]+',
    flags: 'g',
    description: '匹配HTTP和HTTPS的URL',
    testText: '访问 https://www.example.com 或 http://test.com/path?param=value 查看更多信息',
  },
  {
    name: 'IP地址',
    pattern: '\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b',
    flags: 'g',
    description: '匹配IPv4地址',
    testText: '服务器IP: 192.168.1.1, 网关: 10.0.0.1, DNS: 8.8.8.8',
  },
  {
    name: '日期格式',
    pattern: '\\d{4}-\\d{2}-\\d{2}',
    flags: 'g',
    description: '匹配YYYY-MM-DD格式的日期',
    testText: '今天是 2024-01-15，明天是 2024-01-16',
  },
  {
    name: '中文字符',
    pattern: '[\\u4e00-\\u9fa5]+',
    flags: 'g',
    description: '匹配中文字符',
    testText: 'Hello 世界! 这是一个 test 测试.',
  },
]

// 高亮显示的文本
const highlightedText = computed(() => {
  if (!toolStore.regexText || !matchResult.value || matchResult.value.matches.length === 0) {
    return ''
  }

  try {
    const regex = new RegExp(toolStore.regexPattern, toolStore.regexFlags)
    return toolStore.regexText.replace(regex, '<mark class="highlight-match">$&</mark>')
  } catch {
    return ''
  }
})

// 防抖的测试函数
const debouncedTest = debounce(() => {
  performRegexTest()
}, 300)

// 测试正则表达式
const testRegex = () => {
  debouncedTest()
}

// 执行正则测试
const performRegexTest = () => {
  errorMessage.value = ''
  matchResult.value = null
  groupResults.value = []

  if (!toolStore.regexPattern || !toolStore.regexText) {
    return
  }

  try {
    const regex = new RegExp(toolStore.regexPattern, toolStore.regexFlags)
    const matches = toolStore.regexText.match(regex) || []

    matchResult.value = {
      match: matches.length > 0,
      matches,
    }

    // 获取分组结果
    if (matches.length > 0) {
      const execResult = regex.exec(toolStore.regexText)
      if (execResult && execResult.length > 1) {
        groupResults.value = execResult.slice(1)
      }
    }
  } catch (error) {
    errorMessage.value = '正则表达式语法错误：' + (error as Error).message
  }
}

// 切换标志
const toggleFlag = (flag: string) => {
  if (toolStore.regexFlags.includes(flag)) {
    toolStore.regexFlags = toolStore.regexFlags.replace(flag, '')
  } else {
    toolStore.regexFlags += flag
  }
  testRegex()
}

// 获取匹配位置
const getMatchPosition = (match: string): string => {
  const index = toolStore.regexText.indexOf(match)
  return index !== -1 ? `${index}-${index + match.length}` : '未知'
}

// 加载示例
const loadExample = (example: RegexExample) => {
  toolStore.regexPattern = example.pattern
  toolStore.regexFlags = example.flags
  toolStore.regexText = example.testText
  testRegex()
}

// 监听数据变化
watch(
  [() => toolStore.regexPattern, () => toolStore.regexFlags, () => toolStore.regexText],
  () => {
    testRegex()
  },
  { immediate: true },
)
</script>

<style scoped>
.regex-input-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.input-group {
  margin-bottom: 1rem;
}

.input-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-heading);
}

.regex-input-wrapper {
  display: flex;
  align-items: center;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.5rem;
  font-family: 'Courier New', monospace;
}

.regex-delimiter {
  color: var(--vt-c-green);
  font-weight: bold;
  font-size: 1.2rem;
}

.regex-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  padding: 0.25rem 0.5rem;
}

.flags-input {
  width: 80px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  padding: 0.25rem 0.5rem;
  text-align: center;
}

.flags-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.flags-label {
  color: var(--color-text-light);
  font-size: 0.875rem;
}

.flag-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.flag-text {
  color: var(--color-text);
}

.test-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
  color: var(--color-heading);
}

.match-stats {
  color: var(--color-text-light);
  font-size: 0.875rem;
}

.test-input-wrapper {
  position: relative;
}

.test-textarea {
  width: 100%;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
  outline: none;
}

.highlighted-text {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 1rem;
  pointer-events: none;
  background: transparent;
  color: transparent;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: hidden;
}

:deep(.highlight-match) {
  background-color: #ffeb3b;
  color: #000;
  padding: 0.1rem 0.2rem;
  border-radius: 2px;
  font-weight: bold;
}

.results-section,
.groups-section {
  margin-bottom: 2rem;
}

.results-section h3,
.groups-section h3 {
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.matches-list,
.groups-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.match-item,
.group-item {
  padding: 1rem;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.match-header,
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.match-index,
.group-index {
  font-weight: 500;
  color: var(--color-heading);
}

.match-position {
  font-size: 0.8rem;
  color: var(--color-text-light);
}

.match-content,
.group-content {
  font-family: 'Courier New', monospace;
  background-color: var(--color-background-mute);
  padding: 0.5rem;
  border-radius: 3px;
  border: 1px solid var(--color-border);
}

.error-message {
  padding: 1rem;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin-bottom: 2rem;
}

.examples-section {
  margin-top: 2rem;
}

.examples-section h3 {
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.example-card {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-background-soft);
  cursor: pointer;
  transition: all 0.2s ease;
}

.example-card:hover {
  border-color: var(--vt-c-green);
  background-color: var(--color-background-mute);
}

.example-card h4 {
  margin: 0 0 0.5rem 0;
  color: var(--color-heading);
  font-size: 1rem;
}

.example-pattern {
  display: block;
  background-color: var(--color-background-mute);
  padding: 0.5rem;
  border-radius: 3px;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  word-break: break-all;
  border: 1px solid var(--color-border);
}

.example-desc {
  margin: 0;
  color: var(--color-text-light);
  font-size: 0.875rem;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .flags-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .examples-grid {
    grid-template-columns: 1fr;
  }
}
</style>
