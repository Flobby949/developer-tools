<template>
  <ToolPanel title="HTML预览工具" description="输入HTML代码，校验后在新标签页预览页面">
    <!-- 编辑器区域 -->
    <div class="editor-layout">
      <div class="editor-section">
        <CodeEditor
          v-model="htmlInput"
          language="html"
          title="HTML 输入"
          placeholder="请输入完整或片段的HTML代码..."
          height="500px"
          :show-clear="true"
          :show-copy="true"
        />
      </div>

      <!-- 操作按钮区域 -->
      <div class="operation-buttons">
        <button
          @click="previewHtml"
          class="btn btn-primary operation-btn"
          :disabled="!htmlInput.trim()"
        >
          <span class="btn-icon">👁️</span>
          预览
        </button>
        <button @click="clearAll" class="btn btn-error operation-btn">
          <span class="btn-icon">🗑️</span>
          清空
        </button>
        <!-- 危险标签开关 -->
        <label class="danger-toggle">
          <input type="checkbox" v-model="allowDangerousTags" />
          允许危险标签（script/iframe/object/embed）
        </label>
        <p class="danger-note">默认安全模式禁用危险标签。启用仅在可信代码下使用。</p>
      </div>
    </div>

    <!-- 状态信息 -->
    <div v-if="statusMessage" class="alert" :class="`alert-${statusType}`">
      {{ statusMessage }}
    </div>

    <!-- 功能说明 -->
    <div class="info-section">
      <h3>功能说明</h3>
      <div class="info-grid">
        <div class="info-card">
          <h4>校验规则</h4>
          <ul>
            <li>不能为空，且需包含至少一个HTML标签。</li>
            <li>默认安全模式：禁止包含 <code>&lt;script&gt;</code>、<code>&lt;iframe&gt;</code>、<code>&lt;object&gt;</code>、<code>&lt;embed&gt;</code> 标签。</li>
            <li>若缺少 <code>&lt;html&gt;</code>/<code>&lt;body&gt;</code>，预览时会自动补齐标准文档结构。</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>使用提示</h4>
          <ul>
            <li>点击“预览”后会在新标签页中打开预览页面。</li>
            <li>若浏览器拦截弹窗，请允许本站的弹窗后再试。</li>
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

const htmlInput = ref('')
const allowDangerousTags = ref(false)
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')

// 显示状态消息
const showStatus = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  statusMessage.value = message
  statusType.value = type
  setTimeout(() => {
    statusMessage.value = ''
  }, 3500)
}

// 基础合法性校验（防止明显危险与无效输入）
const validateHtml = (html: string): { valid: boolean; message?: string } => {
  const input = html.trim()
  if (!input) {
    return { valid: false, message: '输入不能为空' }
  }
  // 至少包含一个标签形态
  const hasTag = /<\w+[^>]*>/i.test(input)
  if (!hasTag) {
    return { valid: false, message: '请至少包含一个有效的HTML标签，例如 <div>、<p> 等' }
  }
  // 禁止危险标签（基础防护，除非用户显式允许）
  const dangerousTagPattern = /<(script|iframe|object|embed)\b[^>]*>/i
  if (!allowDangerousTags.value && dangerousTagPattern.test(input)) {
    return { valid: false, message: '检测到危险标签（script/iframe/object/embed），为安全起见禁止预览' }
  }
  // 使用DOMParser进行基本解析校验（text/html 会尽量容错，但可验证结构）
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(input, 'text/html')
    if (!doc.documentElement) {
      return { valid: false, message: '无法解析为有效的HTML文档' }
    }
  } catch {
    return { valid: false, message: '浏览器解析HTML失败，请检查代码格式' }
  }
  return { valid: true }
}

// 若缺少完整文档结构则自动补齐
const ensureHtmlSkeleton = (html: string): string => {
  const hasHtmlTag = /<html[\s\S]*?>/i.test(html)
  if (hasHtmlTag) {
    return html
  }
  const hasHeadTag = /<head[\s\S]*?>[\s\S]*?<\/head>/i.test(html)
  const hasBodyTag = /<body[\s\S]*?>[\s\S]*?<\/body>/i.test(html)
  const bodyContent = hasBodyTag ? html : `\n${html}\n`
  const headContent = hasHeadTag
    ? ''
    : '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n<title>HTML预览</title>'
  return `<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n${headContent}\n</head>\n<body>\n${bodyContent}\n</body>\n</html>`
}

// 预览逻辑：校验通过后打开新标签页并写入内容
const previewHtml = () => {
  const result = validateHtml(htmlInput.value)
  if (!result.valid) {
    showStatus(result.message || 'HTML不合法', 'error')
    return
  }

  const finalHtml = ensureHtmlSkeleton(htmlInput.value)
  try {
    const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank', 'noopener')
    if (!win) {
      showStatus('弹窗被拦截，请允许弹窗后重试', 'error')
      URL.revokeObjectURL(url)
      return
    }
    showStatus('预览已在新标签页打开', 'success')
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  } catch (e) {
    showStatus('生成预览页面失败：' + (e as Error).message, 'error')
  }
}

const clearAll = () => {
  htmlInput.value = ''
  showStatus('已清空输入内容', 'info')
}
</script>

<style scoped>
.editor-layout {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1.5rem;
  align-items: start;
}

.operation-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 1rem;
  align-items: flex-start;
}

.operation-btn {
  min-width: 100px;
  padding: 0.75rem 1rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
  font-size: 0.875rem;
}

.operation-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.operation-btn .btn-icon {
  font-size: 1rem;
  margin-right: 0.5rem;
}

.danger-toggle {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.875rem;
  user-select: none;
}
.danger-note {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-light);
}

/* 简易的提示样式，复用全局变量 */
.alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}
.alert-success {
  color: var(--color-success-text);
  background: var(--color-success-bg);
  border: 1px solid var(--color-success-border);
}
.alert-error {
  color: var(--color-danger-text);
  background: var(--color-danger-bg);
  border: 1px solid var(--color-danger-border);
}
.alert-info {
  color: var(--color-info-text);
  background: var(--color-info-bg);
  border: 1px solid var(--color-info-border);
}

.info-section {
  margin-top: 1rem;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}
.info-card {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  background-color: var(--color-background);
  box-shadow: var(--shadow-sm);
}
.info-card h4 {
  margin-bottom: 0.5rem;
}
</style>
