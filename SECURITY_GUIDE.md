# 🔒 AI对话工具安全指南

# API 密钥安全指南

## 安全设计说明

本项目已完全移除环境变量配置 API 密钥的功能，采用更安全的用户自主配置方式。

### 当前安全特性

#### 1. 用户自主配置

- ✅ 用户在界面上输入自己的 API 配置
- ✅ 配置仅存储在当前会话的内存中（Pinia）
- ✅ 支持可选的本地持久化存储
- ✅ 本地存储使用 AES 加密保护

#### 2. 本地持久化选项

- **默认关闭**：配置仅在当前会话中有效，关闭浏览器后丢失
- **可选开启**：用户确认安全风险后，配置被加密保存到本地
- **风险提醒**：开启前会弹框提醒用户相关安全风险

### **2. 代理服务器方案**

如果您要提供API服务，建议创建后端代理：

```javascript
// ✅ 安全：后端代理服务
// backend/api/chat.js
export default async function handler(req, res) {
  // 密钥安全存储在服务器环境变量中
  const apiKey = process.env.OPENAI_API_KEY

  // 验证用户身份（可选）
  const userToken = req.headers.authorization
  if (!isValidUser(userToken)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // 代理请求到AI服务
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req.body),
  })

  const data = await response.json()
  res.json(data)
}
```

### **3. 身份验证 + 配额管理**

```javascript
// ✅ 企业级方案：用户认证 + 配额控制
app.post('/api/chat', authenticateUser, checkQuota, async (req, res) => {
  // 使用系统API密钥，但控制用户使用量
  const apiKey = process.env.OPENAI_API_KEY

  // 记录用户使用量
  await logUsage(req.user.id, req.body)

  // 代理请求
  const response = await callOpenAI(apiKey, req.body)
  res.json(response)
})
```

## 🔧 **当前项目的安全特性**

### **1. 本地加密存储**

```javascript
// 密钥在本地存储前会进行简单加密
function saveApiKey(key) {
  const encryptionKey = generateBrowserFingerprint()
  const encryptedKey = simpleEncrypt(key, encryptionKey)
  localStorage.setItem('ai-config', encryptedKey)
}
```

### **2. 不打包到代码中**

- API密钥由用户运行时输入
- 不会出现在源代码或打包文件中
- 不会被版本控制系统记录

### **3. 用户控制**

- 用户可以随时查看、修改或删除密钥
- 支持清除本地所有配置
- 密钥不会离开用户的浏览器

## 📋 **安全检查清单**

### ✅ **当前已实现**

- [x] 用户自行配置API密钥
- [x] 本地存储加密
- [x] 不打包到代码中
- [x] 用户可控制密钥
- [x] 安全警告提示

### 🔄 **可进一步优化**

- [ ] 添加密钥强度验证
- [ ] 实现自动清除功能（浏览器关闭时）
- [ ] 添加使用统计和成本估算
- [ ] 支持多个API密钥配置

## 💡 **最佳实践建议**

### **对于开发者**

1. **永远不要**在前端代码中硬编码API密钥
2. **使用代理服务器**处理敏感的API调用
3. **实施适当的身份验证**和配额控制
4. **监控API使用情况**，及时发现异常

### **对于用户**

1. **定期轮换**您的API密钥
2. **监控API使用量**和费用
3. **不要共享**您的API密钥
4. **使用最小权限**的API密钥（如果API支持）

## 🚨 **紧急响应**

如果您怀疑API密钥被泄露：

1. **立即撤销**泄露的API密钥
2. **生成新的**API密钥
3. **检查API使用日志**是否有异常活动
4. **联系API服务商**报告安全问题

---

**总结**：当前的用户自行配置方案是安全的，因为密钥由用户控制，不会暴露在代码中。如果您需要提供API服务，建议使用后端代理方案。

# API 密钥安全指南

## 安全风险说明

### 前端环境变量的风险

在前端项目中使用环境变量存储 API 密钥存在以下风险：

1. **完全暴露**: 前端环境变量会被打包到最终的 JavaScript 文件中，用户可以在浏览器中查看到
2. **版本控制泄露**: 如果将包含密钥的 .env 文件提交到 Git，密钥会被永久记录
3. **无法撤销**: 一旦泄露，只能通过重新生成密钥来解决

## 推荐的安全实践

### 1. 用户自行配置（当前实现）

- ✅ 用户在界面上输入自己的 API 配置
- ✅ 配置存储在用户本地浏览器中
- ✅ 使用简单加密算法保护存储的密钥
- ✅ 支持清除本地配置

### 2. 环境变量最佳实践

如果必须使用环境变量，请遵循以下规则：

#### 开发环境

``bash

# 创建 .env.local 文件（不会被提交到 Git）

VITE_AI_BASE_URL=https://api.openai.com/v1
VITE_AI_API_KEY=sk-your-development-key
VITE_AI_MODEL=gpt-3.5-turbo

```

#### 生产环境
- 不要在生产环境中使用前端环境变量存储密钥
- 考虑使用后端代理服务器
- 使用身份验证系统

### 3. 后端代理方案（最安全）
```

用户 → 前端应用 → 后端API → AI服务提供商

````

在后端存储 API 密钥，前端通过身份验证访问后端接口。

## 当前项目的安全措施

### 已实现的安全功能
1. **本地存储加密**: 使用浏览器指纹生成加密密钥
2. **Git 保护**: `.gitignore` 包含环境变量文件
3. **配置验证**: 验证配置完整性
4. **安全清除**: 支持清除本地配置

### 使用建议
1. **个人使用**: 直接在界面配置，安全性足够
2. **团队使用**: 每个成员使用自己的 API 密钥
3. **生产部署**: 考虑实现后端代理

## 密钥管理最佳实践

### API 密钥安全
- 定期轮换 API 密钥
- 使用具有最小权限的密钥
- 监控 API 使用情况
- 设置使用量限制

### 本地存储安全
- 不要在共享设备上保存密钥
- 定期清除不需要的配置
- 注意浏览器插件可能访问本地存储

## 应急处理

### 如果密钥泄露
1. 立即在 API 提供商处撤销密钥
2. 生成新的 API 密钥
3. 更新所有使用该密钥的配置
4. 监控异常使用情况

### 清除本地配置
在浏览器开发者工具中执行：
```javascript
localStorage.removeItem('ai-config')
````

或在应用界面中使用"清除配置"功能。

## 结论

当前的实现方式（用户自行配置 + 本地加密存储）在个人使用场景下是安全的。如果需要更高的安全性，建议实现后端代理方案。
