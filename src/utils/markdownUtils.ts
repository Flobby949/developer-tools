/**
 * Markdown渲染工具
 * 支持代码高亮、表格、链接等功能
 */

import { marked } from 'marked'
import hljs from 'highlight.js'

// 配置marked选项
marked.setOptions({
  gfm: true,
  breaks: true,
  highlight: function (code: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (err) {
        console.warn('代码高亮失败:', err)
      }
    }
    return hljs.highlightAuto(code).value
  },
})

/**
 * 渲染Markdown文本为HTML
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return ''
  }

  try {
    // 使用marked直接解析
    let html = marked(markdown) as string

    // 后处理：为代码块添加复制功能
    html = html.replace(
      /<pre><code class="language-(\w+)">(.*?)<\/code><\/pre>/gs,
      (match, lang, code) => {
        const decodedCode = code
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")

        return `
          <div class="code-block">
            <div class="code-header">
              <span class="code-language">${lang}</span>
              <button class="code-copy-btn" onclick="copyCodeToClipboard(this)" data-code="${encodeURIComponent(decodedCode)}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="m5 15-4-4 4-4"></path>
                </svg>
                复制
              </button>
            </div>
            <pre><code class="language-${lang}">${code}</code></pre>
          </div>
        `
      },
    )

    // 为表格添加wrapper
    html = html.replace(
      /<table>/g,
      '<div class="markdown-table-wrapper"><table class="markdown-table">',
    )
    html = html.replace(/<\/table>/g, '</table></div>')

    // 为引用块添加样式类
    html = html.replace(/<blockquote>/g, '<blockquote class="markdown-blockquote">')

    // 为链接添加target="_blank"
    html = html.replace(
      /<a href="([^"]+)">/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">',
    )

    return html
  } catch (error) {
    console.error('Markdown渲染失败:', error)
    return markdown.replace(/\n/g, '<br>')
  }
}

/**
 * 清理HTML内容，防止XSS攻击
 */
export function sanitizeHtml(html: string): string {
  // 简单的HTML清理，移除危险标签
  const dangerousTags = [
    'script',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'textarea',
    'button',
  ]
  let cleaned = html

  dangerousTags.forEach((tag) => {
    const regex = new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'gis')
    cleaned = cleaned.replace(regex, '')
    const selfClosing = new RegExp(`<${tag}[^>]*\/?>`, 'gis')
    cleaned = cleaned.replace(selfClosing, '')
  })

  return cleaned
}

/**
 * 安全渲染Markdown
 */
export function safeRenderMarkdown(markdown: string): string {
  const html = renderMarkdown(markdown)
  return sanitizeHtml(html)
}

/**
 * 全局函数：复制代码到剪贴板
 */
export function setupCodeCopyFunction() {
  if (typeof window !== 'undefined') {
    ;(window as Record<string, unknown>).copyCodeToClipboard = function (button: HTMLElement) {
      const code = decodeURIComponent(button.getAttribute('data-code') || '')

      navigator.clipboard
        .writeText(code)
        .then(() => {
          const originalText = button.innerHTML
          button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
          已复制
        `
          button.style.color = '#10b981'

          setTimeout(() => {
            button.innerHTML = originalText
            button.style.color = ''
          }, 2000)
        })
        .catch(() => {
          button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          复制失败
        `
          button.style.color = '#ef4444'

          setTimeout(() => {
            button.innerHTML = button.getAttribute('data-original') || '复制'
            button.style.color = ''
          }, 2000)
        })
    }
  }
}
