<!-- GSD:project-start source:PROJECT.md -->

## Project

**little-utils — 开发者 & 办公工具箱**

一个面向公网开放的纯前端静态工具箱网站，收集常用开发辅助与办公效率工具，帮助开发者（尤其是从事苏宁易购/电商开发的作者本人）和办公用户快速完成日常高频操作。所有工具在浏览器端本地完成计算，无需后端与数据库。界面采用赛博朋克《边缘行者》风格（霓虹 + 故障艺术 + HUD），首页与导航强风格化，工具操作区保持克制易读。

**Core Value:** 打开网站 → 几秒内通过分类或搜索找到所需工具 → 在浏览器端立即完成操作（格式化、转换、编码等），全程无需登录、无需上传数据到服务器。

### Constraints

- **架构**: 纯前端静态站，无后端、无数据库 — 部署简单、维护成本低、隐私友好
- **隐私**: 所有工具计算必须在浏览器端本地完成，不向服务器上传用户数据
- **风格**: 首页与导航强赛博朋克风格化，工具操作区必须克制易用（可用性优先于炫酷）
- **SEO**: 公网站点，每个工具需有独立 URL 与基础 SEO（meta/SSG）
- **协作流程**: 用户要求 3 类 agent 分工 — 调研（researcher）、开发（executor）、测试审查（code-reviewer + verifier）

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vue | 3.5.42（stable；3.6.0-rc.6 勿用于生产） | UI 框架 | 中文生态与中文文档第一梯队，与作者（电商行业前端）技术惯性一致；SFC 模型天然适配"每个工具一个组件/一个页面"的结构；官方脚手架 create-vue 3.23.0 开箱即得 TS+Vite+Router+Pinia 组合 |
| Vite | 8.2.2 | 构建工具 | Vue 官方钦定构建工具；dev 冷启动与 HMR 快；EdgeOne Pages 等托管平台均有原生 Vite 支持 |
| vite-ssg | 28.3.0 | SSG / 路由预渲染 | **满足"每工具独立 URL + SEO"的关键件**：构建时把每条路由渲染成完整静态 HTML + meta；peerDependencies 已声明支持 Vite 7/8 与 vue-router 4/5（已核实）；antfu-collective 维护、版本号与 Vite 大版本对齐，活跃 |
| vue-router | 5.3.1 | 路由 | Vue 官方路由当前大版本；history 模式下每工具一 URL；vite-ssg 自动注入 history |
| unplugin-vue-router | 0.19.2 | 文件路由 + 类型化路由 | `src/pages/tools/json-formatter.vue` 自动生成 `/tools/json-formatter` 路由，新增工具零路由配置；导出的 typed routes 让 `router.push` 全程类型安全 |
| @unhead/vue | 3.4.0 | SEO head 管理 | `useHead()` 在预渲染阶段把每工具的 title/description/canonical/OG 写进静态 HTML——SSG SEO 就靠它；vite-ssg 官方集成 |
| TypeScript | 5.9.3 | 类型系统 | 5.x 稳定线终版；**不要直接上 TS 7.0.2**（Go 原生编译器首版，vue-tsc 对其兼容性未经官方验证；vue-tsc 3.3.11 peer 声明 `>=5.0.0`，锁 5.9.x 最稳） |
| Tailwind CSS | 4.3.3 | 样式系统 | v4 CSS-first：`@theme` 里定义霓虹青/品红/电光黄（oklch）设计令牌 + 等宽字体 + 发光阴影，即成赛博朋克主题系统；`@custom-variant dark` 支持默认暗色 + class 切换；官方 `@tailwindcss/vite` 4.3.3 插件免 PostCSS 配置，零运行时 |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CodeMirror 6（`@codemirror/state/view/language` + `@codemirror/lang-json` 等） | 6.x（lang-json 6.0.2） | JSON 格式化/校验、Markdown、正则、代码片段编辑 | 所有需要编辑器的工具；核心 ~45KB gz，按工具懒加载；**明确不用 Monaco**（见 What NOT to Use） |
| @vueuse/core | 14.4.0 | useLocalStorage（收藏置顶）、useClipboard（一键复制）、useDark、useEventListener | 收藏功能 = `useLocalStorage('favorites', [])` 一行；几乎每个工具都要复制到剪贴板 |
| fuse.js | 7.5.0 | 首页/导航工具搜索 | 零依赖 ~5KB；几十至上百个工具（名称+关键词+描述）的模糊搜索完全够用；中文按字符匹配可用。若工具量破千再换 minisearch（倒排索引） |
| dayjs | 1.11.23 | 时间戳转换、日期计算 | 时间戳工具核心；2KB |
| qrcode | 1.5.4 | 二维码生成 | canvas/SVG/DataURL 三种输出；后续做扫码再加 jsqr 1.4.0 |
| browser-image-compression | 2.0.2 | 图片压缩 | canvas+Web Worker，处理"压到目标大小"高频场景足够 |
| @jsquash/webp / @jsquash/jpeg | 1.5.0 / 1.6.0 | 图片格式转换（高质量 WASM 编码） | 转 WebP/JPEG 品质优于 canvas.toBlob；wasm 按需动态 import，不进首屏 |
| marked | 18.0.11 | Markdown 预览渲染 | 配 CodeMirror 做 Markdown 编辑器；代码高亮配 highlight.js 11.12.0 |
| papaparse | 5.7.0 | CSV 解析/生成 | 办公线 CSV↔Excel/JSON 转换 |
| xlsx（SheetJS，**从 cdn.sheetjs.com 装**） | 0.20.x | Excel 读写 | ⚠️ npm 上的 `xlsx` 停在 0.18.5 且含未修 CVE，必须用官方 CDN 安装（见 What NOT to Use）；嫌麻烦可换 exceljs 4.4.0 |
| jszip | 3.10.1 | 打包下载 | 批量转换结果打包 |
| js-base64 | 3.9.3 | Base64 编解码 | 正确处理 UTF-8/中文（原生 btoa 不行） |
| crypto-js | 4.2.0 | 旧式加密 | **默认用 Web Crypto API**（AES/SHA/RSA 原生异步）；仅 MD5 这类 Web Crypto 不提供的算法才用它 |
| lucide-vue-next | 1.0.0 | 图标 | 按需 tree-shake，风格中性易叠霓虹滤镜 |
| motion-v | 2.4.0 | 动效（可选） | Motion for Vue，弹簧动画；用于首页 HUD 入场/故障字微动效，工具区保持克制不引入 |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| create-vue | 3.23.0 | 项目脚手架：`pnpm create vue@latest`，勾选 TypeScript + Router + Pinia（可后补）+ ESLint + Prettier + Vitest |
| pnpm | 10.x | 包管理器；EdgeOne Pages 构建环境原生支持 |
| vitest | 5.0.0 | 单元测试（编解码/转换类纯函数非常值得测） |
| @vue/test-utils | 2.5.0 | 组件测试 |
| happy-dom | 最新 | vitest DOM 环境，比 jsdom 快 |
| eslint + prettier | 10.9.1 / 3.9.6 | ESLint 10 flat config；create-vue 自动配置 |
| vue-tsc | 3.3.11 | SFC 类型检查；peer `>=5.0.0`，配 TS 5.9.3 |

### Deployment Platform（对比与推荐）

| 维度 | **EdgeOne Pages（现 EdgeOne Makers）✅ 推荐** | Vercel | GitHub Pages | Cloudflare Pages（备选） |
|------|------|--------|--------------|--------------------------|
| 免费层 | 免费无期限：40 项目 / 500 构建·月 / 200 自定义域名+免费SSL / 静态请求无配额 | Hobby 免费限非商业 | 免费公开仓库 | 免费无限带宽 |
| 国内大陆访问 | **最优**：绑已备案域名后走大陆 CDN 节点；未备案走海外节点（含香港，延迟优于 Vercel/GH） | **差**：`*.vercel.app` 自 2021 年被 DNS 污染不可直连；自定义域名无大陆 PoP，部分地区间歇失败 | **最差**：github.io DNS 污染、时好时坏，2026 年仍"多数大陆用户打不开" | 中：免费版走海外节点，时延一般但可访问 |
| 默认域名 | 大陆网络下仅 3 小时预览链接（401），**第一天就要绑自定义域名** | 被墙不可用 | 污染不可靠 | 可用 |
| ICP 备案 | 加速区域含大陆节点时必须；"全球（不含中国大陆）"区域无需备案 | 不需要 | 不需要 | 不需要 |
| SSG/框架支持 | Git 推送自动构建，Vite/框架模板齐全 | 同左 | 需自配 GitHub Actions | 同 Vercel |
| 结论 | **主部署**：国内速度上限最高、免费层慷慨、腾讯云生态 | 不做主部署；可选海外镜像 | **排除** | 未备案时期的次选 |

### Installation

# 脚手架（Vue3 + TS + Router + Vitest + ESLint + Prettier）

# 核心

# 工具库（全部按工具页面懒加载，勿进首屏）

# 图片格式转换（WASM 懒加载）

# Excel：必须用 SheetJS 官方 CDN（npm 版本停更且有 CVE）

# Dev 依赖（create-vue 大多已带，此处为补装清单）

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vue 3.5 + Vite + vite-ssg | **Nuxt 4（4.5.2）** | 需要 SSR/服务端 API 层、i18n、中间件、内容集合等平台能力时。`nuxt generate` 同样产出预渲染 HTML + `useSeoMeta` 每页 meta（官方已核实），SEO 能力同级；但对"无后端工具箱"而言 Nitro 服务引擎、hydration 与双层路由是多余复杂度。将来若要长内容/博客板块，迁移 Nuxt 是自然升级路径 |
| Vue 3.5 + vite-ssg | **Astro 7（7.3.1）+ Vue 岛屿** | 纯内容站/文档站首选（islands 架构，静态 HTML + `client:load` 按需水合，官方已核实）。本站是"应用型"站点：搜索、收藏、主题是全局交互，跨岛共享状态会把 island 模型用得别扭；且作者要多学一套 .astro 语法 |
| Vue 3.5 | **React 19.2 + Next 16（16.3.4）static export** | 团队 React 背景时。`output: 'export'` 仍受官方支持（已核实），但 Next 的 RSC/服务端概念体系对无后端站点过重；React 阵营没有等价的"Vite + 轻量 SSG"官方组合 |
| Vue 3.5 | **React 19 + Vite**（SPA，无 SSG） | 不在乎 SEO 时。要 SSG 得再拼 react-router 7 framework mode 或 vike，组合度不如 Vue 官方链完整 |
| Vue 3.5 | **Svelte 5（5.57.0）+ SvelteKit** | 极致包体积诉求时；国内办公类工具库（Excel/二维码/中文编辑器）示例与生态明显更薄 |
| Vite + 自研页面 | **VitePress 1.6.4** | 纯文档站；默认主题会束缚赛博朋克定制 UI，且其定位是文档而非工具应用 |
| Tailwind 4 | **UnoCSS（66.9.2）** | 偏好原子化 attribute 模式/antfu 生态时；能力等价，但 Tailwind v4 文档与社区体量更大，AI 辅助开发时命中率高 |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Monaco Editor | 最小 bundle ~2.5MB（gzip ~700KB），官方 2019 年起明确不做移动端适配；静态导出下 worker 路径配置是噩梦；工具站编辑的是"片段"不是"项目"（toolkit.best 2026-05 实测数据：CM6 gzip 45KB，差 10 倍+） | CodeMirror 6（模块化、移动端友好、零 worker 配置） |
| npm 源的 `xlsx`（0.18.5） | npm 版本停滞多年，带未修复高危 CVE-2023-30533（原型污染）/ CVE-2024-22363（ReDoS）；修复版只发布在官方 CDN（2026-08 仍如此，已核实） | `pnpm add https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` 或 exceljs 4.4.0 |
| Vue 3.6（RC）/ Vapor Mode | 2026-07 仍处 RC（3.6.0-rc.6），非生产就绪 | 3.5.x stable；3.6 正式发布后再评估升级（收益主要是性能，非功能） |
| TypeScript 7.x（Go 原生编译器） | 7.0.2 刚发布，vue-tsc/Vue 生态对其兼容性未经官方验证 | TypeScript 5.9.3 |
| Element Plus / Ant Design Vue 等全量组件库 | 预设视觉与赛博朋克强风格冲突，覆盖成本高于自建；体积大 | Tailwind 4 + 自研 5–6 个基础组件（输入框/卡片/按钮/Tabs/复制按钮），工具区组件量本来就少 |
| Vue CLI / webpack | Vue CLI 已维护模式 | Vite 8（create-vue 默认） |
| 任何后端/数据库/登录态 | 项目硬约束：纯前端、数据不出浏览器 | localStorage（VueUse useLocalStorage 封装）+ Edge Functions 兜底（EdgeOne 免费层 300 万次/月，仅在确需代理时用） |
| GitHub Pages / Vercel 作主部署 | 国内访问：前者 DNS 污染反复、后者默认域名被墙且无大陆节点（多来源交叉核实） | EdgeOne Pages（备案走大陆节点 / 未备案走含香港的海外节点） |

## Stack Patterns by Variant

- EdgeOne Pages + 已备案自定义域名 + "中国大陆可用区"
- 因为国内访客命中境内 CDN 节点，速度与可用性都是候选中的上限；腾讯云备案流程对个人开放
- EdgeOne Pages + 自定义域名 + "全球可用区（不含中国大陆）"（无需备案，走含香港的海外节点）
- 备案通过后同一项目切加速区域即可；备选 Cloudflare Pages
- 保持 Vue 技术栈，届时评估迁移 Nuxt 4（@nuxt/content）或独立子域用 VitePress
- 因为 Nuxt 的内容生态与 SSG 平台能力在内容规模化后收益明显
- 用 EdgeOne Pages 免费层 Edge Functions（300 万次/月）做无状态代理
- 因为它是平台内置能力，不改变"无自建后端"的项目约束

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| vite-ssg 28.3.0 | Vite 8.x / 7.x，vue ^3.2.10+，vue-router ^4 或 ^5 | peerDependencies 官方声明，已核实；版本号与 Vite 大版本同步 |
| @tailwindcss/vite 4.3.3 | tailwindcss 4.3.3 + Vite 8 | 两者同版本号发布，避免各自升 Major 漂移 |
| vue-tsc 3.3.11 | TypeScript >=5.0.0（官方声明） | 实操锁 TS 5.9.3；TS 7 未经 Vue 生态验证 |
| unplugin-vue-router 0.19.2 | vite-ssg | vite-ssg 文档明确支持 `import routes from '~pages'`（vite-plugin-pages / unplugin-vue-router 均可） |
| xlsx @SheetJS CDN 0.20.x | Vite 打包 | tgz 安装正常打包；勿从 npm 装旧版 |
| EdgeOne Pages 构建环境 | Node LTS + pnpm | 平台原生 Git 构建；构建超时 20 分钟（本站构建 <1 分钟，余量充足） |

## Sources

- npm registry（2026-09-04 实时查询）— 全部版本号第一方来源：vue 3.5.42 / vite 8.2.2 / vite-ssg 28.3.0 / nuxt 4.5.2 / astro 7.3.1 / tailwindcss 4.3.3 / react 19.2.8 / next 16.3.4 / typescript 7.0.2(5.9.3 为 5.x 线终版) / vue-router 5.3.1 / pinia 4.0.3 / @unhead/vue 3.4.0 等
- Context7 `/websites/vuejs` — create-vue 官方脚手架、Vite 官方构建工具定位
- Context7 `/antfu-collective/vite-ssg` — ViteSSG 用法、peerDependencies（Vite 7/8 + vue-router 5）、useHead/ClientOnly/includedRoutes
- Context7 `/websites/nuxt_4_x` — nuxi generate、routeRules、useSeoMeta、SSG 部署语义
- Context7 `/withastro/docs` — islands 与 client:* 指令
- Context7 `/websites/tailwindcss` — @theme 设计令牌、@custom-variant dark、官方 Vite 插件
- Context7 `/vercel/next.js` — output: 'export' 支持与限制
- EdgeOne Makers 官方文档（pages.edgeone.ai，2026-08 更新）— 免费版配额（40 项目/500 构建·月/200 域名/Edge Functions 300 万·月）、域名管理（大陆访问默认域名限 3 小时预览链接；含大陆节点加速区必须 ICP 备案；"全球（不含中国大陆）"免备案）— MEDIUM/HIGH
- toolkit.best《为什么我们用 CodeMirror 6 而不是 Monaco》（2026-05）— 体积/移动端/worker 实测对比 — MEDIUM（单一来源，但数字自洽且与生态共识一致）
- Vercel/GitHub Pages 国内访问：CSDN 2026-04、知乎、掘金 2025-07、hqyman.cn 2026-05 等多来源交叉 — MEDIUM（cross-verified）
- SheetJS CDN（cdn.sheetjs.com）与 GitHub issue（2026-08）— npm xlsx 停更与 CVE 事实 — MEDIUM（cross-verified）

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
