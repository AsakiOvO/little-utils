// src/ui/CopyableText.test.ts —— CopyableText 契约测试（D-17/D-19/UI-SPEC Copywriting Contract）
// 环境说明：happy-dom 无 navigator.clipboard/permissions 与 ClipboardItem —— 沿用
// useCopy.test.ts 的注入模式（patchNavigator + stubGlobal + fake timers 成对）。
// VueUse 14.4.0 useClipboard(legacy:true) 真实语义：clipboard.write 失败被内部吞掉转
// execCommand 降级；copy() 仅在降级 document.execCommand 本身抛错时 reject ——
// 失败态用例即构造该唯一真实拒绝路径（双层降级仍失败），不 mock composable（护住 D-17 封装断言）。
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CopyableText from './CopyableText.vue'

function patchNavigator(prop: string, value: unknown): void {
  Object.defineProperty(window.navigator, prop, { value, configurable: true })
}

function unpatchNavigator(prop: string): void {
  delete (window.navigator as unknown as Record<string, unknown>)[prop]
}

let write: Mock<(items: unknown[]) => Promise<void>>
let query: Mock<
  () => Promise<{ state: string; addEventListener: () => void; removeEventListener: () => void }>
>

/** mount helper 收敛重复选项（Button.test.ts 纪律） */
function mountCopyable(props: { text: string; label?: string } = { text: 'hello' }) {
  return mount(CopyableText, { props })
}

/** flush 复制微任务链（permission query / copy promise）并等 Vue 重渲染 */
async function flushCopy(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0)
  await nextTick()
}

describe('CopyableText（Clipboard API 可用路径）', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    write = vi.fn<(items: unknown[]) => Promise<void>>(() => Promise.resolve())
    // permissionStatus 对象需具备 EventTarget 形状（usePermission 会监听 'change'）
    query = vi.fn<
      () => Promise<{ state: string; addEventListener: () => void; removeEventListener: () => void }>
    >(() =>
      Promise.resolve({
        state: 'granted',
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    )
    patchNavigator('clipboard', { write })
    patchNavigator('permissions', { query })
    vi.stubGlobal(
      'ClipboardItem',
      class FakeClipboardItem {
        constructor(public data: Record<string, string>) {}
      },
    )
  })

  afterEach(() => {
    unpatchNavigator('clipboard')
    unpatchNavigator('permissions')
    delete (document as unknown as Record<string, unknown>).execCommand
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('空内容：text="" → 复制按钮禁用且 aria-label 为「暂无内容可复制」（UI-SPEC 空内容态）', async () => {
    const wrapper = mountCopyable({ text: '' })
    await flushCopy()
    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('aria-label')).toBe('暂无内容可复制')
  })

  it('常态 aria-label 默认「复制内容」，可经 label prop 定制', async () => {
    const wrapper = mountCopyable({ text: 'hello', label: '复制格式化文本' })
    await flushCopy()
    expect(wrapper.find('button').attributes('aria-label')).toBe('复制格式化文本')
    const fallback = mountCopyable()
    expect(fallback.find('button').attributes('aria-label')).toBe('复制内容')
  })

  it('点击复制成功：按钮切成功态（cyan）、反馈 span 显示「已复制」，1500ms 后随 copied 复原为常态', async () => {
    const wrapper = mountCopyable({ text: 'hello world' })
    await flushCopy()
    const button = wrapper.find('button')
    await button.trigger('click')
    await flushCopy()

    // 成功态：按钮沿用 json-formatter 复制反馈语言（border/text neon-cyan），反馈可见
    expect(button.classes()).toContain('border-[var(--color-neon-cyan)]')
    expect(button.classes()).toContain('text-[var(--color-neon-cyan)]')
    const feedback = wrapper.find('span[aria-live="polite"]')
    expect(feedback.text()).toBe('已复制')
    expect(feedback.classes()).not.toContain('sr-only')

    // copiedDuring 1500ms 窗口结束后随 useCopy copied 自动复原
    vi.advanceTimersByTime(1500)
    await nextTick()
    expect(button.classes()).not.toContain('border-[var(--color-neon-cyan)]')
    expect(button.classes()).toContain('border-[var(--color-border)]')
    expect(feedback.text()).toBe('')
    expect(feedback.classes()).toContain('sr-only')
  })

  it('复制失败：双层降级仍失败（write 拒绝 + execCommand 抛错）→ 反馈 span 显示「复制失败,请手动复制」', async () => {
    write.mockRejectedValue(new Error('write denied'))
    // VueUse 14.4.0：API 路径失败 → 内部转 legacy execCommand 降级；降级本身抛错 → copy() reject
    document.execCommand = vi.fn<() => boolean>(() => {
      throw new Error('execCommand unavailable')
    }) as unknown as typeof document.execCommand
    const wrapper = mountCopyable({ text: 'hello' })
    await flushCopy()
    await wrapper.find('button').trigger('click')
    await flushCopy()

    const feedback = wrapper.find('span[aria-live="polite"]')
    expect(feedback.text()).toBe('复制失败,请手动复制')
    expect(feedback.classes()).toContain('text-[var(--color-danger)]')
    // 失败不进成功态
    expect(wrapper.find('button').classes()).not.toContain('border-[var(--color-neon-cyan)]')
  })

  it('backstop：1000+ 字文本展示区限高滚动（max-h-72/overflow-auto）且复制 payload 为全文（不截断于可见区）', async () => {
    const longText = `${'甲乙丙丁戊己庚辛壬癸'.repeat(120)}——末尾标记` // 1000+ 字
    const wrapper = mountCopyable({ text: longText })
    await flushCopy()

    const pre = wrapper.find('pre')
    expect(pre.exists()).toBe(true)
    expect(pre.classes()).toContain('max-h-72')
    expect(pre.classes()).toContain('overflow-auto')
    expect(pre.text()).toBe(longText)

    await wrapper.find('button').trigger('click')
    await flushCopy()
    expect(write).toHaveBeenCalledTimes(1)
    const item = write.mock.calls[0]?.[0]?.[0] as { data: Record<string, string> }
    expect(item.data['text/plain']).toBe(longText)
  })

  it('反馈 span 常驻 DOM 且 aria-live="polite"（常态 sr-only，节点先于内容存在）', () => {
    const wrapper = mountCopyable({ text: 'x' })
    const feedback = wrapper.find('span[aria-live="polite"]')
    expect(feedback.exists()).toBe(true)
    expect(feedback.classes()).toContain('sr-only')
  })

  it('展示区纯插值转义：含 <script>/事件属性的文本不产生对应节点（V5/T-02-06）', () => {
    const wrapper = mountCopyable({ text: '<script>alert(1)</script><img src=x onerror=alert(1)>' })
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('pre').text()).toContain('<script>alert(1)</script>')
  })

  it('44px 触控目标：按钮类含 min-h-11（D-21 源码级）', () => {
    const wrapper = mountCopyable({ text: 'x' })
    expect(wrapper.find('button').classes()).toContain('min-h-11')
  })
})
