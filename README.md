# 开发者工具集

一个集成化的在线工具平台，为开发人员提供常用的代码工具和转换功能。

## 功能特性

### JSON工具
- JSON格式化 - 将JSON字符串格式化为易读的格式，支持自定义缩进
- JSON压缩 - 去除JSON中的空白字符，压缩为一行
- JSON转实体类 - 将JSON转换为多种编程语言的实体类定义

### YAML工具
- YAML与Properties互转 - 在YAML格式和Java Properties格式之间转换

### 编码转换
- URL编码/解码 - 对URL进行编码和解码操作
- Base64编码/解码 - 对文本进行Base64编码和解码

### 其他工具
- 正则表达式测试 - 在线测试和调试正则表达式，支持实时匹配和高亮显示

## 技术栈

- Vue 3 + TypeScript
- Vue Router 4
- Pinia (状态管理)
- Vite (构建工具)
- Monaco Editor (代码编辑器)

## 项目结构

```
src/
├── assets/          # 静态资源
├── components/      # 公共组件
├── router/          # 路由配置
├── stores/          # 状态管理
├── types/           # TypeScript类型定义
├── utils/           # 工具函数
├── views/           # 页面组件
│   ├── encode/      # 编码转换页面
│   ├── json/        # JSON工具页面
│   ├── regex/       # 正则测试页面
│   └── yaml/        # YAML工具页面
├── App.vue          # 根组件
└── main.ts          # 入口文件
```

## 开发环境设置

1. 安装依赖
```bash
npm install
```

2. 启动开发服务器
```bash
npm run dev
```

3. 构建生产版本
```bash
npm run build
```

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。