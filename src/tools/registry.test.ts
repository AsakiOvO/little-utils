// src/tools/registry.test.ts — 注册表契约回归测试（ARCH-01）
import { describe, expect, it } from 'vitest'
import {
  assertRegistryInvariants,
  defineTool,
  NEW_WINDOW_DAYS,
  toolCategories,
  tools,
} from './index'
import type { Tool, ToolMeta } from './index'

/** 构造合法 ToolMeta 的工厂,单字段覆写以测不变量错误分支 */
function validMeta(overrides: Partial<ToolMeta> = {}): ToolMeta {
  return {
    name: '测试工具',
    path: '/test-tool',
    description: '测试用工具元数据',
    keywords: ['test', '测试'],
    category: 'developer',
    icon: () => '',
    component: async () => ({ render: () => null }) as never,
    createdAt: '2026-09-04',
    ...overrides,
  }
}

describe('defineTool — isNew 派生（30 天窗口）', () => {
  it('createdAt 在 30 天内 → isNew = true', () => {
    const daysAgo = new Date(Date.now() - (NEW_WINDOW_DAYS - 1) * 86_400_000)
    const iso = daysAgo.toISOString().slice(0, 10)
    const tool = defineTool(validMeta({ createdAt: iso }))
    expect(tool.isNew).toBe(true)
  })

  it('createdAt 超过 30 天 → isNew = false', () => {
    const longAgo = new Date(Date.now() - (NEW_WINDOW_DAYS + 5) * 86_400_000)
    const iso = longAgo.toISOString().slice(0, 10)
    const tool = defineTool(validMeta({ createdAt: iso }))
    expect(tool.isNew).toBe(false)
  })
})

describe('assertRegistryInvariants — 空注册表合法（ARCH-01/empty 已登记假设）', () => {
  it('空数组通过,不抛错', () => {
    expect(() => assertRegistryInvariants([])).not.toThrow()
  })

  it('当前注册表(空)通过,不抛错', () => {
    expect(() => assertRegistryInvariants()).not.toThrow()
  })
})

describe('assertRegistryInvariants — 四类不变量违例抛错', () => {
  it('重复 path → 抛错', () => {
    const list = [metaToTool(validMeta()), metaToTool(validMeta())]
    expect(() => assertRegistryInvariants(list)).toThrow(/duplicate tool path/)
  })

  it('非 / 开头 path → 抛错', () => {
    const list = [metaToTool(validMeta({ path: 'no-slash' }))]
    expect(() => assertRegistryInvariants(list)).toThrow(/bad path/)
  })

  it('path 含 // → 抛错', () => {
    const list = [metaToTool(validMeta({ path: '/double//slash' }))]
    expect(() => assertRegistryInvariants(list)).toThrow(/bad path/)
  })

  it('未知 category → 抛错', () => {
    const list = [metaToTool(validMeta({ category: 'unknown' as never }))]
    expect(() => assertRegistryInvariants(list)).toThrow(/unknown category/)
  })

  it('空 keywords → 抛错', () => {
    const list = [metaToTool(validMeta({ keywords: [] }))]
    expect(() => assertRegistryInvariants(list)).toThrow(/no keywords/)
  })
})

describe('注册表单一事实来源', () => {
  it('toolCategories 覆盖全部 ToolCategoryId 键', () => {
    expect(Object.keys(toolCategories).sort()).toEqual(['developer', 'office'])
  })

  it('tools 数组类型为 Tool[](本计划为空注册表,Plan 01-02/01-04 注册)', () => {
    const registry: Tool[] = tools
    expect(Array.isArray(registry)).toBe(true)
  })
})

/** defineTool 反向构造:测试不变量时需要完整 Tool 形状 */
function metaToTool(meta: ToolMeta): Tool {
  return defineTool(meta)
}
