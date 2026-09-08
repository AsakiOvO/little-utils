// src/ui/ThemeToggle.test.ts — 三态循环图标按钮行为锁定(D-02/D-03/D-13/D-19/D-21,SITE-04)
// happy-dom 不计算媒体查询(Pitfall 5):matchMedia 工厂 fake 注入(同 useThemeMode.test.ts 纪律);
// 组件经 vi.resetModules() + 动态 import(重置 useThemeMode 模块级单例,保证用例隔离);
// 44px 触控目标断言走源码级(Pitfall 5:happy-dom getBoundingClientRect 恒 0,不测布局)。
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

const THEME_KEY = 'little-utils:v1:theme'

type ChangeListener = (ev: { matches: boolean }) => void

// happy-dom 无真实 matchMedia:默认无偏好(matches 全 false),本文件不做系统偏好联动断言
function createFakeMql() {
  const listeners = new Set<ChangeListener>()
  return {
    matches: false,
    addEventListener: (_type: string, listener: ChangeListener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: ChangeListener) => listeners.delete(listener),
  }
}

beforeEach(() => {
  vi.resetModules() // 重置 useThemeMode 模块级单例
  localStorage.clear()
  // 同文件用例共享 happy-dom document:重置前序用例 watch 副作用残留的 DOM 主题基线
  document.documentElement.className = ''
  document.documentElement.style.colorScheme = ''
  vi.stubGlobal('matchMedia', () => createFakeMql())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function mountToggle() {
  const { default: ThemeToggle } = await import('./ThemeToggle.vue')
  return mount(ThemeToggle)
}

describe('ThemeToggle 三态循环图标按钮', () => {
  it('① 初始(preference=auto)aria-label/title 含「跟随系统」,图标为显示器(D-03)', async () => {
    const wrapper = await mountToggle()
    const btn = wrapper.find('button')
    expect(btn.attributes('aria-label')).toContain('跟随系统')
    expect(btn.attributes('title')).toContain('跟随系统')
    expect(wrapper.find('svg').classes()).toContain('lucide-monitor')
    expect(localStorage.getItem(THEME_KEY)).toBe('auto') // 挂载后初始值落盘(writeDefaults)
  })

  it('② 点击一次 → 暗色:aria-label 切换 + 图标月亮 + 选择写 localStorage(D-02/D-03)', async () => {
    const wrapper = await mountToggle()
    await wrapper.find('button').trigger('click')
    await nextTick()
    expect(wrapper.find('button').attributes('aria-label')).toContain('暗色')
    expect(wrapper.find('svg').classes()).toContain('lucide-moon')
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
  })

  it('③ 连点三次循环回「跟随系统」初始态(D-02 三态循环)', async () => {
    const wrapper = await mountToggle()
    await wrapper.find('button').trigger('click') // auto → dark
    await wrapper.find('button').trigger('click') // dark → light
    await wrapper.find('button').trigger('click') // light → auto
    await nextTick()
    expect(wrapper.find('button').attributes('aria-label')).toContain('跟随系统')
    expect(wrapper.find('svg').classes()).toContain('lucide-monitor')
    expect(localStorage.getItem(THEME_KEY)).toBe('auto')
  })

  it('④ localStorage 值随点击按 dark→light→auto 序列变化(D-02 持久化)', async () => {
    const wrapper = await mountToggle()
    await wrapper.find('button').trigger('click')
    await nextTick()
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
    await wrapper.find('button').trigger('click')
    await nextTick()
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
    await wrapper.find('button').trigger('click')
    await nextTick()
    expect(localStorage.getItem(THEME_KEY)).toBe('auto')
  })

  it('⑤ 根类源码级断言 min-h-11 与 min-w-11(44px 触控目标,D-21/Pitfall 5)', () => {
    const source = readFileSync(`${import.meta.dirname}/ThemeToggle.vue`, 'utf8')
    expect(source).toContain('min-h-11')
    expect(source).toContain('min-w-11')
  })

  it('⑥ 图标元素 aria-hidden="true",语义全部在 aria-label(D-19)', async () => {
    const wrapper = await mountToggle()
    expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true')
  })
})
