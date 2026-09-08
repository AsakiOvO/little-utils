// src/styles/tokens.test.ts — D-20 改色即红双保险(WCAG 对比度 + tokens.css↔tokens.ts 同步)
// 算法来源:02-RESEARCH.md §Pattern 6(bottosson OKLab 公有领域矩阵 + WCAG 2.1 SC 1.4.3 公式)
// 失败修复指引见各断言消息:改 CSS 未改 TS 或反之——色值单点在 tokens.ts,同步后重跑。
// 路径解析用 import.meta.dirname(而非 new URL + import.meta.url:vitest 环境下后者非
// file 协议;vitest 原生支持 dirname,与 node:fs 搭配逐字读盘)。
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseOklch, tokens, type Oklch } from './tokens'

// ── WCAG 对比度算法(oklch 输入,与 02-RESEARCH §Pattern 6 矩阵逐系数一致)──────────

/** oklch → 线性 sRGB:OKLab(a=c·cos h, b=c·sin h)→ LMS′ 矩阵 → 立方 → LMS → linear sRGB 矩阵 */
function oklchToLinearSrgb(color: Oklch): [number, number, number] {
  const hRad = (color.h * Math.PI) / 180
  const a = color.c * Math.cos(hRad)
  const b = color.c * Math.sin(hRad)
  const l_ = color.l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = color.l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = color.l - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

/**
 * WCAG 相对亮度。矩阵输出的已是线性 sRGB;WCAG 公式 ((c+0.055)/1.055)^2.4 是对
 * 非线性 8-bit 值的解码,线性来源下 encode/decode 相互抵消 → 直接对线性值加权(等价形式)。
 */
function relativeLuminance(color: Oklch): number {
  const [r, g, b] = oklchToLinearSrgb(color)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 对比度 = (L1+0.05)/(L2+0.05),L1 为较亮者 */
function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(parseOklch(fg))
  const l2 = relativeLuminance(parseOklch(bg))
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

/** D-20 红线失败消息(修复指引内联,改色即红时可直接照做) */
function contrastFailHint(fg: string, bg: string, ratio: number): string {
  return (
    `色对 ${fg}(前景)vs ${bg}(背景)对比度 ${ratio.toFixed(2)}:1 < 4.5:1 —— ` +
    'D-20 红线。调色仅允许在 D-07 策略内(亮色加深降饱和;暗色值锁定 D-12 不得动),' +
    '并同步 tokens.css + tokens.ts(色值单点在 tokens.ts)后重跑'
  )
}

// ── 算法锚点 ────────────────────────────────────────────────────────────

describe('WCAG 对比度算法锚点(D-20 正确性哨兵)', () => {
  it('黑/白对比度精确等于 21.00:1', () => {
    expect(contrastRatio('oklch(0 0 0)', 'oklch(1 0 0)')).toBeCloseTo(21, 2)
  })

  it('对比度方向无关(前景/背景互换结果一致)', () => {
    expect(contrastRatio(tokens.dark['text-primary'], tokens.dark.bg)).toBe(
      contrastRatio(tokens.dark.bg, tokens.dark['text-primary']),
    )
  })
})

// ── 暗色主题色对(值锁定 D-12)────────────────────────────────────────

describe('暗色主题色对 ≥4.5:1(值锁定,D-12)', () => {
  const dark = tokens.dark

  it.each([
    ['text-primary/bg', dark['text-primary'], dark.bg],
    ['text-muted/bg', dark['text-muted'], dark.bg],
    ['text-primary/surface', dark['text-primary'], dark.surface],
    ['text-muted/surface', dark['text-muted'], dark.surface],
    ['neon-cyan/bg(霓虹文字用途)', tokens.neon.cyan, dark.bg],
    ['neon-magenta/bg(霓虹文字用途)', tokens.neon.magenta, dark.bg],
    ['neon-yellow/bg(霓虹文字用途)', tokens.neon.yellow, dark.bg],
    ['danger/surface', dark.danger, dark.surface],
    ['success/surface', dark.success, dark.surface],
    ['warning/surface', dark.warning, dark.surface],
  ] as const)('%s', (_label, fg, bg) => {
    const ratio = contrastRatio(fg, bg)
    expect(ratio, contrastFailHint(fg, bg, ratio)).toBeGreaterThanOrEqual(4.5)
  })
})

// ── 亮色主题色对(D-07 起点)──────────────────────────────────────────

describe('亮色主题色对 ≥4.5:1(D-07 浅冷灰底 + 深霓虹体系)', () => {
  const light = tokens.light

  it.each([
    ['text-primary/bg', light['text-primary'], light.bg],
    ['text-muted/bg', light['text-muted'], light.bg],
    ['text-primary/surface', light['text-primary'], light.surface],
    ['text-muted/surface', light['text-muted'], light.surface],
    ['neon-cyan-deep/bg(深霓虹文字用途)', light['neon-cyan-deep'], light.bg],
    ['neon-magenta-deep/bg(深霓虹文字用途)', light['neon-magenta-deep'], light.bg],
    ['neon-yellow-deep/bg(深霓虹文字用途)', light['neon-yellow-deep'], light.bg],
    ['danger/surface', light.danger, light.surface],
    ['success/surface', light.success, light.surface],
    ['warning/surface', light.warning, light.surface],
  ] as const)('%s', (_label, fg, bg) => {
    const ratio = contrastRatio(fg, bg)
    expect(ratio, contrastFailHint(fg, bg, ratio)).toBeGreaterThanOrEqual(4.5)
  })
})

// ── tokens.css ↔ tokens.ts 同步(单点双源,改色即红)───────────────────

describe('tokens.css ↔ tokens.ts 同步断言(D-20)', () => {
  const css = readFileSync(`${import.meta.dirname}/tokens.css`, 'utf8')
  const FIX_HINT = '改 CSS 未改 TS 或反之——色值单点在 tokens.ts,同步后重跑'

  it('原语层霓虹三色逐字一致', () => {
    expect(css, FIX_HINT).toContain(`--color-neon-cyan: ${tokens.neon.cyan};`)
    expect(css, FIX_HINT).toContain(`--color-neon-magenta: ${tokens.neon.magenta};`)
    expect(css, FIX_HINT).toContain(`--color-neon-yellow: ${tokens.neon.yellow};`)
  })

  it('亮色语义层全部变量逐字一致(含 D-10 背景/边框变体)', () => {
    expect(css, FIX_HINT).toContain(`--color-bg: ${tokens.light.bg};`)
    expect(css, FIX_HINT).toContain(`--color-surface: ${tokens.light.surface};`)
    expect(css, FIX_HINT).toContain(`--color-surface-raised: ${tokens.light['surface-raised']};`)
    expect(css, FIX_HINT).toContain(`--color-text-primary: ${tokens.light['text-primary']};`)
    expect(css, FIX_HINT).toContain(`--color-text-muted: ${tokens.light['text-muted']};`)
    expect(css, FIX_HINT).toContain(`--color-border: ${tokens.light.border};`)
    expect(css, FIX_HINT).toContain(`--color-danger: ${tokens.light.danger};`)
    expect(css, FIX_HINT).toContain(`--color-success: ${tokens.light.success};`)
    expect(css, FIX_HINT).toContain(`--color-warning: ${tokens.light.warning};`)
    expect(css, FIX_HINT).toContain(`--color-danger-bg: ${tokens.light['danger-bg']};`)
    expect(css, FIX_HINT).toContain(`--color-danger-border: ${tokens.light['danger-border']};`)
    expect(css, FIX_HINT).toContain(`--color-success-bg: ${tokens.light['success-bg']};`)
    expect(css, FIX_HINT).toContain(`--color-success-border: ${tokens.light['success-border']};`)
    expect(css, FIX_HINT).toContain(`--color-warning-bg: ${tokens.light['warning-bg']};`)
    expect(css, FIX_HINT).toContain(`--color-warning-border: ${tokens.light['warning-border']};`)
  })

  it('暗色语义层全部变量逐字一致(含 D-10 变体;D-12 值锁定)', () => {
    expect(css, FIX_HINT).toContain(`--color-bg: ${tokens.dark.bg};`)
    expect(css, FIX_HINT).toContain(`--color-surface: ${tokens.dark.surface};`)
    expect(css, FIX_HINT).toContain(`--color-surface-raised: ${tokens.dark['surface-raised']};`)
    expect(css, FIX_HINT).toContain(`--color-text-primary: ${tokens.dark['text-primary']};`)
    expect(css, FIX_HINT).toContain(`--color-text-muted: ${tokens.dark['text-muted']};`)
    expect(css, FIX_HINT).toContain(`--color-border: ${tokens.dark.border};`)
    expect(css, FIX_HINT).toContain(`--color-danger: ${tokens.dark.danger};`)
    expect(css, FIX_HINT).toContain(`--color-success: ${tokens.dark.success};`)
    expect(css, FIX_HINT).toContain(`--color-warning: ${tokens.dark.warning};`)
    expect(css, FIX_HINT).toContain(`--color-danger-bg: ${tokens.dark['danger-bg']};`)
    expect(css, FIX_HINT).toContain(`--color-danger-border: ${tokens.dark['danger-border']};`)
    expect(css, FIX_HINT).toContain(`--color-success-bg: ${tokens.dark['success-bg']};`)
    expect(css, FIX_HINT).toContain(`--color-success-border: ${tokens.dark['success-border']};`)
    expect(css, FIX_HINT).toContain(`--color-warning-bg: ${tokens.dark['warning-bg']};`)
    expect(css, FIX_HINT).toContain(`--color-warning-border: ${tokens.dark['warning-border']};`)
  })

  it('glow 亮暗两套声明就位(暗色为 Phase 1 原值 D-12;亮色为 D-08 降强度值)', () => {
    expect(css, FIX_HINT).toContain('--shadow-glow-cyan: 0 0 12px oklch(0.85 0.16 195 / 0.35);')
    expect(css, FIX_HINT).toContain('--shadow-glow-magenta: 0 0 12px oklch(0.72 0.24 330 / 0.3);')
    expect(css, FIX_HINT).toContain('--shadow-glow-cyan: 0 0 12px oklch(0.42 0.10 230 / 0.18);')
    expect(css, FIX_HINT).toContain('--shadow-glow-magenta: 0 0 12px oklch(0.40 0.16 330 / 0.16);')
  })

  it('.dark 块位于 @theme 之后(防 Pitfall 2 复发)且 color-scheme 双声明就位', () => {
    const themeStart = css.indexOf('@theme {')
    // \n 前缀锚定块选择器,避免误匹配 @custom-variant 行内的 &:where(.dark, ...)
    const darkBlockStart = css.search(/\n\.dark\s*\{/)
    expect(themeStart).toBeGreaterThanOrEqual(0)
    expect(darkBlockStart).toBeGreaterThan(themeStart)
    expect(css).toMatch(/:root\s*\{[^}]*color-scheme:\s*light/)
    expect(css).toMatch(/\.dark\s*\{[^}]*color-scheme:\s*dark/)
  })

  it('组件层 --color-focus 声明就位(D-19 焦点环语义角色,亮暗同值)', () => {
    expect(css).toContain('--color-focus: var(--color-neon-cyan);')
  })

  it('D-07 深霓虹三色亮色声明与 tokens.ts light 组逐字一致(02-REVIEW CR-01 收口)', () => {
    expect(css, FIX_HINT).toContain(`--color-neon-cyan-deep: ${tokens.light['neon-cyan-deep']};`)
    expect(css, FIX_HINT).toContain(`--color-neon-magenta-deep: ${tokens.light['neon-magenta-deep']};`)
    expect(css, FIX_HINT).toContain(`--color-neon-yellow-deep: ${tokens.light['neon-yellow-deep']};`)
  })

  it('accent 语义角色按模式分流(亮=deep / 暗=原语),且亮色声明先于 .dark(源顺序纪律)', () => {
    expect(css).toContain('--color-accent: var(--color-neon-cyan-deep);')
    expect(css).toContain('--color-accent-magenta: var(--color-neon-magenta-deep);')
    expect(css).toContain('--color-accent-yellow: var(--color-neon-yellow-deep);')
    expect(css).toContain('--color-accent: var(--color-neon-cyan);')
    expect(css).toContain('--color-accent-magenta: var(--color-neon-magenta);')
    expect(css).toContain('--color-accent-yellow: var(--color-neon-yellow);')
    // 源顺序纪律:亮色 :root 声明必须先于 .dark 覆盖(同特异性靠源顺序,tokens.css 内注释同纪律)
    const lightAccent = css.indexOf('--color-accent: var(--color-neon-cyan-deep);')
    const darkBlockStart = css.search(/\n\.dark\s*\{/)
    expect(lightAccent).toBeGreaterThanOrEqual(0)
    expect(darkBlockStart).toBeGreaterThan(lightAccent)
  })
})

// ── parseOklch 纯函数 ──────────────────────────────────────────────────

describe('parseOklch', () => {
  it('解析 oklch 字符串为 l/c/h 数值', () => {
    expect(parseOklch('oklch(0.85 0.16 195)')).toEqual({ l: 0.85, c: 0.16, h: 195 })
  })

  it('容忍前后与括号内多余空白', () => {
    expect(parseOklch('  oklch( 0.2 0.025 260 )  ')).toEqual({ l: 0.2, c: 0.025, h: 260 })
  })

  it('非法输入抛出带原文的错误', () => {
    expect(() => parseOklch('not-a-color')).toThrow(/not-a-color/)
  })
})
