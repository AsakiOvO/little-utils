// src/tools/timestamp-converter/index.ts — 工具自注册（RESEARCH §Pattern 1 第三块）
// Phase 5/8 批量工具的 registration-module 样板：一个工具一个自包含目录，
// index.ts 内闭包引用自己的 .vue，删目录即删工具。
import { Clock } from '@lucide/vue'
import { defineTool } from '../tool'

export default defineTool({
  name: '时间戳转换',
  path: '/timestamp-converter',
  description: 'Unix 时间戳与日期时间双向转换，含时区显示，浏览器本地完成',
  keywords: ['时间戳', 'timestamp', 'unix', '日期', '时区', 'date'],
  category: 'developer',
  icon: Clock, // D-06：契约字段存组件引用（Task 1 人工闸门确认 @lucide/vue 后落地）
  component: () => import('./timestamp-converter.vue'),
  createdAt: '2026-09-04',
})
