<template>
  <ToolPanel title="实体类Mock数据" description="将实体类转换为Mock数据，支持API请求参数生成">
    <!-- 操作工具栏 -->
    <div class="mock-toolbar">
      <div class="tool-group">
        <select v-model="selectedLanguage" class="input select">
          <option value="java">Java</option>
          <option value="golang">Golang</option>
        </select>
        <button @click="validateEntity" class="btn" :disabled="!toolStore.entityToMockInput.trim()">
          <span class="btn-icon">✓</span>
          验证实体类
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
          v-model="toolStore.entityToMockInput"
          :language="editorLanguage"
          :title="editorTitle"
          :placeholder="editorPlaceholder"
          height="500px"
          :show-clear="true"
          :show-copy="true"
        />
      </div>

      <!-- 中间按钮区域 -->
      <div class="format-buttons">
        <button
          @click="generateJsonMock"
          class="format-btn"
          :class="{ active: mockFormat === 'json' }"
          :disabled="!toolStore.entityToMockInput.trim()"
        >
          <span class="btn-icon">📋</span>
          <span class="btn-text">JSON Body</span>
        </button>
        <button
          @click="generateFormMockData"
          class="format-btn"
          :class="{ active: mockFormat === 'form', disabled: hasNested }"
          :disabled="!toolStore.entityToMockInput.trim() || hasNested"
        >
          <span class="btn-icon">📝</span>
          <span class="btn-text">Form Data</span>
        </button>
        <div v-if="hasNested" class="format-tip">
          <span class="tip-icon">⚠️</span>
          <span class="tip-text">检测到嵌套对象，Form格式不可用</span>
        </div>
      </div>

      <div class="editor-section">
        <CodeEditor
          v-model="toolStore.entityToMockOutput"
          :language="outputLanguage"
          :title="outputTitle"
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
          <h4>简单实体类</h4>
          <div class="example-item">
            <span class="example-label">{{ selectedLanguage }}实体类：</span>
            <code class="example-text">{{ currentSimpleExample }}</code>
          </div>
          <button @click="loadSimpleExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card">
          <h4>嵌套对象实体类</h4>
          <div class="example-item">
            <span class="example-label">{{ selectedLanguage }}实体类：</span>
            <code class="example-text">{{ currentNestedExample }}</code>
          </div>
          <button @click="loadNestedExample" class="example-btn">使用此示例</button>
        </div>

        <div class="example-card" v-show="selectedLanguage === 'java'">
          <h4>复杂业务实体类（继承+final字段）</h4>
          <div class="example-item">
            <span class="example-label">Java实体类：</span>
            <code class="example-text">{{ complexExample.substring(0, 200) }}...</code>
          </div>
          <button @click="loadComplexExample" class="example-btn">使用此示例</button>
        </div>
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="info-section">
      <h3>功能说明</h3>
      <div class="info-grid">
        <div class="info-card">
          <h4>多语言支持</h4>
          <ul>
            <li>支持Java实体类解析</li>
            <li>支持Golang结构体解析</li>
            <li>基本数据类型和包装类型</li>
            <li>集合类型(List, Array等)</li>
            <li>嵌套自定义对象类型</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>JSON Body格式</h4>
          <ul>
            <li>支持嵌套对象结构</li>
            <li>自动生成合理的Mock值</li>
            <li>支持数组和集合类型</li>
            <li>自定义对象递归生成</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>Form Data格式</h4>
          <ul>
            <li>适用于表单提交</li>
            <li>键值对格式输出</li>
            <li>仅支持基本数据类型</li>
            <li>不支持嵌套对象</li>
          </ul>
        </div>
        <div class="info-card">
          <h4>智能Mock值</h4>
          <ul>
            <li>根据字段名推断合理值</li>
            <li>支持常见业务字段</li>
            <li>id、name、email等智能识别</li>
            <li>数值、布尔值合理生成</li>
          </ul>
        </div>
      </div>
    </div>
  </ToolPanel>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import { useToolStore } from '@/stores/tool'
import {
  generateJsonBodyMockWithLanguage,
  generateFormMockWithLanguage,
  hasNestedObjectsWithLanguage,
} from '@/utils/entityToMock'

type LanguageType = 'java' | 'golang'

const toolStore = useToolStore()
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')
const mockFormat = ref<'json' | 'form'>('json')
const selectedLanguage = ref<LanguageType>('java')

// 检测是否有嵌套对象
const hasNested = computed(() => {
  if (!toolStore.entityToMockInput.trim()) return false
  return hasNestedObjectsWithLanguage(toolStore.entityToMockInput, selectedLanguage.value)
})

// 编辑器语言
const editorLanguage = computed(() => {
  const languageMap = {
    java: 'java',
    golang: 'go',
  }
  return languageMap[selectedLanguage.value]
})

// 编辑器标题
const editorTitle = computed(() => {
  const titleMap = {
    java: 'Java实体类',
    golang: 'Golang结构体',
  }
  return titleMap[selectedLanguage.value]
})

// 编辑器提示
const editorPlaceholder = computed(() => {
  const placeholderMap = {
    java: '请输入Java实体类代码...',
    golang: '请输入Golang结构体代码...',
  }
  return placeholderMap[selectedLanguage.value]
})

// 输出语言
const outputLanguage = computed(() => {
  return mockFormat.value === 'json' ? 'json' : 'text'
})

// 输出标题
const outputTitle = computed(() => {
  return mockFormat.value === 'json' ? 'JSON Mock数据' : 'Form Mock数据'
})

// 当前语言的示例
const currentSimpleExample = computed(() => {
  const examples = {
    java: simpleExample,
    golang: golangSimpleExample,
  }
  return examples[selectedLanguage.value]
})

const currentNestedExample = computed(() => {
  const examples = {
    java: nestedExample,
    golang: golangNestedExample,
  }
  return examples[selectedLanguage.value]
})

// 监听嵌套对象变化，自动切换格式
watch(hasNested, (newValue) => {
  if (newValue && mockFormat.value === 'form') {
    mockFormat.value = 'json'
    showStatus('检测到嵌套对象，已自动切换到JSON Body格式', 'info')
  }
})

// 示例数据
const simpleExample = `public class User {
    private Integer id;
    private String name;
    private String email;
    private Integer age;
    private Boolean isActive;
}`

const nestedExample = `public class UserProfile {
    private Integer userId;
    private String userName;
    private Address address;
    private List<String> tags;
}

public class Address {
    private String city;
    private String district;
    private String street;
}`

const complexExample = `public class Manager extends BaseDo {
    private final Long managerId;
    private final String username;
    private final String nickname;
    private String password;
    private boolean enabled;
    private Integer roleId;
    private String roleName;
    private final Set<String> authorityList;
}

public abstract class BaseDo {
    protected transient final List<Object> domainEvents = new ArrayList<>();
}`

// Golang示例
const golangSimpleExample = `type User struct {
    ID       int    \`json:"id"\`
    Name     string \`json:"name"\`
    Email    string \`json:"email"\`
    Age      int    \`json:"age"\`
    IsActive bool   \`json:"is_active"\`
}`

const golangNestedExample = `type UserProfile struct {
    UserID   int      \`json:"user_id"\`
    UserName string   \`json:"user_name"\`
    Address  Address  \`json:"address"\`
    Tags     []string \`json:"tags"\`
}

type Address struct {
    City     string \`json:"city"\`
    District string \`json:"district"\`
    Street   string \`json:"street"\`
}`

// 显示状态消息
const showStatus = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  statusMessage.value = message
  statusType.value = type

  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

// 验证实体类
const validateEntity = () => {
  try {
    const input = toolStore.entityToMockInput.trim()

    if (selectedLanguage.value === 'java') {
      if (!input.includes('public class')) {
        throw new Error('请输入有效的Java实体类')
      }
      if (!input.includes('private ')) {
        throw new Error('未找到private字段声明')
      }
    } else if (selectedLanguage.value === 'golang') {
      if (!input.includes('type ') || !input.includes('struct')) {
        throw new Error('请输入有效的Golang结构体')
      }
    }

    showStatus(`${selectedLanguage.value}实体类格式正确`, 'success')
  } catch (error) {
    showStatus('验证失败：' + (error as Error).message, 'error')
  }
}

// 生成JSON Mock数据
const generateJsonMock = () => {
  try {
    const result = generateJsonBodyMockWithLanguage(
      toolStore.entityToMockInput,
      selectedLanguage.value,
    )
    toolStore.entityToMockOutput = result
    mockFormat.value = 'json'
    showStatus('成功生成JSON格式Mock数据', 'success')
  } catch (error) {
    showStatus('生成失败：' + (error as Error).message, 'error')
  }
}

// 生成Form Mock数据
const generateFormMockData = () => {
  try {
    const result = generateFormMockWithLanguage(toolStore.entityToMockInput, selectedLanguage.value)
    toolStore.entityToMockOutput = result
    mockFormat.value = 'form'
    showStatus('成功生成Form格式Mock数据', 'success')
  } catch (error) {
    showStatus('生成失败：' + (error as Error).message, 'error')
  }
}

// 清空所有内容
const clearAll = () => {
  toolStore.entityToMockInput = ''
  toolStore.entityToMockOutput = ''
  showStatus('已清空所有内容', 'info')
}

// 加载示例
const loadSimpleExample = () => {
  const examples = {
    java: simpleExample,
    golang: golangSimpleExample,
  }
  toolStore.entityToMockInput = examples[selectedLanguage.value]
  showStatus(`已加载${selectedLanguage.value}简单实体类示例`, 'info')
}

const loadNestedExample = () => {
  const examples = {
    java: nestedExample,
    golang: golangNestedExample,
  }
  toolStore.entityToMockInput = examples[selectedLanguage.value]
  showStatus(`已加载${selectedLanguage.value}嵌套对象示例`, 'info')
}

const loadComplexExample = () => {
  // 复杂示例目前只支持Java
  if (selectedLanguage.value === 'java') {
    toolStore.entityToMockInput = complexExample
    showStatus('已加载复杂业务实体类示例', 'info')
  } else {
    showStatus('复杂示例目前仅支持Java', 'info')
  }
}
</script>

<style scoped>
.mock-toolbar {
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
  grid-template-columns: 1fr auto 1fr;
  gap: 1.5rem;
  height: 500px;
  margin-bottom: 2rem;
  align-items: start;
}

.editor-section {
  display: flex;
  flex-direction: column;
}

/* 中间按钮区域 */
.format-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  min-width: 120px;
}

.format-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  min-width: 100px;
  text-align: center;
  color: var(--color-text);
}

.format-btn:hover:not(:disabled) {
  background: var(--color-background-soft);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.format-btn.active {
  background: var(--gradient-primary);
  border-color: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-lg);
}

.format-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-background-mute);
  color: var(--color-text-lighter);
}

.format-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--color-background-mute);
  color: var(--color-text-lighter);
  border-color: var(--color-border);
}

.btn-icon {
  font-size: 1.5rem;
}

.btn-text {
  font-size: 0.875rem;
  font-weight: 600;
}

.format-tip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 6px;
  font-size: 0.75rem;
  color: var(--color-text-light);
  text-align: center;
  max-width: 120px;
}

.tip-icon {
  font-size: 0.875rem;
}

.tip-text {
  line-height: 1.2;
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
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
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
  font-size: 0.75rem;
  border: 1px solid var(--color-border);
  white-space: pre-wrap;
  overflow-x: auto;
  max-height: 200px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
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
  .editor-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    gap: 1rem;
  }

  .format-buttons {
    flex-direction: row;
    justify-content: center;
    min-width: auto;
  }

  .format-btn {
    min-width: 80px;
    padding: 0.75rem;
  }

  .examples-grid {
    grid-template-columns: 1fr;
  }

  .mock-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .tool-group {
    justify-content: center;
  }
}
</style>
