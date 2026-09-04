// src/tools/tool.ts — 全站契约（RESEARCH §Pattern 1）
import type { Component } from 'vue'

/** 分类 id 必须是 tools/index.ts 中 toolCategories 的键 */
export type ToolCategoryId = 'developer' | 'office'

export interface ToolMeta {
  /** 显示名（中文优先） */
  name: string
  /** URL 路径，'/xxx' 形式，全站唯一（含 home 之外的静态页） */
  path: string
  /** SEO description + 卡片副标题（一句话中文） */
  description: string
  /** 搜索关键词：中英混合，含别名（Phase 4 fuse.js 直接消费） */
  keywords: string[]
  category: ToolCategoryId
  /** lucide 图标组件引用（D-06：契约字段，勿改为字符串） */
  icon: Component
  /** 懒加载组件：() => import('./x.vue')（ARCH-02 的 chunk 边界） */
  component: () => Promise<Component>
  /** ISO 日期 'YYYY-MM-DD'，isNew 由它派生（30 天窗口） */
  createdAt: string
}

export interface Tool extends ToolMeta {
  isNew: boolean
}

export const NEW_WINDOW_DAYS = 30

/** 工具自注册入口：meta 传入即派生 isNew，绝不手填 */
export function defineTool(meta: ToolMeta): Tool {
  const created = new Date(meta.createdAt).getTime()
  return { ...meta, isNew: Date.now() - created < NEW_WINDOW_DAYS * 86_400_000 }
}
