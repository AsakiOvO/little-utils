// src/seo/index.ts — SEO 纯函数生成器（ARCH-03，Plan 03-02 Task 1）
// 决策引用：D-03（robots.txt 全放开抓取）/ D-12（域名 SITE_URL 单源，四消费方之一）。
// 协议来源：sitemaps.org 最小集——必选 urlset/url/loc；lastmod/changefreq/priority
// 可选且 Google 已声明忽略，一律不生成。loc 须 XML 实体转义（& → &amp;，T-03-02）。
// 文件必须 Node 安全：纯函数、零 import、零浏览器 API（document/window/fetch）——
// 构建脚本（vite.config.ts onFinished）可直接 import，vitest 可单测。
// tool.path 形态约束（/ 开头、无 //）由 assertRegistryInvariants 保证，此处不重复校验。

/** 生成 sitemap.xml 内容：urlset 最小集，每路径一行 url/loc，URL = siteUrl + path */
export function buildSitemapXml(paths: string[], siteUrl: string): string {
  const urls = paths
    .map((p) => `  <url><loc>${siteUrl}${p.replace(/&/g, '&amp;')}</loc></url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

/** 生成 robots.txt 内容：全放开抓取（D-03）+ Sitemap 行从 siteUrl 派生（D-12） */
export function buildRobotsTxt(siteUrl: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
}
