// src/components/ToolCard.test.ts — 工具卡片组件测试(D-06 icon 组件引用形态;D-15 根容器经六件套 Card as=RouterLink 渲染)
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import ToolCard from './ToolCard.vue'
import type { Tool } from '../tools'

/** 函数式组件模拟 lucide 图标(D-06:icon 字段必须是组件引用) */
const FakeIcon = () => h('span', { class: 'fake-icon' })

/** RouterLink 渲染为 <a> 需要 router 上下文(memory history,无副作用) */
const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
})

function mountToolCard(tool: Tool) {
  return mount(ToolCard, {
    props: { tool },
    global: { plugins: [router] },
  })
}

function makeTool(overrides: Partial<Tool> = {}): Tool {
  return {
    name: 'JSON 格式化',
    path: '/json-formatter',
    description: 'JSON 校验、格式化与压缩',
    keywords: ['json', '格式化'],
    category: 'developer',
    icon: FakeIcon,
    component: async () => ({ render: () => null }) as never,
    createdAt: '2026-09-04',
    isNew: false,
    ...overrides,
  }
}

describe('ToolCard', () => {
  it('渲染工具名称与描述文本', () => {
    const wrapper = mountToolCard(makeTool())
    expect(wrapper.text()).toContain('JSON 格式化')
    expect(wrapper.text()).toContain('JSON 校验、格式化与压缩')
  })

  it('Card as=RouterLink 渲染为指向 tool.path 的 a 元素', () => {
    const wrapper = mountToolCard(makeTool())
    const link = wrapper.find('a')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/json-formatter')
  })

  it('渲染 icon 组件引用(函数式组件输出)', () => {
    const wrapper = mountToolCard(makeTool())
    expect(wrapper.find('.fake-icon').exists()).toBe(true)
  })

  it('isNew = true 时 NEW 徽标出现', () => {
    const wrapper = mountToolCard(makeTool({ isNew: true }))
    expect(wrapper.text()).toContain('NEW')
  })

  it('isNew = false 时 NEW 徽标不出现', () => {
    const wrapper = mountToolCard(makeTool({ isNew: false }))
    expect(wrapper.text()).not.toContain('NEW')
  })
})
