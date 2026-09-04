// src/tools/json-formatter/index.ts — 工具自注册（RESEARCH §Pattern 1 第三块）
// 『加目录 + 注册表一行』接入模式（01-02 验证）：删目录即删工具，路由零手写。
import { Braces } from '@lucide/vue'
import { defineTool } from '../tool'

export default defineTool({
  name: 'JSON 格式化',
  path: '/json-formatter',
  description: 'JSON 校验、格式化与压缩，浏览器本地完成，长数字 ID 不丢精度',
  keywords: ['json', 'format', '格式化', '校验', '美化', '压缩'],
  category: 'developer',
  icon: Braces, // D-06：契约字段存组件引用
  component: () => import('./json-formatter.vue'), // ARCH-02：工具独立 chunk 边界
  createdAt: '2026-09-04',
})
