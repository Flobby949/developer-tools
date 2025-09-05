# 部署配置说明

## 构建命令

```bash
# 生产环境构建
npm run build:prod

# 或者使用标准构建命令
npm run build
```

## 部署配置

### 1. 服务器路径配置

- **部署路径**: `https://xxxx/tools/`
- **Vite Base配置**: `/tools/`
- **输出目录**: `dist/`

### 2. 服务器配置要求

#### Nginx 配置示例

```nginx
location /tools/ {
    alias /path/to/your/dist/;
    try_files $uri $uri/ /tools/index.html;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Apache 配置示例

```apache
Alias /tools /path/to/your/dist
<Directory "/path/to/your/dist">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted

    # 支持 SPA 路由
    FallbackResource /tools/index.html
</Directory>
```

### 3. 部署步骤

1. **构建项目**

   ```bash
   npm run build:prod
   ```

2. **上传文件**
   - 将 `dist/` 目录下的所有文件上传到服务器的 `/tools/` 对应目录

3. **配置服务器**
   - 确保服务器支持 SPA 路由回退
   - 配置静态资源缓存策略

4. **验证部署**
   - 访问 `https://xxxx/tools/` 确认首页正常显示
   - 测试各个工具页面的路由是否正常工作
   - 验证静态资源是否正确加载

### 4. 环境变量配置

如果需要根据环境动态配置base路径，可以使用环境变量：

```bash
# .env.production
VITE_BASE_PATH=/tools/
```

然后在 `vite.config.ts` 中：

```typescript
base: process.env.VITE_BASE_PATH || '/tools/',
```

### 5. 常见问题解决

#### 问题1: 页面刷新404

- **原因**: 服务器没有正确配置 SPA 路由回退
- **解决**: 配置服务器将所有未匹配的路由指向 `/tools/index.html`

#### 问题2: 静态资源404

- **原因**: base 路径配置不正确
- **解决**: 确保 Vite 配置的 base 路径与服务器部署路径一致

#### 问题3: CSS/JS文件路径错误

- **原因**: 构建时没有正确应用 base 路径
- **解决**: 重新构建，确保 `vite.config.ts` 中的 base 配置正确

### 6. 性能优化建议

- 启用 Gzip 压缩
- 配置静态资源长期缓存
- 使用 CDN 加速静态资源加载
- 启用 HTTP/2
