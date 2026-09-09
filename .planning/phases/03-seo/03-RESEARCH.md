# Phase 3: 预渲染 SEO 与部署管线 - Research

**Researched:** 2026-09-09
**Domain:** vite-ssg 每路由 SEO meta / sitemap+robots 生成 / EdgeOne Pages Git 部署 / 零外链与 200KB 体积门禁
**Confidence:** HIGH（本仓库构建产物实测验证 + EdgeOne 官方文档直抓 + Context7 官方库文档；EdgeOne 平台个别行为细节为 MEDIUM/ASSUMED）

## Summary

本阶段的所有构建期能力（meta 注入、sitemap/robots 生成、体积/外链/断言门禁）都建立在 Phase 1/2 已就绪的接缝上：`@unhead/vue` 3.4.0 + `createHead()` 已接入 `src/main.ts`，vite-ssg 28.3.0 的 `ssgOptions` 已预留三处接缝，`scripts/check-chunks.mjs` 已实现 chunk 可达闭包 BFS。**核心结论：全链路零新增 npm 依赖可实现**——sitemap/robots 用 vite-ssg 官方示例验证过的 `onFinished` 钩子 + `node:fs` 自研约 30 行；gzip 预算用 `node:zlib` `gzipSync` 复用 check-chunks 的可达闭包计算；外链/meta 断言为纯字符串扫描脚本。

本仓库实测（本阶段研究直接构建验证）：当前入口页首包 gzip 实测 **60.6 KB**（index.html 2.4KB + app.js 53.5KB + app.css 4.6KB），距 200KB 预算有 3.3 倍余量，预算硬卡无现实风险。当前预渲染工具页 HTML **只有首页 title**（无工具名/描述/canonical/og），`dist/` 无 sitemap.xml/robots.txt——本阶段要补的缺口与预期一致。

**最重要的一项冲突发现（ planner 必须处理）：** EdgeOne 官方文档明确，**项目域名/部署域名（默认域名）在中国大陆不能直接访问**——仅能通过 3 小时有效期的预览链接访问，超时返回 401 [CITED: pages.edgeone.ai/zh/document/domain-overview]。这与成功标准 3「无代理的大陆网络实测可打开」存在结构性张力：D-01「默认域名先上线」只满足全球（不含大陆）可达，大陆实测项在默认域名阶段**无法通过**。免备案的自定义域名绑定（全球可用区不含大陆）是唯一路径，需 planner 将「自定义域名是否提前进本阶段」升级为 checkpoint:human-verify。

**Primary recommendation:** meta 注入用 `useSeoMeta`（title 走 titleTemplate `%s - little-utils`，og 三件套显式设置）；sitemap.xml + robots.txt 由 `onFinished` 从注册表 + `SITE_URL` 单源生成（robots.txt 不放 `public/` 静态文件，避免硬编码域名违反 D-12）；新增独立 `scripts/check-dist.mjs`（复用 check-chunks 的 jiti 载注册表模式）承担 meta 断言 + sitemap 一致性 + 外链扫描 + gzip 预算四类断言；404 预渲染通过 includedRoutes 追加 `/404` 实现（产物 `dist/404.html`，EdgeOne 自动以 404 状态码服务）。

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**域名与上线路径**
- **D-01:** 暂用 EdgeOne 分配的默认域名（*.edgeone.app）先上线，自定义域名后绑定；绑定后 sitemap 域名重跑构建更新
- **D-02:** 未备案 → 大陆加速不可用，走 EdgeOne 全球（不含大陆）可用区先上线；备案通过后零代码切换大陆加速区
- **D-03:** robots.txt 允许全部抓取——默认域名阶段就让爬虫收录；换正式域名后 sitemap 重提交，旧域名靠 301/权重自然过渡
- **D-04:** 部署后人工向 Google Search Console / 百度站长平台提交 sitemap，纳入本阶段 human-check 验收

**SEO meta 体系**
- **D-05:** 每工具页 meta 标准集 = title + description + canonical + og:title/og:description/og:url；不做 twitter card 与 og:image
- **D-06:** title 格式「工具名 - little-utils」（半角连字符）；首页「little-utils — 开发者 & 办公工具箱」（沿用 index.html 现值）
- **D-07:** 不做 JSON-LD 结构化数据
- **D-08:** 404 页 meta robots noindex（预渲染 HTML 仍生成，爬虫不收录）；首页正常收录 + 定制 description
- **D-09:** 工具页 description 直接复用 `ToolMeta.description`（契约零变更，单一真相）
- **D-10:** 首页 description 由 Claude 起草（中文，含开发者/办公双线关键词），写入计划，验收时人工确认

**站点 URL 单源**
- **D-11:** `SITE_URL` 先填预期默认域名占位（如 https://little-utils.edgeone.app），首次部署后按实际分配值修正并重跑构建
- **D-12:** 四消费方单源：canonical + og:url + sitemap 全部 URL + robots.txt 的 Sitemap 行，统一从 `SITE_URL` 派生，禁止散落硬编码 — **Reversibility:** costly

**部署管线**
- **D-13:** 新建 GitHub 公开仓（本地仓库首次配置 remote，推 main）
- **D-14:** EdgeOne Pages Git 集成部署（控制台配置仓库 + 构建命令，产物 dist，推 main 即自动构建部署）
- **D-15:** EdgeOne 构建命令跑全门禁链：test + type-check + lint + check:chunks + build-only，任一失败不部署

**零外链与验收自动化**
- **D-16:** 字体保持系统字体栈（天然零外链零成本）；webfont 留 Phase 6，届时也必须自托管
- **D-17:** 200KB 首包预算硬卡：check 脚本超限非零退出，经 EdgeOne 构建命令链天然阻断部署
- **D-18:** 自动断言脚本扫 dist：每页 HTML 含非空 title/description（非 JS 空壳）、sitemap 路由与注册表一致、零第三方外链检测；跑进构建门禁链防回归
- **D-19:** 大陆可访问性由作者在大陆网络（无代理）人工实测，human-check 验收项

### Claude's Discretion

- sitemap 生成机制（vite.config.ts `onFinished` 已预留注释 vs 插件）
- check:chunks 扩展 vs 新增体积/外链/meta 断言脚本的落点划分
- `SITE_URL` 的具体文件位置与导出形式（方向 src/config/site.ts）
- og meta 注入实现（@unhead/vue useHead/useSeoMeta 具体用法）
- EdgeOne 构建命令链的具体写法（pnpm 命令编排）
- 首页 description 文案的具体内容（起草权，验收时人工确认）
- 404 noindex 与首页 meta 注入的组件层实现

### Deferred Ideas (OUT OF SCOPE)

- 自托管 webfont（赛博朋克展示字体）→ Phase 6 视觉强化（届时必须自托管，守零外链）
- EdgeOne 大陆加速区切换 → ICP 备案通过后执行（控制台操作，代码零差异）
- 自定义域名注册与绑定 → 默认域名上线后按需进行

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ARCH-03 | 构建期 SSG 预渲染每条工具路由为含 SEO meta 的静态 HTML，生成 sitemap.xml 与 robots.txt | 预渲染管线 Phase 1 已通（实测 dist/*.html 存在）；meta 注入用 useSeoMeta（Context7 官方文档验证 SSG 落盘行为）；sitemap/robots 用 onFinished 钩子自研（官方示例模式）；断言脚本保证非空 meta 与注册表一致性 |
| ARCH-05 | 部署管线（EdgeOne Pages + 自定义域名 + 构建产物零第三方外链 + bundle 体积预算检查） | EdgeOne 构建环境支持 Node 24.18.0 + pnpm 11（官方构建指南）；gzip 预算经 zlib gzipSync 实测可行（当前 60.6KB vs 200KB）；外链扫描脚本方案已验证（含 SVG xmlns 误报排除）；404.html 自动服务机制官方文档确认 |

</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 每路由 SEO meta 注入 | 构建期层（vite-ssg SSG 渲染） | 浏览器（客户端水合后路由切换时更新） | meta 数据源在组件 setup 的 useSeoMeta，SSR 字符串渲染时由 unhead 落进静态 HTML；SPA 导航时同一 composable 在客户端更新 |
| sitemap.xml / robots.txt 生成 | 构建期层（vite.config.ts onFinished） | — | 纯构建产物，从注册表 + SITE_URL 派生；无运行时 |
| SITE_URL 单源常量 | 源码共享层（src/config/site.ts） | 构建脚本（经 import 消费） | 四消费方全部 import 同一常量；文件必须 Node 安全（纯常量，无浏览器 API） |
| dist 断言（meta/sitemap/外链/预算） | 构建脚本层（scripts/*.mjs） | — | 产物层断言，Node 脚本；进构建门禁链 |
| 部署触发与门禁执行 | 外部服务（EdgeOne Pages 构建环境） | — | Git 推送触发，构建命令链在平台执行；代码外为控制台人工配置 |
| 404 noindex | 构建期层（预渲染 dist/404.html） | 平台（EdgeOne 以 404 状态码服务） | 预渲染产出 HTML + 组件内 useSeoMeta robots noindex；状态码由平台 404.html 机制提供 |

## Standard Stack

### Core（全部已安装，零新增依赖）

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite-ssg | 28.3.0（已有 devDep） | SSG 预渲染 + onFinished 钩子生成 sitemap/robots | onFinished 官方文档示例即「构建后写 dist/sitemap.xml」；版本 peer 支持 Vite 8 + vue-router 5（Phase 1 已核实） |
| @unhead/vue | 3.4.0（已有 dep） | useSeoMeta/useHead 注入 title/description/canonical/og | vite-ssg 官方搭配；client 子路径 createHead 已在 main.ts 接好 |
| node:zlib / node:fs | Node 24 内置 | gzipSync 计算首包体积、写 sitemap/robots | 零依赖（T-02-SC 供应链纪律：优先无依赖自研）；实测可用 |
| pnpm | 11.25.0（corepack 提供） | 包管理器 | EdgeOne Pages 官方支持 pnpm 6–11 [CITED: pages.edgeone.ai 构建指南] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jiti（已有 devDep） | ^2.7.0 | 构建脚本载入 TS 注册表模块 | 新断言脚本沿用 check-chunks.mjs 的既有模式 |
| vitest（已有 devDep） | ^4.1.x | sitemap/外链扫描等纯函数的单测 | 生成器逻辑抽成纯函数模块即可测 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| onFinished 自研 sitemap（约 30 行） | vite-ssg-sitemap / sitemap npm 包 | 插件引入第三方依赖违反 T-02-SC（新增依赖需 blocking-human 批准），且 our 需求（注册表同源 + SITE_URL 单源）自研更贴合；**选自研** |
| robots.txt 放 public/ 静态文件 | onFinished 与 sitemap 一同生成 | public/ 静态文件必须硬编码 Sitemap 行域名，违反 D-12 单源；**选生成** |
| 扩展 check-chunks.mjs | 新增独立 check-dist.mjs | check-chunks 职责是 CM chunk 拓扑断言（语义已稳定），混入 meta/外链/预算断言会稀释失败信息定位；**选新增独立脚本**，共享工具函数（可达闭包、jiti 载注册表）可复制或抽 scripts/lib |

**Installation:**

```bash
# 本阶段零新增 npm 依赖（T-02-SC 纪律下最优解）
# 如后续评估需安装任何包（含 vite-ssg-sitemap 类插件），必须先过 blocking-human 供应链闸门
```

**Version verification:** 本阶段不新增包，无需 registry 验证。EdgeOne 平台版本支持已对照官方构建指南（见 Environment Availability）。

## Package Legitimacy Audit

**本阶段计划零新增外部包**——sitemap/robots 生成、gzip 计算、外链/meta 扫描全部用 node: 内置模块 + 既有依赖实现。

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| （无新增包） | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none
**约束提醒：** 若 planner 或 executor 在执行中临时想引入任何新包（如 sitemap 生成插件），按 T-02-SC 必须先走 blocking-human 供应链闸门，不得绕过。

## Architecture Patterns

### System Architecture Diagram

```
[git push main]
     ↓
[EdgeOne Pages 构建环境: Node 24.18 + pnpm 11]
     ↓
[构建门禁链] test → type-check → lint → check:chunks → check:dist(新) → build-only
     ↓                                     ↑ 失败任一项 → 不部署
[vite-ssg build]
     ├─ 逐路由 SSR 渲染: useSeoMeta(meta) → unhead → <title>/<meta>/<link> 写进 HTML
     ├─ onBeforePageRender: 挂 class="dark"（Phase 2 既有，勿动）
     ├─ 产物: dist/index.html, dist/<tool>.html, dist/404.html(新)
     └─ onFinished(新):
          ├─ import { SITE_URL } from 'src/config/site'  ← 单源
          ├─ jiti 载注册表 tools[].path → <loc> 列表
          ├─ 写 dist/sitemap.xml（/ + 工具路由, 不含 404）
          └─ 写 dist/robots.txt（User-agent:* / Allow:/ / Sitemap: SITE_URL/sitemap.xml）
     ↓
[dist/ 部署到 EdgeOne 边缘]
     ├─ 已知路径 → 返回预渲染 HTML（爬虫可见 title/description）
     └─ 未命中路径 → 平台自动返回 dist/404.html（HTTP 404 状态码）
     ↓
[人工] Google Search Console / 百度站长提交 sitemap（D-04 human-check）
```

### Recommended Project Structure

```
src/
├── config/
│   └── site.ts              # ★ SITE_URL 唯一定义点（纯常量，Node 安全，四消费方 import）
├── seo/                     # ★ 纯函数 SEO 工具（可单测，构建脚本与组件共用）
│   └── index.ts             #   buildSitemapXml(paths, siteUrl) / buildRobotsTxt(siteUrl) 等
├── pages/
│   ├── home.vue             # 首页 useHead（D-06 全角标题 + D-10 description）
│   └── not-found.vue        # 404 页 useSeoMeta({ robots: 'noindex' })（D-08）
├── tools/<slug>/<slug>.vue  # 工具页 useSeoMeta（D-05 标准集，D-06/D-09 消费注册表）
└── composables/
    └── useToolSeo.ts        # （可选归拢）读 route.meta.tool 生成标准 meta 集，工具页/404 复用
scripts/
├── check-chunks.mjs         # 既有：CM chunk 拓扑断言（不动语义）
└── check-dist.mjs           # ★ 新增：meta 非空 / sitemap↔注册表一致 / 零外链 / gzip 预算
vite.config.ts               # ssgOptions: includedRoutes 追加 '/404'；onFinished 生成 sitemap/robots
public/                      # 仍放 favicon.ico；robots.txt 不放这里（D-12 单源，改由构建生成）
```

### Pattern 1: useSeoMeta 每工具页标准 meta 集（D-05/D-06/D-09）

**What:** 工具页组件 setup 中调用 useSeoMeta，数据全部来自 `route.meta.tool`（注册表元数据），title 用 titleTemplate 统一「%s - little-utils」。
**When to use:** 每个工具页 + 404 页；首页用 useHead 单独处理（D-06 保留全角破折号现值）。
**Example:**

```typescript
// src/composables/useToolSeo.ts — Source: Context7 /unjs/unhead（useSeoMeta 官方用法）
import { useRoute } from 'vue-router'
import { useSeoMeta } from '@unhead/vue'
import { SITE_URL } from '@/config/site'

export function useToolSeo() {
  const route = useRoute()
  const tool = route.meta.tool // src/router/routes.ts 已把注册表元数据放进 meta（SEO 消费点）
  useSeoMeta({
    title: tool.name,            // titleTemplate 在 App 级补 ' - little-utils'
    description: tool.description, // D-09: 复用 ToolMeta.description
    ogTitle: tool.name,          // 注意: titleTemplate 不影响 ogTitle，必须显式设置（unhead 官方文档）
    ogDescription: tool.description,
    ogUrl: `${SITE_URL}${tool.path}`, // D-12: 从 SITE_URL 派生
  })
  useHead({
    link: [{ rel: 'canonical', href: `${SITE_URL}${tool.path}` }],
  })
}
```

```typescript
// src/App.vue（或 layout 层）— title 模板只设一次
useHead({ titleTemplate: (t) => (t ? `${t} - little-utils` : 'little-utils') })
// 首页不套模板：直接 useHead({ title: 'little-utils — 开发者 & 办公工具箱' })（D-06 保留全角破折号）
```

**关键机制（已验证）**：unhead 在 SSG 渲染时把 setup 中的 useHead/useSeoMeta 输出写进静态 HTML head；官方文档明确建议构建后用 `rg '<title>|description|canonical|og:' dist/xx.html` 验证落盘 [CITED: github.com/unjs/unhead docs/head SPA guide]。项目现状：工具页预渲染 HTML 目前只有 index.html 模板的首页 title（本阶段研究实测 dist/json-formatter.html），接缝就绪、只差组件层注入。

### Pattern 2: onFinished 生成 sitemap.xml + robots.txt（D-03/D-12）

**What:** vite-ssg 全部路由渲染落盘后，从注册表 + SITE_URL 单源生成两个文件写入 dist。
**When to use:** vite.config.ts ssgOptions.onFinished；这是官方文档给 sitemap 生成的指名钩子。

```typescript
// vite.config.ts — Source: Context7 /antfu-collective/vite-ssg（onFinished 官方示例模式）
import { writeFile } from 'node:fs/promises'
import { buildSitemapXml, buildRobotsTxt } from './src/seo' // 纯函数，Node 安全

export default defineConfig({
  plugins: [/* 既有 */],
  ssgOptions: {
    includedRoutes(paths) {
      // 既有过滤 ':' 路由保留；追加 '/404' 触发 catch-all 渲染出 dist/404.html（D-08）
      // （'/404' 在 vue-router 中命中 /:pathMatch(.*)* → NotFound 组件 → noindex meta）
      return [...paths.filter((p) => !p.includes(':')), '/404']
    },
    onBeforePageRender(/* 既有暗色注入，勿动 */) { /* ... */ },
    async onFinished() {
      const jiti = createJiti(import.meta.url)
      const registry = await jiti.import('./src/tools/index.ts') // 双源消除：与 check-chunks 同模式
      const toolPaths = registry.tools.map((t: Tool) => t.path)
      await writeFile('dist/sitemap.xml', buildSitemapXml(['/', ...toolPaths], SITE_URL), 'utf8')
      await writeFile('dist/robots.txt', buildRobotsTxt(SITE_URL), 'utf8')
    },
  },
})
```

```typescript
// src/seo/index.ts — 纯函数（vitest 可测）
// sitemap 协议: 必选 urlset/url/loc; lastmod/changefreq/priority 可选 [CITED: sitemaps.org/protocol]
// 全文件 UTF-8; loc 须含协议; 同一 host; URL 须 XML 实体转义（& → &amp;）
export function buildSitemapXml(paths: string[], siteUrl: string): string {
  const urls = paths
    .map((p) => `  <url><loc>${siteUrl}${p}</loc></url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}
export function buildRobotsTxt(siteUrl: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n` // D-03 全放开; D-12 Sitemap 行从 SITE_URL 派生
}
```

**为何 robots.txt 不放 public/：** public/ 静态文件无法引用 SITE_URL（会硬编码域名），违反 D-12「四消费方单源、禁止散落硬编码」。构建生成使换域名 = 改一处常量重跑构建。

### Pattern 3: check-dist.mjs 断言脚本（D-17/D-18，构建门禁）

**What:** 构建后对 dist 做四类断言，任一失败 `exit 1`。复用 check-chunks 的两个已验证模式：jiti 载注册表、产物正则提取。

```javascript
// scripts/check-dist.mjs — 断言清单与实现要点（研究实测校准）
// a) 每页 meta 非空：逐 dist/*.html 断言 <title> 非空且非首页兜底值（工具页 title 必须含「 - little-utils」后缀）、
//    <meta name="description"> 非空（工具页值必须 === ToolMeta.description，D-09 单源断言）
//    404.html 特例：断言含 robots noindex（D-08），且不出现在 sitemap
// b) sitemap ↔ 注册表一致：jiti 载注册表取 paths，解析 dist/sitemap.xml 的 <loc>，
//    断言集合相等（双向：防漏收录 + 防多收录）；robots.txt 的 Sitemap 行 === SITE_URL + '/sitemap.xml'
// c) 零第三方外链：扫描每页 HTML 的资源加载属性（script src / link href / img src / iframe src / source src / video poster）
//    与 CSS 文件的 url(...)，任何 http(s) 绝对 URL 必须以 SITE_URL 开头
//    ★ 必须排除 xmlns/xmlns:xlink 属性值 —— 实测当前 dist 每页都含 "http://www.w3.org/2000/svg"
//      （SVG 命名空间标识符，非网络请求），naive 的全文 https?:// 正则会全部误报
// d) gzip 预算（D-17）：首包 = gzip(dist/index.html) + 入口页 HTML 直接引用集的 chunk 可达闭包
//    （BFS 逻辑与 check-chunks 一致）逐文件 gzipSync 求和；> 200*1024 字节即 VIOLATION exit 1
//    实测当前基线 60.6KB（index.html 2.4 + app.js 53.5 + app.css 4.6），余量 3.3 倍
const { gzipSync } = require('node:zlib')
const gz = (buf) => gzipSync(buf).length
```

**package.json 接线：** `"check:dist": "node scripts/check-dist.mjs"`，置于 build-only 之后（依赖产物）；EdgeOne 构建命令链（D-15）在 check:chunks 与 build-only 之间插入。注意 check:dist 必须在 build-only **之后**跑（onFinished 的 sitemap/robots 已落盘），即 EdgeOne 命令顺序为 `... check:chunks → build-only → check:dist`；本地 `pnpm build`（run-p type-check build-only）不含 check:dist，需在 build 脚本或 EdgeOne 命令中显式编排。

### Pattern 4: 404 预渲染与 EdgeOne 404 服务（D-08）

**What:** 现有 includedRoutes 过滤掉所有含 `:` 的路由（404 catch-all 未预渲染）。在过滤结果中追加 `/404`：vue-router 会将其匹配到 catch-all 路由 → NotFound 组件渲染 → 产物写为 `dist/404.html`（vite-ssg 平铺命名，已实测产物形态为平铺 `<route>.html`）。
**平台行为：** EdgeOne Makers 对 SSG/静态站点——构建输出目录存在 `404.html` 时自动识别，未命中任何路径的请求返回该文件内容**并附带 404 状态码** [CITED: cloud.tencent.com/document/product/1552/127386]。SPA 场景「禁止在根放 404.html」的警告不适用本项目：本站每路由已有真实静态 HTML（MPA 形态 + 水合），`/unknown` 返回 404.html 后浏览器加载 SPA，客户端 catch-all 路由照常接管渲染 NotFound，二者不冲突。
**noindex：** 在 NotFound.vue 加 `useSeoMeta({ robots: 'noindex, nofollow' })`——HTML 仍预渲染（爬虫取回可见内容但不收录），符合 D-08。

### Anti-Patterns to Avoid

- **robots.txt/sitemap 域名硬编码在 public/ 静态文件或散落脚本里**：违反 D-12；换域名（D-01 后续绑自定义域名）时四消费方改不齐。全部从 `src/config/site.ts` import。
- **用全文 `https?://` 正则做外链检测**：SVG `xmlns="http://www.w3.org/2000/svg"` 实测存在于每页产物，必误报；只扫资源加载属性 + CSS url()，显式排除 xmlns。
- **依赖 titleTemplate 生成 og:title**：unhead 官方文档明确 titleTemplate 只影响 `<title>`，og:title 必须显式设置（D-05 要求 og 三件套，漏设 ogTitle 会静默缺失）。
- **把 check:dist 塞进 check-chunks.mjs**：check-chunks 的 CM 拓扑断言语义已稳定且有 4 条已裁定的失败方向探针，混入新断言稀释定位；独立脚本 + 失败信息独立输出。
- **在 sitemapOptions 里手写工具路由清单**：sitemap 路由必须 jiti 实载注册表（check-chunks 已确立的双源消除先例），Phase 5 新工具零成本收录全靠这一点。

## Don't Hand-Roll

本领域反直觉：**项目的供应链纪律（T-02-SC）恰好要求「能自研则不装包」**，所以本阶段"不手造"的对象不是 npm 库，而是平台/协议细节：

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| XML 转义/协议细节 | 自由发挥的 sitemap XML 拼接 | 严格按 sitemaps.org 协议最小集（urlset/url/loc）+ 实体转义 | 协议必选标签只有 3 个，lastmod/changefreq/priority 可选且搜索引擎支持不一，多写无益 [CITED: sitemaps.org/protocol] |
| gzip 体积计算 | 自实现 deflate/读 vite build 输出表格解析 | `node:zlib` `gzipSync`（缓冲区级，与 CDN 传输压缩等价） | 实测可用；解析 vite 控制台输出脆弱且不包含 HTML |
| meta 落盘机制 | 在 onBeforePageRender 用正则手插 meta 标签 | useSeoMeta 组件层声明，unhead 负责渲染与水合 | 手插正则会与水合冲突、漏 og 转义；unhead 是该问题的标准解 |
| 404 状态码 | 前端 hack（JS 判断后改 status 不可能） | EdgeOne `dist/404.html` 约定（平台自动附 404 状态码） | 静态托管无法自定义状态码，平台约定是唯一正解 [CITED: 腾讯云 127386] |

**Key insight:** 本阶段所有"生成器"都只有 10–40 行，真正的复杂度在**断言脚本的误报/漏报边界**（SVG xmlns、404 特例、可达闭包复用）——把研究实测校准的边界条件写进计划比选库更重要。

## Runtime State Inventory

**不适用**——本阶段非 rename/refactor/migration。但有一项**部署平台侧状态**需要 planner 写成人工步骤（代码外）：
- EdgeOne Pages 控制台：项目创建、GitHub 仓库授权绑定、构建命令/输出目录/Node 版本设置、默认域名确认（SITE_URL 修正依据）。这些配置只存在于平台，git 里没有任何记录，验收时需人工核对截图/URL。
- GitHub 仓库：D-13 新建公开仓 + 本地 remote 首次配置。**本地环境无 gh CLI**（已探测），建仓为浏览器人工步骤。

## Common Pitfalls

### Pitfall 1: 默认域名大陆不可直连，成功标准 3 无法在默认域名阶段验收
**What goes wrong:** EdgeOne 官方明确：项目域名/部署域名在中国大陆不能直接访问，只能用 3 小时有效期预览链接（超时 401）[CITED: pages.edgeone.ai/zh/document/domain-overview]。
**Why it happens:** 默认域名共享平台的合规访问策略，与加速区域选择无关；「全球可用区（不含中国大陆）」免备案指的是**自定义域名**。
**How to avoid:** planner 在计划里显式拆分验收口径——SC-3 的「公网可访问」在默认域名下全球（非大陆）可达即可自动+human 验证；「无代理大陆实测可打开」（D-19）标记为**依赖自定义域名绑定后才能执行**的 human-check，或提前把自定义域名绑定（免备案）拉进本阶段。**这是 CONTEXT 决策与官方平台行为的冲突点，需用户在 planning 时确认取舍，不得静默降级。**
**Warning signs:** 验收时作者在大陆直开 *.edgeone.app 得到 401/无法访问，误判为部署失败。

### Pitfall 2: SITE_URL 占位值被首次部署固化进搜索引擎
**What goes wrong:** 首次部署时 dist 里的 canonical/og:url/sitemap 全是占位域名；若此时提交 sitemap（D-04），搜索引擎收录占位域名，换真域名后收录作废。
**Why it happens:** D-11 是「占位 → 首次部署后修正 → 重跑构建」的两段式，天然有一次带占位值的部署。
**How to avoid:** D-04 的 sitemap 提交（human-check）必须排在 SITE_URL 修正提交、重跑部署**之后**；planner 把顺序写死：首次部署 → 读实际域名 → 改 src/config/site.ts → 推送重部署 → 确认线上 sitemap/canonical 为真实域名 → 才提交搜索引擎。
**Warning signs:** sitemap.xml 里出现 edgeone.app 占位值却被提交到了 Search Console。

### Pitfall 3: 外链扫描误报 SVG 命名空间（本阶段研究实测发现）
**What goes wrong:** `grep 'https?://' dist/*.html` 实测命中 `http://www.w3.org/2000/svg`（每页都有，来自内联 SVG），naive 断言脚本永久红。
**Why it happens:** SVG 命名空间是 XML 标识符，不是网络请求；产物里还有 `xmlns:xlink` 同类。
**How to avoid:** 扫描器只提取**资源加载向量**：`<script src>`、`<link href>`、`<img src>`、`<iframe src>`、`<source src/srcset>`、`<video>/<audio> src`、`<use href/xlink:href>`、CSS `url()`；白名单 xmlns* 属性与 data:/#锚点。
**Warning signs:** 断言脚本在零外链站点上报数量固定的"w3.org 外链"。

### Pitfall 4: 404 路由被 includedRoutes 过滤，dist 无 404.html
**What goes wrong:** 现 includedRoutes 过滤 `p.includes(':')`，catch-all `/:pathMatch(.*)*` 不预渲染——D-08「预渲染 HTML 仍生成」落空，且 EdgeOne 未命中路径返回平台默认 404（无站点样式无 noindex）。
**How to avoid:** 过滤后追加 `'/404'`（见 Pattern 4）；check-dist 断言 dist/404.html 存在且含 noindex。注意 check-chunks 的 slug 推断逻辑（`relFromDist.split('/')[0]`）对 `404.html` 会得到 slug='404'，其中无 CM 无影响，无需改动。
**Warning signs:** 部署后 `curl -i https://site/nonexistent` 返回 200 或平台默认页。

### Pitfall 5: og:title 因 titleTemplate 静默缺失
**What goes wrong:** 只设 title + titleTemplate，开发者以为 og:title 自动同步——unhead 官方文档明确 titleTemplate 不影响 ogTitle [CITED: github.com/unjs/unhead titles guide]。
**How to avoid:** og:title/og:description/og:url 全部在 useSeoMeta 显式赋值（D-05 标准集恰好要求三个都设，恰好规避）；check-dist 断言每工具页 `og:title`/`og:url` 存在。
**Warning signs:** 分享调试器（或 curl grep og:）只见 og:description 不见 og:title。

### Pitfall 6: EdgeOne 构建环境版本错配
**What goes wrong:** 平台按 lock 文件自动选包管理器、按 .nvmrc 切 Node——但官方明确 **.nvmrc 切换不含包管理器** [CITED: pages.edgeone.ai 构建指南]；选到不满足 `engines`（^22.18.0 \|\| >=24.12.0）的 Node 版本（如 22.11.0/22.17.1）可能构建异常。
**How to avoid:** 控制台「项目设置 → Node.js 版本」显式选 **24.18.0**；仓库根**不要放 .nvmrc**（当前已确认不存在）；依赖 pnpm-lock.yaml 自动识别 pnpm（支持 6–11，本仓 11.25.0 在列）。
**Warning signs:** 构建日志显示 npm install 或 Node 22.11；engines 警告。

### Pitfall 7: sitemap 生成时机与本地/平台构建命令链不一致
**What goes wrong:** `pnpm build` 是 `run-p type-check "build-only {@}"`（并行），check:dist 若挂在 build 前段会读到旧 dist 或缺 sitemap。
**How to avoid:** 门禁链线性编排（npm-run-all `run-s`）：`test → type-check → lint → check:chunks → build-only → check:dist`；check:dist 只读 build-only 产物，必须殿后。EdgeOne 构建命令填同一条 run-s 链（D-15 + D-18 合并后的完整链）。
**Warning signs:** CI 上 check:dist 报 sitemap.xml 不存在但本地通过（执行顺序差异）。

## Code Examples

见 Architecture Patterns 1–4（useSeoMeta 标准集 / onFinished 生成器 / check-dist 断言 / 404 预渲染），均为官方文档来源或本仓库实测校准后的骨架。

补充——首页 meta（D-06/D-10 落点）：

```typescript
// src/pages/home.vue
useHead({
  title: 'little-utils — 开发者 & 办公工具箱', // D-06: 保留 index.html 现值（全角破折号）
  // D-10: description 由 Claude 起草，验收时人工确认（planner 在计划中写明文案）
  meta: [{ name: 'description', content: '<首页中文描述：开发者/办公双线关键词>' }],
})
// 注意 index.html 模板里的静态 <title> 保留作为无 JS 兜底；home.vue 的 useHead 与其同值（D-06）
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| unhead v1 全量导出 | v2/v3 子路径导出（@unhead/vue/client、/server） | 2024（v2 起） | 项目已用 /client（main.ts），SSG/水合行为正常；勿改回默认导出 |
| EdgeOne Pages 品牌名 | 官方文档现称 **EdgeOne Makers**（Pages 为旧称，文档域名 pages.edgeone.ai 仍有效） | 2026 | 检索文档/控制台时两个名字都可能出现，同一产品 |
| vite-ssg critters 内置 critical CSS | 新版本聚焦 SSG 本体 | 持续 | 本项目未启用 critters，与本阶段无关 |
| 手写 robots.txt 于 public/ | 构建 gen（域名单源） | 本阶段决策 D-12 | 换域名只改 src/config/site.ts |

**Deprecated/outdated:**
- `twitter:card` 等 twitter meta：X 已弃用，D-05 不做 twitter card 与生态方向一致。
- sitemap 的 changefreq/priority：Google 官方已声明忽略；最小集（loc）即可。

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 默认项目域名后缀为 `*.edgeone.app`（CONTEXT D-01/D-11 既有假设；官方文档只说"平台子域名"未确认精确后缀） | Standard Stack / Pitfall 2 | 低——D-11 本就要求首次部署后按实际分配值修正 SITE_URL，占位值不影响架构 |
| A2 | ICP 备案通过后切换大陆加速区为控制台配置操作、代码零改动（D-02 既有断言；官方文档确认加速区域是项目级配置项，但"同项目直接切换 vs 重建项目"的细节未在文档中核实） | Pitfall 1 / Open Questions | 低——切换发生在 Phase 3 之后（deferred），届时核实即可 |
| A3 | EdgeOne 构建超时 20 分钟（沿用 STACK.md 旧数据，本次未重新核实） | Standard Stack | 极低——本站构建 <1 分钟，余量巨大 |
| A4 | useSeoMeta 在 vite-ssg 渲染进程中（client 子路径 createHead）能正常落盘 meta（Context7 官方文档支持 + unhead SPA 指南建议 rg 验证，但 unhead 3.x + vite-ssg 28 组合的端到端行为以计划首个 fail-first 任务实证为准） | Pattern 1 | 中——若落盘失败需改用 /server 导出或 onPageRendered 钩子兜底；计划首个任务应是"最小 meta 落盘验证" |
| A5 | EdgeOne 免费层「全球可用区（不含中国大陆）」下自定义域名绑定对个人开放、无需备案（官方域名概览文档确认该区域"不要求工信部备案"，与 STACK.md 一致） | Pitfall 1 | 低 |

## Open Questions

1. **SC-3 大陆实测与 D-01 默认域名路径的冲突如何取舍？**（最重要）
   - What we know: 官方文档明确默认域名大陆不能直接访问（3h 预览链接，401）；免备案自定义域名（全球不含大陆）可获稳定访问。
   - What's unclear: 作者是否愿意在 Phase 3 就注册/绑定自定义域名（提前进本阶段），还是接受 SC-3 拆分为「默认域名阶段全球可达 + 大陆实测挂起至自定义域名绑定后」。
   - Recommendation: planning 时加 checkpoint:human-verify，由作者二选一；两条路径的代码工作量完全相同（SITE_URL 单源已就绪），差异只在验收顺序。
2. **404 页是否需要 canonical？** D-05 标准集针对工具页；404 noindex 页给 canonical 无意义。建议 404 只设 robots noindex + title，进计划时按此执行（discretion 已覆盖）。
3. **sitemap 是否包含 lastmod？** 可选字段；ToolMeta.createdAt 可派生但语义是"收录日"而非"修改日"。建议最小集（仅 loc），Phase 5+ 有真实更新语义再补。

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | 本地构建 + EdgeOne 构建环境 | ✓ 本地 24.18.0；EdgeOne 官方支持 24.18.0 [CITED: 构建指南] | 24.18.0 | EdgeOne 另有 22.21.1 满足 engines（备选） |
| pnpm | 包管理 | ✓（corepack 0.35.0 提供 11.25.0） | 11.25.0 | EdgeOne 构建环境预装 pnpm 11 |
| git | push 触发部署 | ✓ | 2.50.1 | — |
| GitHub 账号/仓库 | D-13 | ✓（账号侧作者持有） | — | — |
| gh CLI | 建仓自动化 | ✗ | — | 浏览器人工建仓（D-13 本就是人工步骤，无需 gh） |
| curl | SC-1 验收（meta 可见性） | ✓ | 系统自带 | — |

**Missing dependencies with no fallback:** 无。
**Missing dependencies with fallback:** gh CLI 缺失——建仓改为浏览器人工步骤（本来就在 D-13 的控制台操作清单内）。

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest ^4.1.x + happy-dom（172 个存量测试全绿） |
| Config file | vitest.config.ts（既有） |
| Quick run command | `corepack pnpm test:unit -- --run` |
| Full suite command | `corepack pnpm run-s test:unit type-check lint` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ARCH-03 | 每工具页预渲染 HTML 含非空 title/description/canonical/og | 产物断言（check-dist a） | `corepack pnpm build-only && node scripts/check-dist.mjs` | ❌ Wave 0 |
| ARCH-03 | sitemap 与注册表一致；robots Sitemap 行 = SITE_URL 派生 | 产物断言（check-dist b）+ 生成器纯函数单测 | 同上 + `pnpm vitest run src/seo` | ❌ Wave 0 |
| ARCH-03 | 404.html 存在且 noindex；不出现在 sitemap | 产物断言（check-dist a/b 特例） | 同上 | ❌ Wave 0 |
| ARCH-05 | 零第三方外链（资源加载向量扫描，排除 xmlns） | 产物断言（check-dist c） | 同上 | ❌ Wave 0 |
| ARCH-05 | 首包 gzip ≤ 200KB | 产物断言（check-dist d，gzipSync） | 同上 | ❌ Wave 0 |
| ARCH-03 | title 格式「工具名 - little-utils」；og 三件套显式 | 组件单测（useToolSeo/home meta） | `pnpm vitest run tests path`（就近 *.test.ts） | ❌ Wave 0 |
| ARCH-03 | SC-1 curl meta 可见 / SC-3 大陆实测 / D-04 提交 sitemap | manual-only（human-check，D-19/D-04 明确人工） | — | — |

### Sampling Rate

- **Per task commit:** `corepack pnpm vitest run`（快速）
- **Per wave merge:** 全门禁链 `run-s test:unit type-check lint check:chunks build-only check:dist`
- **Phase gate:** 全门禁链绿 + 部署后 curl 抽验（SC-1）+ human-check 清单

### Wave 0 Gaps

- [ ] `scripts/check-dist.mjs` + package.json `check:dist` 接线——covers ARCH-03/ARCH-05 产物断言
- [ ] `src/seo/index.ts`（纯函数生成器）+ `src/seo/index.test.ts`——covers sitemap/robots 生成单测
- [ ] `src/config/site.ts`（SITE_URL 单源）——Wave 0 首任务（四消费方依赖它）
- [ ] useToolSeo/home/not-found meta 组件层 + 就近测试——covers title 格式与 noindex

## Security Domain

`security_enforcement: true`（config.json），ASVS Level 1。

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | 纯前端无账户体系（项目约束） |
| V3 Session Management | no | 无会话 |
| V4 Access Control | no | 无服务端资源 |
| V5 Input Validation | **yes** | sitemap 生成器的 XML 实体转义（`&`→`&amp;`）；数据源全部为代码自有注册表（assertRegistryInvariants 已约束 path 形态），无用户输入进入 meta/sitemap |
| V6 Cryptography | no | 不涉密码学；HTTPS 由 EdgeOne 自动证书 |
| V14 Config | **yes** | 零第三方脚本原则延续（外链断言即供应链防线）；构建门禁链防"带病部署" |

### Known Threat Patterns for 纯前端静态站 + SSG 管线

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| 第三方资源投毒（CDN/字体/统计脚本） | Tampering/Elevation | D-18 零外链断言进门禁链（本阶段交付）；系统字体栈（D-16） |
| meta/og 内容注入（注册表值含引号/尖括号） | Tampering | unhead 负责属性转义（框架层）；注册表值来源代码 review；check-dist 值一致性断言 |
| sitemap XML 注入（path 特殊字符） | Tampering | 生成器实体转义 + assertRegistryInvariants 的 path 形态约束（`/` 开头、无 `//`） |
| 构建命令链被绕过（直接 push 产物） | Elevation | D-15 平台构建命令即唯一部署路径；仓库不存 dist（产物由平台构建生成） |

## Sources

### Primary (HIGH confidence)
- 本仓库构建实测（2026-09-09）：`pnpm build-only` 产物清单/形态（平铺 <route>.html）、入口页 gzip 60.6KB 实测、dist 工具页仅首页 title 现状、外链扫描命中 w3.org/2000/svg 误报源、node:zlib gzipSync 方案验证 — [VERIFIED: local build probe]
- `vite.config.ts:21-33`（ssgOptions 三接缝）、`src/main.ts:1-15`（createHead 已接）、`src/router/routes.ts:9-23`（meta.tool SEO 消费点）、`src/tools/tool.ts:7-23`（description 双用途契约）、`scripts/check-chunks.mjs:1-199`（BFS/jiti 模式）、`index.html:1-35`（FOUC 脚本与默认 title）— [VERIFIED: 本会话通读原文]
- Context7 /antfu-collective/vite-ssg（官方 README/docs）— onFinished sitemap 官方示例、onBeforePageRender/onPageRendered 签名、includedRoutes — [CITED: github.com/antfu-collective/vite-ssg README]
- Context7 /unjs/unhead（官方 repo docs）— useSeoMeta 键集、titleTemplate 不影响 ogTitle、client/server 子路径导出、构建产物 rg 验证法 — [CITED: github.com/unjs/unhead docs]
- sitemaps.org 协议（官方）— 必选/可选标签、UTF-8、实体转义、robots Sitemap 行 — [CITED: sitemaps.org/protocol]

### Secondary (MEDIUM confidence)
- EdgeOne Makers 官方文档（pages.edgeone.ai / cloud.tencent.com，2026-06 更新）— 构建环境 Node/pnpm 版本表、.nvmrc 不含包管理器警告、域名三类与大陆访问规则（3h 预览链接/401）、加速区域备案矩阵（全球不含大陆免备案）、edgeone.json SPA fallback、404.html 约定（SSG 附 404 状态码）— [CITED: pages.edgeone.ai/zh/document/build-guide; pages.edgeone.ai/zh/document/domain-overview; pages.edgeone.ai/zh/document/edgeone-json; cloud.tencent.com/document/product/1552/127386]

### Tertiary (LOW confidence)
- 无（所有 LOW 项已升级为 A1–A5 假设登记或 Open Question）

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 零新增依赖，全部组件已在 Phase 1/2 验证过
- Architecture: HIGH — 钩子/协议/平台行为均有官方一手来源，关键路径经本地构建实测
- Pitfalls: HIGH — Pitfall 3/4/6/7 均为本阶段实测或官方文档直证；Pitfall 1 为官方文档与 CONTEXT 决策的实证冲突

**Research date:** 2026-09-09
**Valid until:** 2026-10-09（30 天；EdgeOne 平台行为变化风险由 human-check 验收兜底）
