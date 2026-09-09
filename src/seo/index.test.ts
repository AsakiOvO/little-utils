// src/seo/index.test.ts — sitemap/robots 生成器单测（ARCH-03，Plan 03-02 Task 1）
// 被测对象为纯函数：零 DOM 依赖、Node 安全（构建脚本 vite.config.ts onFinished 直接 import）。
// 协议参照 sitemaps.org 最小集：必选 urlset/url/loc，可选字段 lastmod/changefreq/priority
// 一律不生成（Google 已声明忽略）；loc 内 XML 实体转义（& → &amp;）。
import { describe, expect, it } from 'vitest'
import { buildRobotsTxt, buildSitemapXml } from './index'

describe('buildSitemapXml — 基本形态（协议最小集）', () => {
  it("(['/', '/json-formatter'], 'https://x.test') → 含 xml 声明 + urlset xmlns + 两行 url/loc", () => {
    const xml = buildSitemapXml(['/', '/json-formatter'], 'https://x.test')
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml).toContain('<loc>https://x.test/</loc>')
    expect(xml).toContain('<loc>https://x.test/json-formatter</loc>')
  })

  it("(['/a&b'], 'https://x.test') → loc 内 & 渲染为 &amp;（XML 实体转义，T-03-02）", () => {
    const xml = buildSitemapXml(['/a&b'], 'https://x.test')
    expect(xml).toContain('<loc>https://x.test/a&amp;b</loc>')
    expect(xml).not.toContain('/a&b<')
  })

  it('最小集负断言 → 不含 lastmod/changefreq/priority（Google 已声明忽略）', () => {
    const xml = buildSitemapXml(['/'], 'https://x.test')
    expect(xml).not.toContain('lastmod')
    expect(xml).not.toContain('changefreq')
    expect(xml).not.toContain('priority')
  })
})

describe('buildRobotsTxt — 行格式（D-03 全放开 + D-12 Sitemap 行单源派生）', () => {
  it("('https://x.test') → User-agent: * / Allow: / / Sitemap: https://x.test/sitemap.xml 三行语义", () => {
    expect(buildRobotsTxt('https://x.test')).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://x.test/sitemap.xml\n',
    )
  })
})
