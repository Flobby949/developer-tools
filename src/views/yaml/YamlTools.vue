<template>
  <ToolPanel title="YAML工具" description="在YAML格式和Java Properties格式之间进行转换">
    <!-- 操作工具栏 -->
    <div class="yaml-toolbar">
      <div class="mode-buttons">
        <button
          @click="setMode('toProperties')"
          class="mode-btn"
          :class="{ active: toolStore.yamlMode === 'toProperties' }"
        >
          <span class="mode-icon">📤</span>
          YAML → Properties
        </button>
        <button
          @click="setMode('toYaml')"
          class="mode-btn"
          :class="{ active: toolStore.yamlMode === 'toYaml' }"
        >
          <span class="mode-icon">📣</span>
          Properties → YAML
        </button>
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

      <!-- 操作按钮区域 -->
      <div class="operation-buttons">
        <button
          @click="convert"
          class="btn btn-primary operation-btn"
          :disabled="!toolStore.yamlInput.trim()"
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

// 设置转换模式
const setMode = (mode: 'toProperties' | 'toYaml') => {
  toolStore.yamlMode = mode
  showStatus(`转换模式: ${mode === 'toProperties' ? 'YAML → Properties' : 'Properties → YAML'}`, 'info')
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
  setMode('toProperties')
  showStatus('已加载YAML示例', 'info')
}

const loadPropertiesExample = () => {
  toolStore.yamlInput = propertiesExample
  setMode('toYaml')
  showStatus('已加载Properties示例', 'info')
}
</script>

<style scoped>
.yaml-toolbar {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.mode-buttons {
  display: flex;
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

.editor-layout {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1.5rem;
  height: 500px;
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

  .mode-buttons {
    flex-direction: column;
    width: 100%;
  }

  .mode-btn {
    justify-content: center;
  }

  .examples-grid {
    grid-template-columns: 1fr;
  }

  .yaml-toolbar {
    padding: 0.75rem;
  }
}
</style>
