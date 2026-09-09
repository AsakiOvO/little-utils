// Source: Context7 /antfu-collective/vite-ssg README
import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes } from './router/routes'
import './styles/tokens.css'
import './styles/base.css'

// head 由 ViteSSG 内置集成管理（v28 集成 @unhead/vue v2：SSR 期自动创建 @unhead/vue/server 实例
// 并在渲染时 renderDOMHead 落盘，浏览器期自动创建 @unhead/vue/client 实例供水合）。
// 此处不得再 app.use(createHead())——自装 client 实例会覆盖内置实例，SSG 预渲染期组件
// useHead/useSeoMeta 的 meta 无法落盘（03-01 Task 1 A4 fail-first 实证）。
export const createApp = ViteSSG(
  App,
  { routes, base: import.meta.env.BASE_URL }, // history 由 vite-ssg 自动注入
)
