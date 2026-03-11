# 图片工具样式统一与深色主题适配设计

**日期:** 2026-03-11
**状态:** 已批准
**方案:** 渐进式统一

## 背景

当前图片工具(ImageCropper、WatermarkAdder、WatermarkRemover)存在以下问题:
1. 选择图片按钮样式不统一,与 ICO 图标生成器和图片压缩工具不一致
2. Toast 通知样式不统一,部分使用简单样式,部分使用渐变样式
3. 深色主题下存在显示问题,如硬编码的白色背景、透明网格颜色不适配

## 设计目标

1. 统一所有图片工具的视觉风格,以 ICO 图标生成器为标准
2. 全面适配深色主题,确保所有元素在深色模式下正常显示
3. 保持代码可维护性,避免过度重构

## 技术方案

### 方案选择: 渐进式统一

**优势:**
- 改动范围可控,风险较低
- 可以逐步验证效果
- 易于回滚

**实施步骤:**
1. 统一选择图片按钮样式
2. 统一 Toast 通知组件
3. 替换硬编码颜色为 CSS 变量
4. 优化透明背景网格
5. 统一按钮 hover 效果和过渡动画

## 详细设计

### 1. 选择图片按钮统一

**目标样式 (参考 ICO 生成器):**
```vue
<button @click.stop="selectFile" class="btn btn-primary">
  {{ sourceFile ? '重新选择' : '选择图片' }}
</button>
```

**CSS 规范:**
```css
.btn-primary {
  background-color: var(--vt-c-green);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover, #059669);
}
```

**需要修改的文件:**
- `ImageCropper.vue` (第57-59行)
- `WatermarkAdder.vue` (第57-59行)

### 2. Toast 通知统一

**目标样式 (参考 ICO 生成器):**

**HTML 结构:**
```vue
<div v-if="toast.show" class="toast-notification" :class="`toast-${toast.type}`">
  <span class="toast-icon">{{ getToastIcon() }}</span>
  <span class="toast-message">{{ toast.message }}</span>
  <button @click="toast.show = false" class="toast-close">×</button>
</div>
```

**CSS 样式:**
```css
.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  min-width: 320px;
  max-width: 500px;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: slideInRight 0.3s ease-out;
  backdrop-filter: blur(10px);
}

.toast-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-left: 4px solid #047857;
}

.toast-error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-left: 4px solid #b91c1c;
}

.toast-info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-left: 4px solid #1d4ed8;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

**需要修改的文件:**
- `ImageCropper.vue` (第168-172行 HTML, 第722-759行 CSS)
- `WatermarkAdder.vue` (第275-279行 HTML, 第859-896行 CSS)

### 3. 深色主题适配

**透明背景网格优化:**

当前问题: 硬编码 `#eee` 和 `#ddd` 在深色主题下不可见

**解决方案:**
使用 CSS 变量或媒体查询适配:

```css
/* 浅色主题 */
.source-preview {
  background-image:
    linear-gradient(45deg, #eee 25%, transparent 25%),
    linear-gradient(-45deg, #eee 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #eee 75%),
    linear-gradient(-45deg, transparent 75%, #eee 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
}

/* 深色主题 */
@media (prefers-color-scheme: dark) {
  .source-preview {
    background-image:
      linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.1) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.1) 75%);
  }
}
```

**需要修改的位置:**
- `ImageCropper.vue` (第529-541行)
- `WatermarkAdder.vue` (第624-636行)

**其他深色主题问题:**

1. Toast 背景渐变已经足够明显,无需修改
2. 所有使用 `var(--color-*)` 的元素会自动适配
3. 需要检查是否有其他硬编码颜色

### 4. 按钮样式完整规范

**所有按钮类型:**

```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: var(--vt-c-green);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover, #059669);
}

.btn-success {
  background-color: var(--vt-c-green);
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: var(--color-primary-hover, #059669);
}

.btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-error {
  background-color: var(--vt-c-red);
  color: white;
}

.btn-error:hover {
  background-color: var(--color-danger-hover, #dc2626);
}
```

## 实施计划

### 阶段1: ImageCropper.vue
1. 更新选择图片按钮样式
2. 替换 Toast 通知为渐变样式
3. 添加深色主题适配

### 阶段2: WatermarkAdder.vue
1. 更新选择图片按钮样式
2. 替换 Toast 通知为渐变样式
3. 添加深色主题适配

### 阶段3: WatermarkRemover.vue
1. 添加深色主题适配(仅需要检查,该组件很简单)

### 阶段4: 验证测试
1. 浅色主题下测试所有功能
2. 深色主题下测试所有功能
3. 检查样式一致性

## 风险评估

**低风险:**
- 样式修改不影响功能逻辑
- 可以逐个文件修改和测试
- 易于回滚

**潜在问题:**
- 深色主题下可能有遗漏的硬编码颜色
- 不同浏览器的 CSS 变量支持

**缓解措施:**
- 充分测试深色和浅色主题
- 使用 fallback 颜色值

## 验收标准

1. ✅ 所有图片工具的选择图片按钮样式一致
2. ✅ Toast 通知使用统一的渐变样式
3. ✅ 深色主题下所有元素正常显示
4. ✅ 透明背景网格在深色主题下可见
5. ✅ 按钮 hover 效果统一
6. ✅ 无功能回归问题

## 后续优化

1. 考虑提取共享样式到独立文件
2. 创建图片工具通用组件库
3. 添加更多主题变量支持

## 参考

- ICO 图标生成器: `src/views/image/IcoGenerator.vue`
- 图片压缩工具: `src/views/image/ImageCompressor.vue`
