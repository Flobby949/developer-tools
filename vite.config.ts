import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  // 设置基础路径为 /tools/ 用于子路径部署
  base: '/tools/',
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 构建配置
  build: {
    // 输出目录
    outDir: 'dist',
    // 生成 source map 便于调试
    sourcemap: false,
    // 压缩配置 - 使用 esbuild 压缩
    minify: 'esbuild',
    // 资源内联阈值
    assetsInlineLimit: 4096,
    // Rollup 选项
    rollupOptions: {
      output: {
        // 手动分包
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          monaco: ['monaco-editor'],
        },
      },
    },
  },
})
