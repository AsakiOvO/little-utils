// src/tools/index.ts — 工具注册表：全站单一事实来源（RESEARCH §Pattern 1）
// 本计划（01-01）只立契约：tools 初始为空数组；真实工具由 Plan 01-02/01-04 注册。
import type { Tool, ToolCategoryId } from './tool'

export type { Tool, ToolCategoryId, ToolMeta } from './tool'
export { defineTool, NEW_WINDOW_DAYS } from './tool'

export const toolCategories: Record<ToolCategoryId, { name: string }> = {
  developer: { name: '开发辅助' },
  office: { name: '办公效率' },
}

/**
 * 全站单一事实来源：新增工具 = 加目录 + 此处一行。
 * 空注册表是合法状态（派生路由仅含 home + 404，见 ARCH-01/empty 登记假设）。
 */
export const tools: Tool[] = []

// —— 派生 helpers（消费方只读这些，不碰原始数组）——
export function toolsByCategory(): Array<{ id: ToolCategoryId; name: string; tools: Tool[] }> {
  return Object.entries(toolCategories).map(([id, c]) => ({
    id: id as ToolCategoryId,
    name: c.name,
    tools: tools.filter((t) => t.category === id),
  }))
}

/**
 * dev 期不变量校验（单元测试 + 路由模块加载即断言）。
 * 参数化默认值保持签名兼容且可单测错误分支。
 */
export function assertRegistryInvariants(list: Tool[] = tools): void {
  const paths = new Set<string>()
  for (const t of list) {
    if (paths.has(t.path)) throw new Error(`duplicate tool path: ${t.path}`)
    if (!t.path.startsWith('/') || t.path.includes('//')) throw new Error(`bad path: ${t.path}`)
    if (!(t.category in toolCategories)) throw new Error(`unknown category: ${t.category}`)
    if (t.keywords.length === 0) throw new Error(`no keywords: ${t.path}`)
    paths.add(t.path)
  }
}
