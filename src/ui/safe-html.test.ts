// @vitest-environment jsdom
// src/ui/safe-html.test.ts — SafeHtml 唯一出口组件级断言（ARCH-04 / T-01-01）
// 挂载注入载荷后：组件 DOM 内不存在可执行节点（无 script 元素、无 on* 事件属性）。
// jsdom 回退原因同 src/utils/sanitize.test.ts（A4：happy-dom 20.13.2 与 DOMPurify 3.4.14
// 的 Node.prototype.nodeName 缓存 getter 不兼容，详见 01-03-SUMMARY）。
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SafeHtml from './safe-html.vue'

/** 遍历容器内所有元素的属性，断言不存在 on* 开头的事件属性 */
function assertNoEventHandlerAttributes(container: Element): void {
  const all = container.querySelectorAll('*')
  for (const el of Array.from(all)) {
    for (const attr of Array.from(el.attributes)) {
      expect(
        attr.name.toLowerCase().startsWith('on'),
        `元素 <${el.tagName.toLowerCase()}> 携带事件属性 ${attr.name}`,
      ).toBe(false)
    }
  }
}

describe('SafeHtml（全站唯一 v-html 出口）', () => {
  it('挂载含 script 标签与 img onerror 载荷后，DOM 内无可执行节点', () => {
    const wrapper = mount(SafeHtml, {
      props: {
        html: '<script>alert(1)</script><img src=x onerror=alert(1)>',
      },
    })

    // 无 script 元素
    expect(wrapper.element.querySelector('script')).toBeNull()
    // 无 on* 开头的事件属性
    assertNoEventHandlerAttributes(wrapper.element)
    // 载荷不以外联脚本/伪协议形式存活
    expect(wrapper.html()).not.toContain('javascript:')
  })

  it('挂载含 javascript: 伪协议与内联 onclick 载荷后，无可执行节点', () => {
    const wrapper = mount(SafeHtml, {
      props: {
        html: '<a href="javascript:alert(1)">x</a><div onclick="alert(1)">y</div>',
      },
    })

    expect(wrapper.html()).not.toContain('javascript:')
    assertNoEventHandlerAttributes(wrapper.element)
  })

  it('无害文本与基本标记正常渲染（不误杀）', () => {
    const wrapper = mount(SafeHtml, {
      props: { html: '<p>正常 <b>文本</b></p>' },
    })

    expect(wrapper.element.querySelector('p')).not.toBeNull()
    expect(wrapper.element.querySelector('b')?.textContent).toBe('文本')
    expect(wrapper.text()).toContain('正常')
  })
})
