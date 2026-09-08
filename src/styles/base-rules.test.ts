// src/styles/base-rules.test.ts — base.css 全局规则内容级断言(SITE-05/STYL-03 自动化部分)
// 先例:scripts/check-chunks.mjs 的 readFileSync + 正则形态。happy-dom 不计算媒体查询
// (02-RESEARCH 假设 A5),故以规则存在性断言守护,行为正确性由 D-23 手动抽验负责。
// 失败修复指引:对应断言红 = base.css 缺失/改坏对应规则,请对照 02-01-PLAN Task 2 五处增改修复。
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// 路径解析用 import.meta.dirname(vitest 环境下 import.meta.url 非 file 协议)
const css = readFileSync(`${import.meta.dirname}/base.css`, 'utf8')

describe('base.css 全局基线规则(内容级断言)', () => {
  it('原生输入控件 16px 兜底,input/select/textarea 三选择器一体(D-21/Pitfall 4,防 iOS 聚焦缩放)', () => {
    expect(css).toMatch(/input\s*,\s*select\s*,\s*textarea\s*\{[^}]*font-size:\s*16px/)
  })

  it('reduced-motion 全局中和块存在且四项压缩属性齐备(D-22;Phase 6 装饰动画天然被覆盖)', () => {
    const media = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\n\}/)
    expect(media, '缺少 @media (prefers-reduced-motion: reduce) 全局中和块(D-22)').not.toBeNull()
    const block = media?.[0] ?? ''
    expect(block).toContain('animation-duration: 0.01ms')
    expect(block).toContain('animation-iteration-count: 1')
    expect(block).toContain('transition-duration: 0.01ms')
    expect(block).toContain('scroll-behavior: auto')
  })

  it('全局 :focus-visible 焦点环就位且经组件层 --color-focus 消费(D-19/D-09,不直连原语)', () => {
    expect(css).toMatch(/:focus-visible[\s\S]{0,200}?outline[\s\S]{0,200}?var\(--color-focus\)/)
  })

  it('主题瞬切 .theme-switching 中和规则就位,与 plan 02-02 useThemeMode 挂类/双 rAF 移除配对(D-11/Pitfall 3)', () => {
    expect(css).toMatch(/\.theme-switching[^{]*\{[^}]*transition:\s*none\s*!important/)
  })

  it('html 规则不再硬编码颜色方案(color-scheme 单源:tokens.css :root/.dark 兜底 + plan 02-02 JS 双写)', () => {
    expect(css).not.toMatch(/html\s*\{[^}]*color-scheme/)
  })
})
