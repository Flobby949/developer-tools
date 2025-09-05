# 开发者工具集

一个集成化的在线工具平台，为开发人员提供常用的代码工具和转换功能。

## 🚀 项目特点

- 🎨 **现代化界面** - 基于Vue 3 + TypeScript构建，支持深色/浅色主题切换
- 📱 **响应式设计** - 完美支持桌面端和移动端使用
- ⚡ **实时处理** - 所有工具都支持实时转换和预览
- 🛠 **功能丰富** - 涵盖JSON、YAML、编码转换、正则表达式等常用开发工具
- 💾 **数据安全** - 所有处理均在本地进行，不上传任何数据到服务器

## 🔧 功能特性

### JSON工具

- **JSON格式化** - 将JSON字符串格式化为易读的格式，支持自定义缩进
- **JSON压缩** - 去除JSON中的空白字符，压缩为一行
- **JSON转实体类** - 将JSON转换为多种编程语言的实体类定义
  - 支持Java、TypeScript、C#、Python
  - 自定义类名
  - 自动生成getter/setter方法(Java)

### YAML工具

- **YAML与Properties互转** - 在YAML格式和Java Properties格式之间转换
- **双向转换** - 支持YAML→Properties和Properties→YAML
- **示例数据** - 提供常用配置示例，一键加载测试

### 编码转换

- **URL编码/解码** - 对URL进行编码和解码操作，处理中文和特殊字符
- **Base64编码/解码** - 对文本进行Base64编码和解码
- **批量处理** - 支持大文本的编码转换
- **错误提示** - 智能识别无效输入并给出明确提示

### 正则表达式测试

- **实时匹配** - 输入正则表达式立即显示匹配结果
- **语法高亮** - 匹配结果高亮显示，便于查看
- **分组捕获** - 显示正则表达式的分组匹配结果
- **常用示例** - 内置邮箱、手机号、URL等常用正则表达式
- **标志支持** - 可视化选择g、i、m、s、u、y等正则标志

## 💻 技术栈

### 前端框架

- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - 类型安全的JavaScript超集
- **Vue Router 4** - 官方路由管理器
- **Pinia** - 新一代状态管理方案

### 构建工具

- **Vite** - 下一代前端构建工具
- **ESLint** - 代码质量检查工具
- **Prettier** - 代码格式化工具

### 核心依赖

- **Monaco Editor** - VS Code同款代码编辑器
- **js-yaml** - YAML解析和序列化库

## 📁 项目结构

```
src/
├── assets/          # 静态资源
├── components/      # 公共组件
│   ├── AppLayout.vue      # 主布局组件
│   ├── CodeEditor.vue     # 代码编辑器组件
│   └── ToolPanel.vue      # 工具面板组件
├── router/          # 路由配置
├── stores/          # 状态管理
│   ├── app.ts            # 应用全局状态
│   └── tool.ts           # 工具数据状态
├── types/           # TypeScript类型定义
├── utils/           # 工具函数
│   ├── index.ts          # 通用工具函数
│   ├── jsonToEntity.ts   # JSON转实体类
│   └── yamlUtils.ts      # YAML处理工具
├── views/           # 页面组件
│   ├── encode/      # 编码转换页面
│   ├── json/        # JSON工具页面
│   ├── regex/       # 正则测试页面
│   └── yaml/        # YAML工具页面
├── App.vue          # 根组件
└── main.ts          # 入口文件
```

## 🛠 开发环境设置

### 环境要求

- Node.js >= 20.19.0 或 >= 22.12.0
- npm 或 yarn

### 快速开始

1. **克隆项目**

```bash
git clone <repository-url>
cd program-tool
```

2. **安装依赖**

```bash
npm install
```

3. **启动开发服务器**

```bash
npm run dev
```

4. **构建生产版本**

```bash
npm run build
```

5. **预览构建结果**

```bash
npm run preview
```

### 开发命令

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run preview` - 预览构建结果
- `npm run type-check` - 类型检查
- `npm run lint` - 代码质量检查
- `npm run format` - 代码格式化

## 🌟 功能亮点

### 智能编辑器

- 基于Monaco Editor的专业代码编辑体验
- 语法高亮支持多种编程语言
- 自动完成和错误提示
- 支持代码折叠和格式化

### 用户体验

- 实时状态反馈，操作结果即时可见
- 一键复制功能，便于结果分享
- 示例数据快速上手
- 响应式布局，移动端友好

### 主题支持

- 浅色/深色主题一键切换
- 跟随系统主题设置
- 个性化界面定制

## 🌐 浏览器支持

- ✅ Chrome (推荐)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ 移动端浏览器

## 📄 开发规范

### 代码规范

- 使用TypeScript进行类型安全开发
- 遵循ESLint和Prettier配置规范
- 组件化开发，提高代码复用性
- 使用Vue 3 Composition API

### Git提交规范

- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建工具或辅助工具的变动

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

### 贡献步骤

1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

### 开发建议

- 提交前请运行`npm run lint`和`npm run type-check`
- 保持代码风格一致
- 添加必要的注释和文档
- 测试新功能的兼容性

## 📝 更新日志

### v1.0.0 (2024-01-15)

- ✨ 初始版本发布
- ✨ JSON工具：格式化、压缩、转实体类
- ✨ YAML工具：与Properties格式互转
- ✨ 编码转换：URL和Base64编码解码
- ✨ 正则表达式：实时测试和匹配
- ✨ 支持深色/浅色主题切换
- ✨ 响应式设计，支持移动端

## 📞 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交Issue到本项目
- 发送邮件到开发者邮箱

## 📄 许可证

本项目采用MIT许可证，详情请查看[LICENSE](LICENSE)文件。

---

⭐ 如果这个项目对你有帮助，请给一个Star支持！
