// src/composables/useToolSeo.ts — 工具页标准 meta 集归拢层（D-05/D-06/D-09/D-12）
// 为什么不用 useHead 逐项手写：og 三件套（ogTitle/ogDescription/ogUrl）必须显式赋值
// （titleTemplate 只影响 <title>，不影响 ogTitle——RESEARCH Pitfall 5），useSeoMeta 将标准集
// 一次归拢；后续 Phase 5 新工具零成本接入（工具页组件单句调用 useToolSeo() 即可）。
// 数据源：route.meta.tool（src/router/routes.ts 把注册表 ToolMeta 放进 meta 的 SEO 消费点），
// description 复用 ToolMeta.description 原文（D-09 单一真相）；canonical/og:url 从 SITE_URL
// 单源派生（D-12），禁止硬编码域名。无 DOM 操作，SSG 预渲染期安全。
import { useHead, useSeoMeta } from '@unhead/vue'
import { useRoute } from 'vue-router'
import { SITE_URL } from '@/config/site'

export function useToolSeo() {
  const route = useRoute()
  const tool = route.meta.tool
  // 守卫：非工具路由（home/404 等无 meta.tool）误用时直接 return，不注入工具页 meta
  if (!tool) return
  useSeoMeta({
    title: tool.name, // titleTemplate 在 App 级补「 - little-utils」（D-06 半角连字符）
    description: tool.description, // D-09：复用 ToolMeta.description 原文
    ogTitle: tool.name, // 必须显式：titleTemplate 不影响 ogTitle（RESEARCH Pitfall 5）
    ogDescription: tool.description,
    ogUrl: `${SITE_URL}${tool.path}`, // D-12：从 SITE_URL 单源派生
  })
  useHead({
    link: [{ rel: 'canonical', href: `${SITE_URL}${tool.path}` }], // D-12
  })
}
