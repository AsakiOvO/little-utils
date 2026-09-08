// src/ui/Card.test.ts —— Card 契约测试(as 透传 / padding 可关 / 长文案 backstop)
// happy-dom 默认环境;RouterLink 渲染为 <a> 需要 router 上下文(memory history,无副作用)
// —— 沿用 ToolCard.test.ts 的 createRouter/createMemoryHistory helper 先例。
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import Card from './Card.vue'

/** RouterLink 字符串解析依赖全局注册(app.use(router) 注册 RouterLink) */
const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
})

/** mount helper 收敛重复选项:props / attrs / 默认插槽 / router 上下文 */
function mountCard(
  props: Record<string, unknown> = {},
  attrs: Record<string, unknown> = {},
  slot = '',
) {
  return mount(Card, {
    props,
    attrs,
    ...(slot ? { slots: { default: slot } } : {}),
    global: { plugins: [router] },
  })
}

describe('Card', () => {
  it('默认渲染 div 且类含卡片语言四件(rounded-lg/border/bg-surface/p-5)', () => {
    const wrapper = mountCard()
    expect(wrapper.element.tagName).toBe('DIV')
    const classes = wrapper.classes()
    expect(classes).toContain('rounded-lg')
    expect(classes).toContain('border-[var(--color-border)]')
    expect(classes).toContain('bg-[var(--color-surface)]')
    expect(classes).toContain('p-5')
  })

  it('as="RouterLink" + :to 渲染为 a 且 href 正确(供 ToolCard 迁移,plan 02-06)', () => {
    const wrapper = mountCard({ as: 'RouterLink' }, { to: '/json-formatter' })
    const link = wrapper.find('a')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/json-formatter')
    expect(link.classes()).toContain('rounded-lg')
    expect(link.classes()).toContain('bg-[var(--color-surface)]')
  })

  it('padding=false 时不渲染 p-5(供 p-10/p-3 等定制场景)', () => {
    const wrapper = mountCard({ padding: false })
    expect(wrapper.classes()).not.toContain('p-5')
    expect(wrapper.classes()).toContain('rounded-lg')
    expect(wrapper.classes()).toContain('border-[var(--color-border)]')
  })

  it('默认槽内容渲染', () => {
    const wrapper = mountCard({}, {}, '工具正在准备上线')
    expect(wrapper.text()).toContain('工具正在准备上线')
  })

  it('backstop:100+ 字长描述自然换行不截断(根类无 whitespace-nowrap/truncate)', () => {
    const longText = '这是一段超长卡片描述用于验证自然换行行为,内容完整呈现不做任何截断或单行压缩。'.repeat(4)
    const wrapper = mountCard({}, {}, longText)
    expect(wrapper.text()).toContain(longText)
    expect(wrapper.classes()).not.toContain('whitespace-nowrap')
    expect(wrapper.classes()).not.toContain('truncate')
  })
})
