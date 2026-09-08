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
    // D-05「绝对零闪烁」方案(RESEARCH §Pattern 3):每路由预渲染 HTML 的 html 标签默认挂 class="dark"
    // (暗色为默认主题),亮色用户由 index.html head 内联镜像脚本在首绘前移除类并写 color-scheme。
    // 幂等:html 标签已含 dark 类时原样返回;indexHTML 逐路由传入同一模板,无跨路由串改。
    onBeforePageRender(_route, indexHTML) {
      if (/<html[^>]*\bclass="[^"]*\bdark\b/.test(indexHTML)) return indexHTML
      return indexHTML.replace(/<html([^>]*)>/i, '<html$1 class="dark">')
    },
  },
})
