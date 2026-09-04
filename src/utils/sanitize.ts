// src/utils/sanitize.ts — ARCH-04 全站唯一 HTML 消毒入口
//
// 纪律：
// - 禁止手写正则过滤标签（Don't Hand-Roll）：DOMPurify（cure53）是唯一合法消毒器
// - 函数纯、无 Vue 依赖、错误不裸抛（输入非字符串按空串处理）
// - 无 DOM 环境（vite-ssg 预渲染 / Node 测试）退化为纯转义，构建期不失败（T-01-08）
//   分支判断在每次调用时进行（typeof window 检查），而非模块加载期
//
// [CITED: github.com/cure53/DOMPurify README — Node 中需显式传 jsdom window；
//  浏览器/happy-dom 环境自动绑定 window]
import DOMPurify from 'dompurify'

/**
 * 仅放行 https?/mailto/tel 的 URI 白名单——javascript:/data: 等伪协议全部剥离。
 */
const ALLOWED_URI_REGEXP = /^(?:https?|mailto|tel):/i

/**
 * 消毒任意 HTML 字符串（全站唯一 HTML 字符串出口的内部实现）。
 * 渲染侧必须经 src/ui/safe-html.vue（SafeHtml 组件）消费本函数返回值。
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof dirty !== 'string') return ''
  if (typeof window === 'undefined') return escapeHtml(dirty)
  return DOMPurify.sanitize(dirty, { ALLOWED_URI_REGEXP })
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/**
 * 五字符 HTML 转义（& < > " '）——无 DOM 环境的退化路径与纯文本转义通用。
 */
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c)
}
