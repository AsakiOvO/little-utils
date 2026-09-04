// src/router/routes.ts — 路由 = 注册表纯派生（RESEARCH §Pattern 2，已定夺手写，不用文件路由）
import type { RouteRecordRaw } from 'vue-router'
import Home from '../pages/home.vue' // 首页不懒加载（LCP 关键页）
import NotFound from '../pages/not-found.vue'
import { assertRegistryInvariants, tools } from '../tools'

assertRegistryInvariants() // 路由构建即校验注册表不变量

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Home,
    meta: { layout: 'home' },
  },
  // 工具路由只能从注册表派生——禁止手写静态工具路由
  ...tools.map((tool): RouteRecordRaw => ({
    path: tool.path,
    component: tool.component, // 懒加载组件直接作为路由组件 → 独立 chunk
    meta: { layout: 'tool', tool }, // 布局选择 + 元数据进 meta（SEO 消费点）
  })),
  // catch-all 404 必须置尾
  { path: '/:pathMatch(.*)*', component: NotFound, meta: { layout: 'home' } },
]
