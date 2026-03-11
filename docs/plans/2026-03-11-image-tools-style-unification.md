# 图片工具样式统一与深色主题适配实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 统一图片裁切、加水印、去水印工具的样式,以 ICO 图标生成器为标准,并全面适配深色主题

**Architecture:** 采用渐进式统一方案,逐个文件修改按钮样式、Toast 通知和深色主题适配,保持功能不变

**Tech Stack:** Vue 3, TypeScript, CSS Variables

---

## Task 1: 统一 ImageCropper.vue 的按钮样式

**Files:**
- Modify: `src/views/image/ImageCropper.vue:57-59` (按钮 HTML)
- Modify: `src/views/image/ImageCropper.vue:434-459` (按钮 CSS)

**Step 1: 更新选择图片按钮 HTML**

在 `ImageCropper.vue` 第 57-59 行,将按钮改为:

```vue
<button @click.stop="selectFile" class="btn btn-primary">
  {{ sourceFile ? '重新选择' : '选择图片' }}
</button>
```

**Step 2: 验证按钮显示**

运行开发服务器,访问图片裁切工具页面,确认:
- 按钮显示为绿色背景
- 文字为白色
- 有圆角和过渡效果

**Step 3: 提交更改**

```bash
git add src/views/image/ImageCropper.vue
git commit -m "style: 统一 ImageCropper 选择图片按钮样式

- 使用 btn btn-primary 类
- 与 ICO 生成器样式保持一致

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: 统一 ImageCropper.vue 的 Toast 通知

**Files:**
- Modify: `src/views/image/ImageCropper.vue:168-172` (Toast HTML)
- Modify: `src/views/image/ImageCropper.vue:722-759` (Toast CSS)

**Step 1: 更新 Toast HTML 结构**

在 `ImageCropper.vue` 第 168-172 行,替换为:

```vue
<Teleport to="body">
  <div v-if="toast.show" class="toast-notification" :class="`toast-${toast.type}`">
    <span class="toast-icon">{{ getToastIcon() }}</span>
    <span class="toast-message">{{ toast.message }}</span>
    <button @click="toast.show = false" class="toast-close">×</button>
  </div>
</Teleport>
```

**Step 2: 添加 getToastIcon 方法**

在 `<script setup>` 部分添加:

```typescript
function getToastIcon(): string {
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  }
  return icons[toast.value.type] || 'ℹ️'
}
```

**Step 3: 更新 Toast CSS 样式**

在 `ImageCropper.vue` 第 722-759 行,替换为:

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

.toast-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  font-weight: 500;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.toast-close:hover {
  background-color: rgba(255, 255, 255, 0.2);
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

**Step 4: 测试 Toast 通知**

运行开发服务器,测试:
- 成功消息显示绿色渐变背景
- 错误消息显示红色渐变背景
- 信息消息显示蓝色渐变背景
- 关闭按钮可以点击

**Step 5: 提交更改**

```bash
git add src/views/image/ImageCropper.vue
git commit -m "style: 统一 ImageCropper Toast 通知样式

- 使用渐变背景
- 添加图标和关闭按钮
- 添加滑入动画

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: ImageCropper.vue 深色主题适配

**Files:**
- Modify: `src/views/image/ImageCropper.vue:529-541` (透明背景网格)

**Step 1: 添加深色主题透明背景网格**

在 `ImageCropper.vue` 的 `<style scoped>` 部分,在 `.source-preview` 样式后添加:

```css
/* 深色主题适配 */
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

**Step 2: 测试深色主题**

切换系统到深色主题,验证:
- 透明背景网格可见
- 所有文字清晰可读
- Toast 通知正常显示

**Step 3: 提交更改**

```bash
git add src/views/image/ImageCropper.vue
git commit -m "style: ImageCropper 适配深色主题

- 添加深色主题透明背景网格
- 确保所有元素在深色模式下可见

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: 统一 WatermarkAdder.vue 的按钮样式

**Files:**
- Modify: `src/views/image/WatermarkAdder.vue:57-59` (按钮 HTML)

**Step 1: 更新选择图片按钮 HTML**

在 `WatermarkAdder.vue` 第 57-59 行,将按钮改为:

```vue
<button @click.stop="selectFile" class="btn btn-primary">
  {{ sourceFile ? '重新选择' : '选择图片' }}
</button>
```

**Step 2: 验证按钮显示**

运行开发服务器,访问加水印工具页面,确认按钮样式正确

**Step 3: 提交更改**

```bash
git add src/views/image/WatermarkAdder.vue
git commit -m "style: 统一 WatermarkAdder 选择图片按钮样式

- 使用 btn btn-primary 类
- 与 ICO 生成器样式保持一致

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: 统一 WatermarkAdder.vue 的 Toast 通知

**Files:**
- Modify: `src/views/image/WatermarkAdder.vue:275-279` (Toast HTML)
- Modify: `src/views/image/WatermarkAdder.vue:859-896` (Toast CSS)

**Step 1: 更新 Toast HTML 结构**

在 `WatermarkAdder.vue` 第 275-279 行,替换为:

```vue
<Teleport to="body">
  <div v-if="toast.show" class="toast-notification" :class="`toast-${toast.type}`">
    <span class="toast-icon">{{ getToastIcon() }}</span>
    <span class="toast-message">{{ toast.message }}</span>
    <button @click="toast.show = false" class="toast-close">×</button>
  </div>
</Teleport>
```

**Step 2: 添加 getToastIcon 方法**

在 `<script setup>` 部分添加:

```typescript
function getToastIcon(): string {
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  }
  return icons[toast.value.type] || 'ℹ️'
}
```

**Step 3: 更新 Toast CSS 样式**

在 `WatermarkAdder.vue` 第 859-896 行,替换为与 Task 2 Step 3 相同的 CSS

**Step 4: 测试 Toast 通知**

运行开发服务器,测试加水印工具的所有 Toast 消息

**Step 5: 提交更改**

```bash
git add src/views/image/WatermarkAdder.vue
git commit -m "style: 统一 WatermarkAdder Toast 通知样式

- 使用渐变背景
- 添加图标和关闭按钮
- 添加滑入动画

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: WatermarkAdder.vue 深色主题适配

**Files:**
- Modify: `src/views/image/WatermarkAdder.vue:624-636` (透明背景网格)

**Step 1: 添加深色主题透明背景网格**

在 `WatermarkAdder.vue` 的 `<style scoped>` 部分,在 `.source-preview` 样式后添加与 Task 3 Step 1 相同的深色主题 CSS

**Step 2: 测试深色主题**

切换系统到深色主题,验证加水印工具的显示效果

**Step 3: 提交更改**

```bash
git add src/views/image/WatermarkAdder.vue
git commit -m "style: WatermarkAdder 适配深色主题

- 添加深色主题透明背景网格
- 确保所有元素在深色模式下可见

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: WatermarkRemover.vue 深色主题适配

**Files:**
- Modify: `src/views/image/WatermarkRemover.vue:22-33` (检查样式)

**Step 1: 检查 WatermarkRemover 样式**

查看 `WatermarkRemover.vue`,确认:
- 已使用 CSS 变量
- 无硬编码颜色
- 深色主题下显示正常

**Step 2: 测试深色主题**

切换系统到深色主题,验证去水印工具页面显示正常

**Step 3: 如需修改则提交**

如果发现问题并修改:

```bash
git add src/views/image/WatermarkRemover.vue
git commit -m "style: WatermarkRemover 深色主题优化

- 确保所有元素在深色模式下可见

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: 全面测试验证

**Step 1: 浅色主题测试**

在浅色主题下测试所有图片工具:
- [ ] ImageCropper 按钮样式正确
- [ ] ImageCropper Toast 通知正确
- [ ] WatermarkAdder 按钮样式正确
- [ ] WatermarkAdder Toast 通知正确
- [ ] WatermarkRemover 显示正常

**Step 2: 深色主题测试**

切换到深色主题,测试所有图片工具:
- [ ] ImageCropper 透明网格可见
- [ ] ImageCropper 所有文字清晰
- [ ] WatermarkAdder 透明网格可见
- [ ] WatermarkAdder 所有文字清晰
- [ ] WatermarkRemover 显示正常

**Step 3: 样式一致性检查**

对比三个工具与 ICO 生成器:
- [ ] 按钮样式一致
- [ ] Toast 样式一致
- [ ] 整体视觉风格统一

**Step 4: 功能回归测试**

测试所有功能是否正常:
- [ ] 图片裁切功能正常
- [ ] 加水印功能正常
- [ ] 去水印页面显示正常

---

## 验收标准

- ✅ 所有图片工具的选择图片按钮样式一致
- ✅ Toast 通知使用统一的渐变样式
- ✅ 深色主题下所有元素正常显示
- ✅ 透明背景网格在深色主题下可见
- ✅ 按钮 hover 效果统一
- ✅ 无功能回归问题

## 注意事项

1. 每次修改后立即测试,确保功能正常
2. 保持代码格式一致
3. 提交信息清晰明确
4. 如遇到问题,及时回滚并重新分析
