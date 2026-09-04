// @vitest-environment jsdom
// src/utils/sanitize.test.ts — ARCH-04 注入样本回归集（CONTEXT <specifics> 验收标准的自动化形态）
// 验收标准原文：粘贴含 <script>/<img onerror> 的内容仅渲染为纯文本，不执行任何脚本。
// 无 DOM 环境（vite-ssg 构建 / Node 测试）退化分支为显式覆盖目标（威胁 T-01-08）。
import { afterEach, describe, expect, it, vi } from 'vitest'
import { escapeHtml, sanitizeHtml } from './sanitize'

describe('sanitizeHtml（注入样本集）', () => {
  it('Test 1: <script> 标签被中和，无害文本保留', () => {
    const out = sanitizeHtml('<script>alert(1)</script>hello')
    expect(out.toLowerCase()).not.toContain('<script')
    expect(out).not.toContain('alert(1)')
    expect(out).toContain('hello')
  })

  it('Test 2: <img onerror> 事件属性被剥离，输出不可执行（img 残留与否不断言）', () => {
    const out = sanitizeHtml('<img src=x onerror=alert(1)>')
    expect(out.toLowerCase()).not.toContain('onerror')
    expect(out).not.toContain('alert(1)')
  })

  it('Test 3: javascript: 伪协议 href 被剥离（ALLOWED_URI_REGEXP 仅放行 https?/mailto/tel）', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">x</a>')
    expect(out.toLowerCase()).not.toContain('javascript:')
    // 锚文本是无害内容，不应被误杀
    expect(out).toContain('x')
  })

  it('Test 4: 内联 onclick 事件属性被剥离', () => {
    const out = sanitizeHtml('<div onclick="alert(1)">x</div>')
    expect(out.toLowerCase()).not.toContain('onclick')
    expect(out).not.toContain('alert(1)')
    expect(out).toContain('x')
  })

  it('Test 5: 无害文本与基本标记保留（不误杀）', () => {
    const out = sanitizeHtml('<p>正常 <b>文本</b></p>')
    expect(out).toContain('<p>')
    expect(out).toContain('<b>文本</b>')
    expect(out).toContain('正常')
  })
})

describe('escapeHtml（五字符映射表）', () => {
  it('& < > " \' 五类字符全部转义', () => {
    expect(escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#39;')
  })

  it('无特殊字符的输入原样返回', () => {
    expect(escapeHtml('plain text 123')).toBe('plain text 123')
  })
})

describe('sanitizeHtml（无 DOM 环境退化分支，T-01-08）', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('window 未定义（vi.stubGlobal）时走纯转义分支，输出不含任何尖括号标签', () => {
    // 分支判断在每次调用时进行（typeof window 检查），而非模块加载期——
    // 构建期（vite-ssg 在 Node 预渲染）即走此路径
    vi.stubGlobal('window', undefined)
    const out = sanitizeHtml('<img src=x onerror=alert(1)>')
    expect(out).not.toContain('<')
    expect(out).not.toContain('>')
    // 载荷以转义文本形态存在，不再是可解析标签
    expect(out).toContain('&lt;img')
    expect(out).toContain('onerror') // 纯转义保留原文字面量，但已不可执行
  })

  it('输入非字符串按空串处理返回 ""（service 纪律：错误不裸抛）', () => {
    expect(sanitizeHtml(undefined as unknown as string)).toBe('')
    expect(sanitizeHtml(null as unknown as string)).toBe('')
  })
})
