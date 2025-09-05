<template>
  <ToolPanel title="JSON转实体类" description="将JSON数据转换为各种编程语言的实体类代码">
    <!-- 操作工具栏 -->
    <div class="json-toolbar">
      <div class="tool-group">
        <select v-model="toolStore.jsonLanguage" class="input select">
          <option value="java">Java</option>
          <option value="typescript">TypeScript</option>
          <option value="csharp">C#</option>
          <option value="python">Python</option>
        </select>
        <input v-model="toolStore.jsonClassName" placeholder="类名" class="input" />
        <button
          @click="convertToEntity"
          class="btn btn-primary"
          :disabled="!toolStore.jsonToEntityInput.trim()"
        >
          <span class="btn-icon">🔄</span>
          转实体类
        </button>
      </div>

      <div class="tool-group">
        <button @click="validateJson" class="btn" :disabled="!toolStore.jsonToEntityInput.trim()">
          <span class="btn-icon">✓</span>
          验证JSON
        </button>
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
          v-model="toolStore.jsonToEntityInput"
          language="json"
          title="JSON 输入"
          placeholder="请输入JSON数据..."
          height="500px"
          :show-clear="true"
          :show-copy="true"
        />
      </div>

      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.jsonToEntityOutput"
          :language="outputLanguage"
          title="实体类代码"
          height="500px"
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
          <h4>用户信息对象</h4>
          <div class="example-item">
            <span class="example-label">JSON：</span>
            <code class="example-text"
              >{"id":1,"name":"张三","email":"zhangsan@example.com","age":25}</code
            >
          </div>
          <button @click="loadUserExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>嵌套对象</h4>
          <div class="example-item">
            <span class="example-label">JSON：</span>
            <code class="example-text"
              >{"user":{"id":1,"name":"李四"},"profile":{"city":"上海","phone":"123456"}}</code
            >
          </div>
          <button @click="loadNestedExample" class="example-btn">使用此示例</button>
        </div>
      </div>
    </div>

    <!-- 语言特性说明 -->
    <div class="info-section">
      <h3>支持的语言特性</h3>
      <div class="info-grid">
        <div class="info-card">
          <h4>Java</h4>
          <ul>
            <li>private字段，public getter/setter方法</li>
            <li>支持基本数据类型和包装类型</li>
            <li>嵌套类自动生成</li>
            <li>符合JavaBean规范</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>TypeScript</h4>
          <ul>
            <li>interface接口定义</li>
            <li>可选属性支持</li>
            <li>嵌套接口自动生成</li>
            <li>严格类型定义</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>C#</h4>
          <ul>
            <li>属性(Property)定义</li>
            <li>get/set访问器</li>
            <li>嵌套类支持</li>
            <li>数据注解属性</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>Python</h4>
          <ul>
            <li>dataclass装饰器</li>
            <li>类型提示支持</li>
            <li>可选字段处理</li>
            <li>嵌套类定义</li>
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
import { isValidJson } from '@/utils'
import { jsonToJava, jsonToTypeScript, jsonToCSharp, jsonToPython } from '@/utils/jsonToEntity'

const toolStore = useToolStore()
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')

// 计算输出语言
const outputLanguage = computed(() => {
  return toolStore.jsonLanguage
})

// 示例数据
const userExample = '{"id":1,"name":"张三","email":"zhangsan@example.com","age":25,"isActive":true}'
const nestedExample =
  '{"user":{"id":1,"name":"李四","avatar":"https://example.com/avatar.jpg"},"profile":{"city":"上海","phone":"123456","tags":["developer","designer"]}}'

// 显示状态消息
const showStatus = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  statusMessage.value = message
  statusType.value = type

  // 3秒后自动清除消息
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

// 验证JSON
const validateJson = () => {
  if (isValidJson(toolStore.jsonToEntityInput)) {
    showStatus('JSON格式正确', 'success')
  } else {
    showStatus('JSON格式错误', 'error')
  }
}

// 转换为实体类
const convertToEntity = () => {
  try {
    let result = ''
    const className = toolStore.jsonClassName || 'Entity'

    switch (toolStore.jsonLanguage) {
      case 'java':
        result = jsonToJava(toolStore.jsonToEntityInput, className)
        break
      case 'typescript':
        result = jsonToTypeScript(toolStore.jsonToEntityInput, className)
        break
      case 'csharp':
        result = jsonToCSharp(toolStore.jsonToEntityInput, className)
        break
      case 'python':
        result = jsonToPython(toolStore.jsonToEntityInput, className)
        break
      default:
        throw new Error('不支持的语言类型')
    }

    toolStore.jsonToEntityOutput = result
    showStatus(`成功转换为${toolStore.jsonLanguage}实体类`, 'success')
  } catch (error) {
    showStatus('转换失败：' + (error as Error).message, 'error')
  }
}

// 清空所有内容
const clearAll = () => {
  toolStore.jsonToEntityInput = ''
  toolStore.jsonToEntityOutput = ''
  showStatus('已清空所有内容', 'info')
}

// 加载示例
const loadUserExample = () => {
  toolStore.jsonToEntityInput = userExample
  toolStore.jsonClassName = 'User'
  showStatus('已加载用户信息示例', 'info')
}

const loadNestedExample = () => {
  toolStore.jsonToEntityInput = nestedExample
  toolStore.jsonClassName = 'UserProfile'
  showStatus('已加载嵌套对象示例', 'info')
}
</script>

<style scoped>
.json-toolbar {
  display: flex;
  flex-wrap: wrap;
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
  gap: 0.5rem;
}

.editor-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  height: 500px;
  margin-bottom: 2rem;
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
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
  .editor-layout,
  .examples-grid {
    grid-template-columns: 1fr;
  }

  .json-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .tool-group {
    justify-content: center;
  }
}
</style>
