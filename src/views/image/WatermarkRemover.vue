<template>
  <ToolPanel title="去水印工具" description="图片去水印功能">
    <!-- 功能下线提示 -->
    <div class="unavailable-section">
      <div class="unavailable-icon">🚧</div>
      <h2>功能暂不可用</h2>
      <p class="unavailable-message">
        由于技术限制，去水印功能暂时无法提供。
      </p>
      <p class="unavailable-hint">
        建议使用专业的图片编辑软件进行水印处理。
      </p>
    </div>
  </ToolPanel>
</template>

<script setup lang="ts">
import ToolPanel from '@/components/ToolPanel.vue'
</script>

<style scoped>
.unavailable-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 3rem;
  text-align: center;
  background: var(--color-background-soft);
  border-radius: 12px;
  border: 2px dashed var(--color-border);
}

.unavailable-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  opacity: 0.6;
}

.unavailable-section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  color: var(--color-heading);
}

.unavailable-message {
  font-size: 1rem;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
  max-width: 500px;
}

.unavailable-hint {
  font-size: 0.875rem;
  color: var(--color-text-light);
  margin: 0;
  max-width: 500px;
}
</style>
