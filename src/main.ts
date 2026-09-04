// Source: Context7 /antfu-collective/vite-ssg README
import { ViteSSG } from 'vite-ssg'
import { createHead } from '@unhead/vue/client' // v2+ 子路径导出 [CITED: unhead.unjs.io migration]
import App from './App.vue'
import { routes } from './router/routes'
import './styles/tokens.css'
import './styles/base.css'

export const createApp = ViteSSG(
  App,
  { routes, base: import.meta.env.BASE_URL }, // history 由 vite-ssg 自动注入
  ({ app }) => {
    app.use(createHead())
  },
)
