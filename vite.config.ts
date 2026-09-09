// Source: Context7 /antfu-collective/vite-ssg + /websites/tailwindcss
/// <reference types="vite-ssg" />
import { writeFile } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import { createJiti } from 'jiti'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import { buildRobotsTxt, buildSitemapXml } from './src/seo'
import { SITE_URL } from './src/config/site'

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
      // D-08:追加 '/404' 触发 catch-all 渲染出 dist/404.html（RESEARCH Pitfall 4;
      // vue-router 将 '/404' 匹配到 /:pathMatch(.*)* → NotFound 组件,noindex meta 随组件落盘）
      return [...paths.filter((p) => !p.includes(':')), '/404']
    },
    // D-05「绝对零闪烁」方案(RESEARCH §Pattern 3):每路由预渲染 HTML 的 html 标签默认挂 class="dark"
    // (暗色为默认主题),亮色用户由 index.html head 内联镜像脚本在首绘前移除类并写 color-scheme。
    // 幂等:html 标签已含 dark 类时原样返回;indexHTML 逐路由传入同一模板,无跨路由串改。
    onBeforePageRender(_route, indexHTML) {
      if (/<html[^>]*\bclass="[^"]*\bdark\b/.test(indexHTML)) return indexHTML
      return indexHTML.replace(/<html([^>]*)>/i, '<html$1 class="dark">')
    },
    // D-03/D-12:onFinished 全部路由落盘后生成 dist/sitemap.xml 与 dist/robots.txt。
    // 路由清单 jiti 实载注册表(双源消除,禁止手写工具路由字面量——Phase 5 新工具
    // 「注册表一行」即自动收录);/404 不进 sitemap(D-08:noindex 页不收录);
    // robots.txt 不放 public/(静态文件无法引用 SITE_URL,会硬编码域名违反 D-12)。
    async onFinished() {
      const jiti = createJiti(import.meta.url)
      const registry = await jiti.import<typeof import('./src/tools/index')>('./src/tools/index.ts')
      const toolPaths = registry.tools.map((t) => t.path)
      await writeFile('dist/sitemap.xml', buildSitemapXml(['/', ...toolPaths], SITE_URL), 'utf8')
      await writeFile('dist/robots.txt', buildRobotsTxt(SITE_URL), 'utf8')
    },
  },
})
