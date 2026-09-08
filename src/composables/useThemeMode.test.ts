// src/composables/useThemeMode.test.ts — 三态主题状态机行为锁定(SITE-04;D-01/D-02/D-03/D-04/D-11)
// happy-dom 不计算媒体查询(Pitfall 5):系统偏好经 vi.stubGlobal('matchMedia', 工厂 fake)注入,
//   fake 记录 change 监听并可控触发(VueUse useMediaQuery 的 handler 读取 event.matches)。
// 模块级单例隔离:vi.resetModules() 重置注册表,用例内动态 import 重建单例;
//   useStorage(initOnMounted) 在组件外调用时经 tryOnMounted 立即读 storage(14.4.0 实证语义)。
// 读盘断言用 node:fs + import.meta.dirname(vitest 下 import.meta.url 非 file 协议,02-01 定型模式)。
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const THEME_KEY = 'little-utils:v1:theme'
const LIGHT_MQ = '(prefers-color-scheme: light)'
const DARK_MQ = '(prefers-color-scheme: dark)'

type ChangeListener = (ev: { matches: boolean }) => void

type FakeMql = {
  matches: boolean
  addEventListener: (type: string, listener: ChangeListener) => void
  removeEventListener: (type: string, listener: ChangeListener) => void
  /** 手动触发 change 回调(VueUse handler 读 event.matches),模拟系统偏好实时变化(D-04) */
  dispatchChange: (matches: boolean) => void
}

function createFakeMql(initial: boolean): FakeMql {
  const listeners = new Set<ChangeListener>()
  const mql: FakeMql = {
    matches: initial,
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
    dispatchChange(matches) {
      mql.matches = matches
      for (const listener of listeners) listener({ matches })
    },
  }
  return mql
}

let mqls: Map<string, FakeMql>

beforeEach(() => {
  vi.resetModules() // 重置模块级单例,配合用例内动态 import
  localStorage.clear()
  // 同文件用例共享 happy-dom document:重置前序用例 watch 副作用残留的 DOM 主题基线
  document.documentElement.className = ''
  document.documentElement.style.colorScheme = ''
  mqls = new Map()
  // 工厂 fake:同一 query 复用同一 mql,便于用例中按查询串取回并触发 change
  vi.stubGlobal('matchMedia', (query: string) => {
    let mql = mqls.get(query)
    if (!mql) {
      mql = createFakeMql(false) // 默认无偏好:dark/light 均 false → no-preference
      mqls.set(query, mql)
    }
    return mql
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function loadThemeMode() {
  const mod = await import('./useThemeMode')
  return mod.useThemeMode()
}

describe('useThemeMode 三态状态机', () => {
  it('① cycle 三态循环 dark→light→auto,localStorage 按序写入(D-02/D-03 持久化)', async () => {
    const { preference, resolved, cycle } = await loadThemeMode()
    expect(preference.value).toBe('auto') // 初始无记录 → auto
    expect(localStorage.getItem(THEME_KEY)).toBe('auto') // writeDefaults 落盘
    expect(resolved.value).toBe('dark') // auto + no-preference 回落暗

    cycle() // auto → dark
    await nextTick() // watchPausable flush 'pre' 后才写 storage
    expect(preference.value).toBe('dark')
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
    expect(resolved.value).toBe('dark')

    cycle() // dark → light
    await nextTick()
    expect(preference.value).toBe('light')
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
    expect(resolved.value).toBe('light')

    cycle() // light → auto
    await nextTick()
    expect(preference.value).toBe('auto')
    expect(localStorage.getItem(THEME_KEY)).toBe('auto')
  })

  it('② auto + 系统 no-preference → resolved dark(D-01 显式回落暗色)', async () => {
    const { resolved } = await loadThemeMode()
    expect(mqls.get(DARK_MQ)?.matches).toBe(false)
    expect(mqls.get(LIGHT_MQ)?.matches).toBe(false)
    expect(resolved.value).toBe('dark')
  })

  it('③ auto + 系统 light → light;matchMedia change 回调实时联动(D-04)', async () => {
    const { resolved } = await loadThemeMode()
    expect(resolved.value).toBe('dark')

    mqls.get(LIGHT_MQ)!.dispatchChange(true)
    await nextTick()
    expect(resolved.value).toBe('light') // 系统偏好变化立即生效

    mqls.get(LIGHT_MQ)!.dispatchChange(false)
    mqls.get(DARK_MQ)!.dispatchChange(true)
    await nextTick()
    expect(resolved.value).toBe('dark')
  })

  it('④ 手动 dark 后系统变化不影响,切回 auto 恢复联动(D-04)', async () => {
    const { preference, resolved, cycle } = await loadThemeMode()

    cycle() // auto → dark(手动锁定)
    await nextTick()
    expect(preference.value).toBe('dark')

    mqls.get(LIGHT_MQ)!.dispatchChange(true) // 系统变亮
    await nextTick()
    expect(resolved.value).toBe('dark') // 手动态不受系统变化影响

    cycle() // dark → light
    cycle() // light → auto
    await nextTick()
    expect(preference.value).toBe('auto')
    expect(resolved.value).toBe('light') // 切回 auto 恢复系统联动
  })

  it('⑤ storage 脏值 blue → 白名单归一 auto(Pitfall 7/T-02-03)', async () => {
    localStorage.setItem(THEME_KEY, 'blue')
    const { preference } = await loadThemeMode()
    expect(preference.value).toBe('auto') // 非 'dark'/'light' 一律 auto
  })

  it('⑥ resolved 变更驱动 DOM:html.dark + colorScheme 翻转,瞬切窗口挂 .theme-switching、双 rAF 后移除(D-11)', async () => {
    vi.useFakeTimers() // fake requestAnimationFrame,控制双 rAF 移除时机
    try {
      const { resolved, cycle } = await loadThemeMode()
      const root = document.documentElement
      expect(root.classList.contains('dark')).toBe(false) // 初始 DOM 基线(类由 head 脚本/预渲染负责)
      expect(root.style.colorScheme).toBe('')

      cycle() // auto → dark
      await nextTick()
      expect(resolved.value).toBe('dark')
      expect(root.classList.contains('dark')).toBe(true)
      expect(root.style.colorScheme).toBe('dark')
      expect(root.classList.contains('theme-switching')).toBe(true) // 瞬切窗口内挂类

      vi.advanceTimersByTime(32) // 双 rAF(每帧 16ms)配对移除
      expect(root.classList.contains('theme-switching')).toBe(false)

      cycle() // dark → light
      await nextTick()
      expect(root.classList.contains('dark')).toBe(false)
      expect(root.style.colorScheme).toBe('light')
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('index.html head 内联脚本与 useThemeMode 判定镜像(D-05/Pitfall 1 防漂移)', () => {
  // 读盘形态沿用 02-01 定型:node:fs + import.meta.dirname(vitest 下 import.meta.url 非 file 协议)
  const html = readFileSync(`${import.meta.dirname}/../../index.html`, 'utf8')

  it('内联脚本包含 THEME_STORAGE_KEY 字面值(与状态机键镜像)', () => {
    expect(html, 'head 内联脚本与 useThemeMode 判定逻辑必须镜像对齐(改此必改彼)').toContain(THEME_KEY)
  })

  it('内联脚本包含 dark/light 白名单分支与 matchMedia 判定(与 resolved 判定镜像)', () => {
    expect(html, 'head 内联脚本与 useThemeMode 判定逻辑必须镜像对齐(改此必改彼)').toContain("raw === 'dark' || raw === 'light'")
    expect(html, 'head 内联脚本与 useThemeMode 判定逻辑必须镜像对齐(改此必改彼)').toContain("(prefers-color-scheme: light)")
  })
})
