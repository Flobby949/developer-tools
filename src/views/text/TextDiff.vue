<template>
  <ToolPanel title="文本对比" description="比较两段文本的差异，类似于代码版本控制中的 diff 功能">
    <!-- 操作工具栏 -->
    <div class="encode-toolbar">
      <div class="tool-group">
        <button @click="compareTexts" class="btn btn-primary" :disabled="!canCompare">
          <span class="btn-icon">🔍</span>
          对比文本
        </button>
        <button @click="swapTexts" class="btn btn-secondary">
          <span class="btn-icon">⇄</span>
          交换
        </button>
        <button @click="clearAll" class="btn btn-error">
          <span class="btn-icon">🗑️</span>
          清空
        </button>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <div class="diff-layout">
      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.textDiffLeft"
          language="text"
          title="原始文本"
          placeholder="请输入原始文本..."
          height="300px"
          :show-clear="true"
          :show-copy="true"
        />
      </div>
      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.textDiffRight"
          language="text"
          title="对比文本"
          placeholder="请输入对比文本..."
          height="300px"
          :show-clear="true"
          :show-copy="true"
        />
      </div>
    </div>

    <!-- 对比结果 -->
    <div v-if="diffResult.length > 0" class="diff-result">
      <h3>对比结果</h3>
      <div class="diff-stats">
        <span class="stat-item added">+ {{ diffStats.added }} 行新增</span>
        <span class="stat-item removed">- {{ diffStats.removed }} 行删除</span>
        <span class="stat-item unchanged">{{ diffStats.unchanged }} 行未变</span>
      </div>
      <div class="diff-viewer">
        <div
          v-for="(line, index) in diffResult"
          :key="index"
          class="diff-line"
          :class="line.type"
        >
          <span class="line-number">{{ line.lineNumber }}</span>
          <span class="line-prefix">{{ line.prefix }}</span>
          <span class="line-content">{{ line.content }}</span>
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
          <h4>代码对比</h4>
          <div class="example-item">
            <span class="example-label">原始代码</span>
            <code class="example-text">function hello() {
  console.log("Hello");
}</code>
          </div>
          <div class="example-item">
            <span class="example-label">修改后代码</span>
            <code class="example-text">function hello(name) {
  console.log("Hello, " + name);
}</code>
          </div>
          <button @click="loadCodeExample" class="example-btn">使用此示例</button>
        </div>
        <div class="example-card">
          <h4>文档对比</h4>
          <div class="example-item">
            <span class="example-label">版本1</span>
            <code class="example-text">第一行内容
第二行内容
第三行内容</code>
          </div>
          <div class="example-item">
            <span class="example-label">版本2</span>
            <code class="example-text">第一行内容
修改后的第二行
第三行内容
新增的第四行</code>
          </div>
          <button @click="loadDocExample" class="example-btn">使用此示例</button>
        </div>
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="info-section">
      <h3>功能说明</h3>
      <div class="info-grid">
        <div class="info-card">
          <h4>文本对比</h4>
          <p>基于 LCS（最长公共子序列）算法，逐行比较两段文本的差异。</p>
          <ul>
            <li>绿色标记：新增的行</li>
            <li>红色标记：删除的行</li>
            <li>无标记：未变化的行</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>使用场景</h4>
          <ul>
            <li>代码版本比较</li>
            <li>文档修订对比</li>
            <li>配置文件差异检查</li>
            <li>数据变更追踪</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>操作说明</h4>
          <ul>
            <li>在左侧输入原始文本</li>
            <li>在右侧输入对比文本</li>
            <li>点击"对比文本"查看差异</li>
            <li>点击"交换"可互换两侧内容</li>
          </ul>
        </div>
      </div>
    </div>
  </ToolPanel>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import { useToolStore } from '@/stores/tool'

const toolStore = useToolStore()

// 状态消息
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')

// Diff 相关
interface DiffLine {
  lineNumber: string
  prefix: string
  content: string
  type: 'added' | 'removed' | 'unchanged'
}

const diffResult = ref<DiffLine[]>([])
const diffStats = ref({ added: 0, removed: 0, unchanged: 0 })

// 计算属性
const canCompare = computed(() => {
  return toolStore.textDiffLeft.trim() || toolStore.textDiffRight.trim()
})

// 显示状态消息
const showStatus = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  statusMessage.value = message
  statusType.value = type
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

// 计算最长公共子序列
interface LCSItem {
  leftIndex: number
  rightIndex: number
}

const computeLCS = (left: string[], right: string[]): LCSItem[] => {
  const m = left.length
  const n = right.length
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (left[i - 1] === right[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // 回溯找出 LCS
  const result: LCSItem[] = []
  let i = m
  let j = n
  while (i > 0 && j > 0) {
    if (left[i - 1] === right[j - 1]) {
      result.unshift({ leftIndex: i - 1, rightIndex: j - 1 })
      i--
      j--
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }

  return result
}

// 对比文本
const compareTexts = () => {
  const leftLines = toolStore.textDiffLeft.split('\n')
  const rightLines = toolStore.textDiffRight.split('\n')

  const result: DiffLine[] = []
  const stats = { added: 0, removed: 0, unchanged: 0 }

  const lcs = computeLCS(leftLines, rightLines)
  let leftIndex = 0
  let rightIndex = 0
  let lineNumber = 1

  for (const item of lcs) {
    // 添加左侧删除的行
    while (leftIndex < item.leftIndex) {
      result.push({
        lineNumber: String(lineNumber++),
        prefix: '-',
        content: leftLines[leftIndex],
        type: 'removed',
      })
      stats.removed++
      leftIndex++
    }

    // 添加右侧新增的行
    while (rightIndex < item.rightIndex) {
      result.push({
        lineNumber: String(lineNumber++),
        prefix: '+',
        content: rightLines[rightIndex],
        type: 'added',
      })
      stats.added++
      rightIndex++
    }

    // 添加未变的行
    result.push({
      lineNumber: String(lineNumber++),
      prefix: ' ',
      content: leftLines[leftIndex],
      type: 'unchanged',
    })
    stats.unchanged++
    leftIndex++
    rightIndex++
  }

  // 处理剩余的行
  while (leftIndex < leftLines.length) {
    result.push({
      lineNumber: String(lineNumber++),
      prefix: '-',
      content: leftLines[leftIndex],
      type: 'removed',
    })
    stats.removed++
    leftIndex++
  }

  while (rightIndex < rightLines.length) {
    result.push({
      lineNumber: String(lineNumber++),
      prefix: '+',
      content: rightLines[rightIndex],
      type: 'added',
    })
    stats.added++
    rightIndex++
  }

  diffResult.value = result
  diffStats.value = stats
  showStatus('对比完成', 'success')
}

const swapTexts = () => {
  const temp = toolStore.textDiffLeft
  toolStore.textDiffLeft = toolStore.textDiffRight
  toolStore.textDiffRight = temp
  showStatus('已交换文本', 'info')
}

const clearAll = () => {
  toolStore.textDiffLeft = ''
  toolStore.textDiffRight = ''
  diffResult.value = []
  diffStats.value = { added: 0, removed: 0, unchanged: 0 }
  showStatus('已清空', 'info')
}

// 加载示例
const loadCodeExample = () => {
  toolStore.textDiffLeft = `function hello() {
  console.log("Hello");
}`
  toolStore.textDiffRight = `function hello(name) {
  console.log("Hello, " + name);
}`
  showStatus('已加载代码对比示例', 'info')
}

const loadDocExample = () => {
  toolStore.textDiffLeft = `第一行内容
第二行内容
第三行内容`
  toolStore.textDiffRight = `第一行内容
修改后的第二行
第三行内容
新增的第四行`
  showStatus('已加载文档对比示例', 'info')
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

.diff-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.editor-section {
  display: flex;
  flex-direction: column;
}

/* Diff 结果样式 */
.diff-result {
  margin-bottom: 2rem;
}

.diff-result h3 {
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.diff-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.stat-item {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.9rem;
}

.stat-item.added {
  background-color: rgba(40, 167, 69, 0.15);
  color: #28a745;
}

.stat-item.removed {
  background-color: rgba(220, 53, 69, 0.15);
  color: #dc3545;
}

.stat-item.unchanged {
  background-color: var(--color-background-mute);
  color: var(--color-text-light);
}

.diff-viewer {
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.875rem;
}

.diff-line {
  display: flex;
  padding: 0.25rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.diff-line:last-child {
  border-bottom: none;
}

.diff-line.added {
  background-color: rgba(40, 167, 69, 0.1);
}

.diff-line.removed {
  background-color: rgba(220, 53, 69, 0.1);
}

.diff-line.unchanged {
  background-color: transparent;
}

.line-number {
  width: 40px;
  color: var(--color-text-light);
  text-align: right;
  padding-right: 0.75rem;
  user-select: none;
}

.line-prefix {
  width: 20px;
  font-weight: 600;
}

.diff-line.added .line-prefix {
  color: #28a745;
}

.diff-line.removed .line-prefix {
  color: #dc3545;
}

.line-content {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-all;
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
  white-space: pre-wrap;
  display: block;
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
  .diff-layout {
    grid-template-columns: 1fr;
  }

  .encode-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .tool-group {
    justify-content: center;
  }

  .diff-stats {
    flex-wrap: wrap;
  }

  .examples-grid {
    grid-template-columns: 1fr;
  }
}
</style>
