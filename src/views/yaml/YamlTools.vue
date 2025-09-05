<template>
  <ToolPanel title="YAML工具" description="在YAML格式和Java Properties格式之间进行转换">
    <!-- 操作工具栏 -->
    <div class="yaml-toolbar">
      <div class="tool-group">
        <label class="mode-label">
          <input
            type="radio"
            v-model="toolStore.yamlMode"
            value="toProperties"
            class="mode-radio"
          />
          YAML → Properties
        </label>
        <label class="mode-label">
          <input type="radio" v-model="toolStore.yamlMode" value="toYaml" class="mode-radio" />
          Properties → YAML
        </label>
      </div>

      <div class="tool-group">
        <button @click="convert" class="tool-btn primary" :disabled="!toolStore.yamlInput.trim()">
          转换
        </button>
        <button @click="clearAll" class="tool-btn danger">清空</button>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <div class="editor-layout">
      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.yamlInput"
          :language="inputLanguage"
          :title="inputTitle"
          :placeholder="inputPlaceholder"
          height="500px"
          :show-clear="true"
          :show-copy="true"
        />
      </div>

      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.yamlOutput"
          :language="outputLanguage"
          :title="outputTitle"
          height="500px"
          :readonly="true"
          :show-clear="false"
          :show-copy="true"
        />
      </div>
    </div>

    <!-- 状态信息 -->
    <div v-if="statusMessage" class="status-message" :class="statusType">
      {{ statusMessage }}
    </div>

    <!-- 示例区域 -->
    <div class="examples-section">
      <h3>示例</h3>
      <div class="examples-grid">
        <div class="example-card">
          <h4>YAML 示例</h4>
          <pre class="example-code">
server:
  port: 8080
  host: localhost
database:
  driver: mysql
  url: jdbc:mysql://localhost:3306/test
  username: root
  password: password</pre
          >
          <button @click="loadYamlExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>Properties 示例</h4>
          <pre class="example-code">
server.port=8080
server.host=localhost
database.driver=mysql
database.url=jdbc:mysql://localhost:3306/test
database.username=root
database.password=password</pre
          >
          <button @click="loadPropertiesExample" class="example-btn">使用此示例</button>
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
import { yamlToProperties, propertiesToYaml } from '@/utils/yamlUtils'

const toolStore = useToolStore()
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')

// 计算属性
const inputLanguage = computed(() => {
  return toolStore.yamlMode === 'toProperties' ? 'yaml' : 'properties'
})

const outputLanguage = computed(() => {
  return toolStore.yamlMode === 'toProperties' ? 'properties' : 'yaml'
})

const inputTitle = computed(() => {
  return toolStore.yamlMode === 'toProperties' ? 'YAML 输入' : 'Properties 输入'
})

const outputTitle = computed(() => {
  return toolStore.yamlMode === 'toProperties' ? 'Properties 输出' : 'YAML 输出'
})

const inputPlaceholder = computed(() => {
  return toolStore.yamlMode === 'toProperties' ? '请输入YAML数据...' : '请输入Properties数据...'
})

// 示例数据
const yamlExample = `server:
  port: 8080
  host: localhost
database:
  driver: mysql
  url: jdbc:mysql://localhost:3306/test
  username: root
  password: password`

const propertiesExample = `server.port=8080
server.host=localhost
database.driver=mysql
database.url=jdbc:mysql://localhost:3306/test
database.username=root
database.password=password`

// 显示状态消息
const showStatus = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  statusMessage.value = message
  statusType.value = type

  // 3秒后自动清除消息
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

// 转换功能
const convert = () => {
  try {
    if (toolStore.yamlMode === 'toProperties') {
      // YAML 转 Properties
      const result = yamlToProperties(toolStore.yamlInput)
      toolStore.yamlOutput = result
      showStatus('YAML转换为Properties成功', 'success')
    } else {
      // Properties 转 YAML
      const result = propertiesToYaml(toolStore.yamlInput)
      toolStore.yamlOutput = result
      showStatus('Properties转换为YAML成功', 'success')
    }
  } catch (error) {
    showStatus('转换失败：' + (error as Error).message, 'error')
  }
}

// 清空所有内容
const clearAll = () => {
  toolStore.yamlInput = ''
  toolStore.yamlOutput = ''
  showStatus('已清空所有内容', 'info')
}

// 加载示例
const loadYamlExample = () => {
  toolStore.yamlInput = yamlExample
  toolStore.yamlMode = 'toProperties'
  showStatus('已加载YAML示例', 'info')
}

const loadPropertiesExample = () => {
  toolStore.yamlInput = propertiesExample
  toolStore.yamlMode = 'toYaml'
  showStatus('已加载Properties示例', 'info')
}
</script>

<style scoped>
.yaml-toolbar {
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
}

.mode-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text);
}

.mode-radio {
  cursor: pointer;
}

.tool-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  color: var(--color-text);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.tool-btn:hover:not(:disabled) {
  background-color: var(--color-background-mute);
  border-color: var(--color-border-hover);
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tool-btn.primary {
  background-color: var(--vt-c-green);
  color: white;
  border-color: var(--vt-c-green);
}

.tool-btn.primary:hover:not(:disabled) {
  background-color: #369870;
}

.tool-btn.danger {
  background-color: #dc3545;
  color: white;
  border-color: #dc3545;
}

.tool-btn.danger:hover:not(:disabled) {
  background-color: #c82333;
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

.status-message {
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.status-message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-message.info {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
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
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.example-card {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-background-soft);
}

.example-card h4 {
  margin: 0 0 0.5rem 0;
  color: var(--color-heading);
  font-size: 1rem;
}

.example-code {
  background-color: var(--color-background-mute);
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  margin: 0.5rem 0;
  overflow-x: auto;
  border: 1px solid var(--color-border);
}

.example-btn {
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

@media (max-width: 768px) {
  .editor-layout,
  .examples-grid {
    grid-template-columns: 1fr;
  }

  .yaml-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .tool-group {
    justify-content: center;
  }
}
</style>
