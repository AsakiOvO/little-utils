// src/router/index.d.ts — RouteMeta 类型增强（RESEARCH §Pattern 2 第二块，TS 标准增强点）
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 布局选择：home = 首页框架壳；tool = 工具操作区框架壳 */
    layout?: 'home' | 'tool'
    /** 工具路由携带完整注册表元数据（SEO/导航消费点） */
    tool?: import('../tools/tool').Tool
  }
}
