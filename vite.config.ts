// Source: Context7 /antfu-collective/vite-ssg + /websites/tailwindcss
/// <reference types="vite-ssg" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  ssgOptions: {
    // Phase 3 起：includedRoutes 过滤、onFinished 生成 sitemap、每路由 meta 验证
    includedRoutes(paths) {
      return paths.filter((p) => !p.includes(':')) // 暂不预渲染 catch-all 404
    },
  },
})
