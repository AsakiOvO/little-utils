// src/tools/json-formatter/components/cm-theme.ts —— CodeMirror 6 亮/暗双主题模块(D-06,RESEARCH §Pattern 4)
// 懒加载边界:CM 包仅被本组件(CodeMirrorJson.vue)静态 import → 只落进 json-formatter 工具 chunk;
//   共享层(ui/composables/utils/pages/layouts)出现任何引用即违反 ARCH-02(Pitfall 2)。
//   主题模块在本文件,仅本工具目录可 import —— 上移共享层即违反 T-02-09:
//   check-chunks 首包可达集零 CM 断言 + 放错目录即 type-check import 失败,双防线兜底。
// 色值来源:src/styles/tokens.ts 字面 oklch 字符串(D-20 色值单点,与对比度单测同源),
//   非 var() —— CSS 变量字符串在 theme spec 中未经官方确认(RESEARCH A3 已绕开)。
import { EditorView } from 'codemirror'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { tokens } from '../../../styles/tokens'
import type { Extension } from '@codemirror/state'

/** 编辑器 chrome(底色/gutter/行高亮/选区)对齐语义令牌:dark 取 tokens.dark,亮取 tokens.light(D-06) */
function chrome(dark: boolean): Extension {
  const c = dark ? tokens.dark : tokens.light
  return EditorView.theme(
    {
      '&': { backgroundColor: c.surface, color: c['text-primary'] },
      '.cm-gutters': { backgroundColor: c.surface, border: 'none', color: c['text-muted'] },
      '.cm-activeLine': { backgroundColor: c['surface-raised'] },
      '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: c['surface-raised'],
      },
      '&.cm-focused': { outline: 'none' }, // 焦点环交宿主容器统一 focus-visible(D-19)
    },
    { dark },
  )
}

/** 语法高亮:深霓虹三色 + 中性色(D-06 契约)—— 暗色取霓虹原语,亮色取 D-07 深霓虹 *-deep */
function highlight(dark: boolean): Extension {
  const neon = dark
    ? { cyan: tokens.neon.cyan, magenta: tokens.neon.magenta, yellow: tokens.neon.yellow }
    : {
        cyan: tokens.light['neon-cyan-deep'],
        magenta: tokens.light['neon-magenta-deep'],
        yellow: tokens.light['neon-yellow-deep'],
      }
  const muted = dark ? tokens.dark['text-muted'] : tokens.light['text-muted']
  return syntaxHighlighting(
    HighlightStyle.define([
      { tag: t.propertyName, color: neon.cyan },
      { tag: t.string, color: neon.magenta },
      { tag: [t.number, t.bool, t.null], color: neon.yellow },
      { tag: [t.keyword, t.punctuation, t.operator], color: muted },
    ]),
  )
}

/** 亮/暗双主题工厂:chrome + 语法高亮打包成一个扩展数组,供 Compartment reconfigure 整体切换(D-06) */
export function createCmTheme(dark: boolean): Extension {
  return [chrome(dark), highlight(dark)]
}
