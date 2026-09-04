// src/composables/useCopy.test.ts — 全站复制基建回归测试（成功标准 #4）
// VueUse 14.4.0 useClipboard 真实语义:
//   - legacy:true 时 isSupported 恒为 true(保证降级可用);降级是内部路径切换
//     (clipboard.write 失败/Clipboard API 缺失 → document.execCommand('copy'))
//   - copy 路径由 navigator.permissions.query 状态决定('granted'/'prompt' 走 API)
// happy-dom 环境:navigator 无 clipboard/permissions,document 无 execCommand——
// Clipboard API 路径测试以 defineProperty 注入,legacy 路径测试 mock execCommand。
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCopy } from './useCopy'

type MockFn = ReturnType<typeof vi.fn>

function patchNavigator(prop: string, value: unknown): void {
  Object.defineProperty(window.navigator, prop, { value, configurable: true })
}

function unpatchNavigator(prop: string): void {
  delete (window.navigator as unknown as Record<string, unknown>)[prop]
}

describe('useCopy（Clipboard API 可用路径）', () => {
  let write: MockFn
  let query: MockFn

  beforeEach(() => {
    vi.useFakeTimers()
    write = vi.fn(() => Promise.resolve())
    // permissionStatus 对象需具备 EventTarget 形状(usePermission 会监听 'change')
    query = vi.fn(() =>
      Promise.resolve({
        state: 'granted',
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    )
    patchNavigator('clipboard', { write })
    patchNavigator('permissions', { query })
    // happy-dom 无 ClipboardItem(API 路径 createClipboardItem 需要),stub 空构造器
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
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('isSupported 为 true，copy 走 clipboard.write 且 copied 翻转为 true', async () => {
    const { copy, copied, isSupported } = useCopy()
    // flush permissions.query 微任务链(状态决定 copy 路径)
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(isSupported.value).toBe(true)
    expect(copied.value).toBe(false)

    await copy('hello')

    expect(write).toHaveBeenCalledTimes(1)
    expect(copied.value).toBe(true)
  })

  it('copy 后 copied 翻转为 true，copiedDuring(1500ms) 窗口后复位', async () => {
    const { copy, copied } = useCopy()
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    await copy('hello')
    expect(copied.value).toBe(true)

    // 窗口内保持 true（1499ms < copiedDuring 1500）
    vi.advanceTimersByTime(1499)
    expect(copied.value).toBe(true)

    // 窗口结束（第 1500ms）复位
    vi.advanceTimersByTime(1)
    expect(copied.value).toBe(false)
  })
})

describe('useCopy（legacy 降级路径:无 Clipboard API）', () => {
  let execCommand: MockFn

  beforeEach(() => {
    vi.useFakeTimers()
    // 不注入 clipboard → isClipboardApiSupported=false → copy 内部走 execCommand 降级
    // legacy:true 的契约意义:isSupported 恒 true,复制能力始终可用
    execCommand = vi.fn(() => true)
    document.execCommand = execCommand as unknown as typeof document.execCommand
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('无 Clipboard API 时 copy 经 execCommand 降级仍可调用且不抛异常', async () => {
    const { copy, copied, isSupported } = useCopy()
    expect(isSupported.value).toBe(true) // legacy:true 语义:恒可用（降级在 copy 内部切换）

    await expect(copy('world')).resolves.toBeUndefined()
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(copied.value).toBe(true)
  })
})
