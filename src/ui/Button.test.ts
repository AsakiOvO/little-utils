// src/ui/Button.test.ts —— Button 契约测试(D-13/D-14/D-21)
// happy-dom 默认环境(六件套无外部依赖);尺寸/类断言走源码级 class 字符串,
// 不做 getBoundingClientRect 布局计算(02-RESEARCH Pitfall 5)。
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from './Button.vue'

/** mount helper 收敛重复选项(ToolCard.test.ts 纪律):props / attrs / 默认插槽 */
function mountButton(
  props: { variant?: 'outline' | 'ghost' } = {},
  attrs: Record<string, unknown> = {},
  slot = '',
) {
  return mount(Button, {
    props,
    attrs,
    ...(slot ? { slots: { default: slot } } : {}),
  })
}

describe('Button', () => {
  it('根为 button 且默认 type="button"', () => {
    const wrapper = mountButton()
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
  })

  it('默认 outline variant:含 44px 触控(min-h-11)与描边语言(border/hover 霓虹青)', () => {
    const wrapper = mountButton()
    expect(wrapper.classes()).toContain('min-h-11')
    expect(wrapper.classes()).toContain('border-[var(--color-border)]')
    expect(wrapper.classes()).toContain('hover:border-[var(--color-neon-cyan)]')
    // hover 文字经 accent 语义消费(02-REVIEW CR-01:亮色下原语青文本不达标)
    expect(wrapper.classes()).toContain('hover:text-[var(--color-accent)]')
  })

  it("variant='ghost':无描边语言,含 hover 提亮底色(hover:bg-[var(--color-surface-raised)])", () => {
    const wrapper = mountButton({ variant: 'ghost' })
    expect(wrapper.classes()).not.toContain('border-[var(--color-border)]')
    expect(wrapper.classes()).not.toContain('hover:border-[var(--color-neon-cyan)]')
    expect(wrapper.classes()).toContain('hover:bg-[var(--color-surface-raised)]')
    expect(wrapper.classes()).toContain('hover:text-[var(--color-text-primary)]')
  })

  it('disabled 透传:按钮具备 disabled 属性且类含 disabled:opacity-40', () => {
    const wrapper = mountButton({}, { disabled: true })
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('disabled:opacity-40')
    expect(wrapper.classes()).toContain('disabled:cursor-not-allowed')
  })

  it('默认插槽文案完整渲染', () => {
    const wrapper = mountButton({}, {}, '格式化')
    expect(wrapper.text()).toContain('格式化')
  })

  it('type 属性可被 attrs 覆盖为 submit(表单场景契约)', () => {
    const wrapper = mountButton({}, { type: 'submit' })
    expect(wrapper.attributes('type')).toBe('submit')
  })

  it('backstop:80+ 字长文案换行不截断(min-height 44px 保底,根类无 truncate/whitespace-nowrap)', () => {
    const longText = '这是一段超长按钮文案用于验证换行行为——'.repeat(6) // 120 字
    const wrapper = mountButton({}, {}, longText)
    expect(wrapper.text()).toContain(longText)
    expect(wrapper.classes()).not.toContain('truncate')
    expect(wrapper.classes()).not.toContain('whitespace-nowrap')
  })
})
