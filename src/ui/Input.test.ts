// src/ui/Input.test.ts —— Input 契约测试(label 关联 / v-model / multiline / 错误态 aria / 16px+44px)
// happy-dom 默认环境(六件套无外部依赖);尺寸断言走源码级 class 字符串,不做布局计算(Pitfall 5)。
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Input from './Input.vue'

/** mount helper 收敛重复选项:必传 modelValue,props/attrs 透传 */
function mountInput(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  return mount(Input, { props: { modelValue: '', ...props }, attrs })
}

describe('Input', () => {
  it('label 关联:传 label 后 label 元素 for 等于控件 id(D-19)', () => {
    const wrapper = mountInput({ label: 'JSON 输入' })
    const label = wrapper.find('label')
    const control = wrapper.find('input')
    expect(label.exists()).toBe(true)
    expect(control.exists()).toBe(true)
    expect(label.text()).toBe('JSON 输入')
    expect(label.attributes('for')).toBe(control.attributes('id'))
  })

  it('v-model:setValue 触发后 emitted("update:modelValue") 携带新值', async () => {
    const wrapper = mountInput()
    await wrapper.find('input').setValue('{ "a": 1 }')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['{ "a": 1 }'])
  })

  it('multiline=true 渲染 textarea(rows=4),否则渲染 input(D-13 变体)', async () => {
    const area = mountInput({ multiline: true })
    expect(area.find('textarea').exists()).toBe(true)
    expect(area.find('input').exists()).toBe(false)
    expect(area.find('textarea').attributes('rows')).toBe('4')
    await area.find('textarea').setValue('多行文本')
    expect(area.emitted('update:modelValue')?.[0]).toEqual(['多行文本'])

    const single = mountInput()
    expect(single.find('input').exists()).toBe(true)
    expect(single.find('textarea').exists()).toBe(false)
  })

  it('error 态:aria-invalid=true + aria-describedby 指向节点渲染文案 + danger 边框(D-19/D-10)', () => {
    const wrapper = mountInput({ error: 'JSON 语法错误,请检查第 3 行' })
    const control = wrapper.find('input')
    expect(control.attributes('aria-invalid')).toBe('true')
    const describedBy = control.attributes('aria-describedby')
    expect(describedBy).toBeTruthy()
    const errorNode = wrapper.find('p')
    expect(errorNode.exists()).toBe(true)
    expect(errorNode.attributes('id')).toBe(describedBy)
    expect(errorNode.text()).toBe('JSON 语法错误,请检查第 3 行')
    expect(control.classes()).toContain('border-[var(--color-danger)]')
    expect(control.classes()).not.toContain('border-[var(--color-border)]')
  })

  it('无 error:无 aria-invalid / aria-describedby,错误节点不渲染', () => {
    const wrapper = mountInput()
    const control = wrapper.find('input')
    expect(control.attributes('aria-invalid')).toBeUndefined()
    expect(control.attributes('aria-describedby')).toBeUndefined()
    expect(wrapper.find('p').exists()).toBe(false)
    expect(control.classes()).toContain('border-[var(--color-border)]')
    expect(control.classes()).not.toContain('border-[var(--color-danger)]')
  })

  it('源码级:控件类含 text-base(16px)与 min-h-11(44px)——D-21 组件默认层', () => {
    const single = mountInput()
    expect(single.find('input').classes()).toContain('text-base')
    expect(single.find('input').classes()).toContain('min-h-11')
    const area = mountInput({ multiline: true })
    expect(area.find('textarea').classes()).toContain('text-base')
    expect(area.find('textarea').classes()).toContain('min-h-11')
  })

  it('size prop 留位:接受 size="md" 正常渲染(D-16 单一默认尺寸)', () => {
    const wrapper = mountInput({ size: 'md', label: '输入' })
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('label').exists()).toBe(true)
  })
})
