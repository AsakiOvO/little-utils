// src/ui/Tabs.test.ts —— Tabs 契约测试（D-13/D-19/UI-SPEC overflow 与 zero-one-many 行）
// happy-dom 默认环境（六件套无外部依赖）；断言走 class/attribute 源码级，
// 不做 getBoundingClientRect 布局计算（02-RESEARCH Pitfall 5）。
// 受控 v-model 契约（与 Input 同构）：点击/键盘只 emit update:modelValue，
// 面板 hidden 翻转经 setProps 模拟父组件回写后断言。
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Tabs from './Tabs.vue'

const threeTabs = [
  { id: 'a', label: '标签 A' },
  { id: 'b', label: '标签 B' },
  { id: 'c', label: '标签 C' },
]

/** mount helper 收敛重复选项（Button.test.ts 纪律）；modelValue 可选，未传测默认活动态 */
function mountTabs(
  tabs: { id: string; label: string }[] = threeTabs,
  modelValue?: string,
  options: { attachTo?: HTMLElement } = {},
) {
  return mount(Tabs, {
    props: { tabs, ...(modelValue !== undefined ? { modelValue } : {}) },
    slots: Object.fromEntries(tabs.map((t) => [t.id, `${t.id}-内容`])),
    ...(options.attachTo ? { attachTo: options.attachTo } : {}),
  })
}

describe('Tabs', () => {
  it('roving tabindex：仅活动 tab tabindex=0，其余 -1（单一 Tab 停靠点，D-19 强制）', () => {
    const wrapper = mountTabs(threeTabs, 'b')
    expect(wrapper.find('#tab-a').attributes('tabindex')).toBe('-1')
    expect(wrapper.find('#tab-b').attributes('tabindex')).toBe('0')
    expect(wrapper.find('#tab-c').attributes('tabindex')).toBe('-1')
  })

  it('aria 语义：aria-selected 与活动态对应，aria-controls/aria-labelledby 关联，tablist 命名', () => {
    const wrapper = mountTabs(threeTabs, 'b')
    expect(wrapper.find('#tab-b').attributes('aria-selected')).toBe('true')
    expect(wrapper.find('#tab-a').attributes('aria-selected')).toBe('false')
    expect(wrapper.find('#tab-c').attributes('aria-selected')).toBe('false')
    expect(wrapper.find('#tab-b').attributes('aria-controls')).toBe('panel-b')
    expect(wrapper.find('#panel-b').attributes('aria-labelledby')).toBe('tab-b')
    expect(wrapper.find('[role="tablist"]').attributes('aria-label')).toBe('标签页')
    // ariaLabel prop 可定制
    const named = mount(Tabs, { props: { tabs: threeTabs, modelValue: 'a', ariaLabel: '输出视图' } })
    expect(named.find('[role="tablist"]').attributes('aria-label')).toBe('输出视图')
  })

  it('点击 tab → emit update:modelValue 携带该 id；父组件回写后对应面板 hidden 翻转', async () => {
    const wrapper = mountTabs(threeTabs, 'a')
    await wrapper.find('#tab-b').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b'])
    // 模拟 v-model 父组件回写
    await wrapper.setProps({ modelValue: 'b' })
    expect(wrapper.find('#panel-b').attributes('hidden')).toBeUndefined()
    expect(wrapper.find('#panel-a').attributes('hidden')).toBeDefined()
    expect(wrapper.find('#panel-b').text()).toContain('b-内容')
  })

  it('ArrowRight 循环移动到下一 tab 并聚焦（自动激活；末尾回首个），面板随之翻转', async () => {
    // attachTo：focus() 在 happy-dom 中要求元素已连接 document——@vue/test-utils 默认挂载到
    // 游离 DOM 树（isConnected=false），focus 会提前返回（Pitfall 5 环境怪癖，探针实证）；
    // 「聚焦新 tab」是连接态行为，须 attachTo 才能真实触发。断言后 unmount 清理挂载点。
    const wrapper = mountTabs(threeTabs, 'c', { attachTo: document.body })
    try {
      await wrapper.find('#tab-c').trigger('keydown', { key: 'ArrowRight' })
      // 循环：末尾 → 首个
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['a'])
      // 自动激活模式：焦点已移至新 tab（纯 DOM 行为，不依赖父组件回写）
      expect(document.activeElement?.id).toBe('tab-a')
      await wrapper.setProps({ modelValue: 'a' })
      expect(wrapper.find('#panel-a').attributes('hidden')).toBeUndefined()
      expect(wrapper.find('#panel-c').attributes('hidden')).toBeDefined()
    } finally {
      wrapper.unmount()
    }
  })

  it('Home/End 跳到首/尾 tab', async () => {
    const wrapper = mountTabs(threeTabs, 'b')
    await wrapper.find('#tab-b').trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['a'])
    await wrapper.find('#tab-b').trigger('keydown', { key: 'End' })
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual(['c'])
  })

  it('单 tab 照常渲染且 aria 语义一致（zero-one-many：组件无数量分支）', () => {
    const wrapper = mountTabs([{ id: 'only', label: '唯一' }])
    // 未传 modelValue → 默认首 tab 活动态，roving/aria-selected 语义与多 tab 一致
    expect(wrapper.find('#tab-only').attributes('aria-selected')).toBe('true')
    expect(wrapper.find('#tab-only').attributes('tabindex')).toBe('0')
    expect(wrapper.find('#panel-only').exists()).toBe(true)
    expect(wrapper.find('#panel-only').attributes('hidden')).toBeUndefined()
    expect(wrapper.find('[role="tablist"]').attributes('aria-label')).toBe('标签页')
  })

  it('tablist 容器含 overflow-x-auto、tab 含 whitespace-nowrap（超宽水平滚动不换行，UI-SPEC overflow 行）', () => {
    const wrapper = mountTabs()
    expect(wrapper.find('[role="tablist"]').classes()).toContain('overflow-x-auto')
    expect(wrapper.find('#tab-a').classes()).toContain('whitespace-nowrap')
    // 活动态指示消费 accent（UI-SPEC：Tabs 活动态 cyan；02-REVIEW CR-01 文本/选中改经 accent）
    expect(wrapper.find('#tab-a').classes()).toContain('border-[var(--color-accent)]')
    expect(wrapper.find('#tab-a').classes()).toContain('text-[var(--color-accent)]')
  })

  it('非激活面板以 hidden 属性存在（节点常驻 DOM 而非移除/透明化——RESEARCH Anti-Patterns）', () => {
    const wrapper = mountTabs(threeTabs, 'a')
    const panelB = wrapper.find('#panel-b')
    expect(panelB.exists()).toBe(true)
    expect(panelB.attributes('hidden')).toBeDefined()
    expect(panelB.attributes('role')).toBe('tabpanel')
    expect(panelB.attributes('tabindex')).toBe('0')
  })

  it('44px 触控目标：tab 按钮类含 min-h-11（D-21 源码级）', () => {
    const wrapper = mountTabs()
    expect(wrapper.find('#tab-a').classes()).toContain('min-h-11')
  })
})
