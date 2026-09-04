// src/router/routes.test.ts — 注册表派生路由回归测试（ARCH-01）
import { describe, expect, it } from 'vitest'
import { routes } from './routes'
import { tools } from '../tools'

const CATCH_ALL = '/:pathMatch(.*)*'

describe('routes — 注册表纯派生', () => {
  it('routes[0] 为 home:path "/"、静态组件、meta.layout = "home"', () => {
    const home = routes[0]!
    expect(home.path).toBe('/')
    // 首页不懒加载（LCP 关键页）:component 是已解析组件对象,不是 () => import
    expect(typeof home.component).toBe('object')
    expect(home.meta?.layout).toBe('home')
  })

  it('最后一条为 catch-all 404 且必须置尾', () => {
    expect(routes.length).toBeGreaterThan(0)
    const last = routes[routes.length - 1]!
    expect(last.path).toBe(CATCH_ALL)
    expect(last.meta?.layout).toBe('home')
    // catch-all 只允许出现一次,且在末尾
    const catchAllCount = routes.filter((r) => r.path === CATCH_ALL).length
    expect(catchAllCount).toBe(1)
  })

  it('空注册表时中间无工具路由段（ARCH-01/empty 假设:仅 home + 404）', () => {
    if (tools.length === 0) {
      expect(routes).toHaveLength(2)
      expect(routes.map((r) => r.path)).toEqual(['/', CATCH_ALL])
    }
  })

  it('工具路由 meta.layout = "tool" 且 meta.tool 携带完整元数据', () => {
    const toolRoutes = routes.filter((r) => r.path !== '/' && r.path !== CATCH_ALL)
    expect(toolRoutes).toHaveLength(tools.length)

    for (const [i, tool] of tools.entries()) {
      const route = toolRoutes[i]!
      expect(route.path).toBe(tool.path)
      expect(route.meta?.layout).toBe('tool')
      expect(route.meta?.tool).toBe(tool)
      // 懒加载:component 必须是函数(() => import 的 chunk 边界,ARCH-02)
      expect(typeof route.component).toBe('function')
    }
  })
})
