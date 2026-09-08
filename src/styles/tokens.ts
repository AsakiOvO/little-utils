// src/styles/tokens.ts — D-20 色值单点常量模块(TS 侧唯一 oklch 字面值真相源)
// 消费者:tokens.test.ts(D-20 改色即红双保险)、cm-theme(plan 02-05,CodeMirror 双主题)
// 数据来源:02-RESEARCH.md §Pattern 1(tokens.css 重构与色值)、§Pattern 6(对比度算法矩阵与测试锚点)
// 纪律:① 字符串值必须与 src/styles/tokens.css 对应声明逐字一致 —— 同步由 tokens.test.ts 守护,
//        改 CSS 未改 TS 或反之即红(色值单点在 tokens.ts,同步后重跑);
//       ② 禁止引入第三方色彩库(culori/colorjs.io 等,Don't Hand-Roll + 零新依赖纪律),
//        oklch 解析用本模块 parseOklch 纯函数。

/** oklch 三分量(l 亮度 0-1,c 色度,h 色相 0-360) */
export interface Oklch {
  l: number
  c: number
  h: number
}

/** 全站色值字面量(暗色霓虹原语 + 亮暗两套语义层,与 tokens.css 逐字一致) */
export const tokens = {
  /** 原语层霓虹三色(暗色血统原值,D-12 锁定;亮色深霓虹见 light 组 *-deep 键,D-07) */
  neon: {
    cyan: 'oklch(0.85 0.16 195)',
    magenta: 'oklch(0.72 0.24 330)',
    yellow: 'oklch(0.92 0.19 105)',
  },
  /** 语义层 · 暗色(值锁定 D-12,与 tokens.css .dark 块逐字一致) */
  dark: {
    bg: 'oklch(0.16 0.02 260)',
    surface: 'oklch(0.2 0.025 260)',
    'surface-raised': 'oklch(0.24 0.03 260)',
    'text-primary': 'oklch(0.93 0.01 260)',
    'text-muted': 'oklch(0.65 0.02 260)',
    border: 'oklch(0.3 0.03 260)',
    danger: 'oklch(0.65 0.19 25)',
    success: 'oklch(0.75 0.15 150)',
    warning: 'oklch(0.80 0.15 85)',
    'danger-bg': 'oklch(0.28 0.05 25)',
    'danger-border': 'oklch(0.45 0.12 25)',
    'success-bg': 'oklch(0.26 0.04 150)',
    'success-border': 'oklch(0.45 0.09 150)',
    'warning-bg': 'oklch(0.28 0.05 85)',
    'warning-border': 'oklch(0.48 0.10 85)',
  },
  /** 语义层 · 亮色(D-07 起点值,与 tokens.css @theme 亮色语义逐字一致) */
  light: {
    bg: 'oklch(0.97 0.008 260)',
    surface: 'oklch(0.99 0.004 260)',
    'surface-raised': 'oklch(0.94 0.01 260)',
    'text-primary': 'oklch(0.24 0.02 260)',
    'text-muted': 'oklch(0.46 0.02 260)',
    border: 'oklch(0.88 0.01 260)',
    danger: 'oklch(0.50 0.19 25)',
    success: 'oklch(0.45 0.12 150)',
    warning: 'oklch(0.42 0.11 85)',
    'danger-bg': 'oklch(0.96 0.015 25)',
    'danger-border': 'oklch(0.75 0.10 25)',
    'success-bg': 'oklch(0.96 0.025 150)',
    'success-border': 'oklch(0.72 0.08 150)',
    'warning-bg': 'oklch(0.96 0.035 85)',
    'warning-border': 'oklch(0.72 0.09 85)',
    /** D-07 深霓虹三色(亮色下霓虹加深降饱和;文字用途受 D-20 ≥4.5:1 约束) */
    'neon-cyan-deep': 'oklch(0.42 0.10 230)',
    'neon-magenta-deep': 'oklch(0.40 0.16 330)',
    'neon-yellow-deep': 'oklch(0.40 0.10 70)',
  },
} as const

export type NeonTokens = typeof tokens.neon
/** 亮/暗语义色组共用形状(键集合一致) */
export type ThemeColorTokens = typeof tokens.dark | typeof tokens.light

/** 解析 oklch(...) 字符串为三分量(供对比度测试等纯计算场景;非法输入抛错并带原文) */
export function parseOklch(input: string): Oklch {
  const match = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(input.trim())
  if (!match) {
    throw new Error(`无法解析 oklch 字符串: ${input}`)
  }
  const [, l, c, h] = match
  if (l === undefined || c === undefined || h === undefined) {
    throw new Error(`无法解析 oklch 字符串: ${input}`)
  }
  return { l: Number(l), c: Number(c), h: Number(h) }
}
