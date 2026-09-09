# Phase 3: 预渲染 SEO 与部署管线 - Context

**Gathered:** 2026-09-09
**Status:** Ready for planning

<domain>
## Phase Boundary

交付站点公网可用所需的全部管线能力：vite-ssg 每路由预渲染 HTML 携带 SEO meta（title/description/canonical/og 基础件）、构建期生成 sitemap.xml 与 robots.txt、EdgeOne Pages 公网部署（GitHub 公开仓 + Git 集成推 main 自动构建部署）、零第三方外链与首包 gzip ≤ 200KB 体积预算硬卡。部署路径为「EdgeOne 全球（不含大陆）可用区先上线」，ICP 备案为并行非阻塞事项。本阶段不包含：站点级体验（首页分类/搜索/收藏是 Phase 4）、新工具（Phase 5/8）、赛博朋克视觉强化与 webfont（Phase 6）、PWA（Phase 7）。

</domain>

<decisions>
## Implementation Decisions

### 域名与上线路径
- **D-01:** 暂用 EdgeOne 分配的默认域名（*.edgeone.app）先上线，自定义域名后绑定；绑定后 sitemap 域名重跑构建更新
- **D-02:** 未备案 → 大陆加速不可用，走 EdgeOne 全球（不含大陆）可用区先上线；备案通过后零代码切换大陆加速区（STATE.md 挂起项「ICP 备案与否需作者显式确认」已确认）
- **D-03:** robots.txt 允许全部抓取——默认域名阶段就让爬虫收录；换正式域名后 sitemap 重提交，旧域名靠 301/权重自然过渡
- **D-04:** 部署后人工向 Google Search Console / 百度站长平台提交 sitemap，纳入本阶段 human-check 验收

### SEO meta 体系
- **D-05:** 每工具页 meta 标准集 = title + description + canonical + og:title/og:description/og:url；不做 twitter card 与 og:image
- **D-06:** title 格式「工具名 - little-utils」（半角连字符）；首页「little-utils — 开发者 & 办公工具箱」（沿用 index.html 现值）
- **D-07:** 不做 JSON-LD 结构化数据（工具站非富摘要主要受益方，收录靠 title/description/sitemap 已足）
- **D-08:** 404 页 meta robots noindex（预渲染 HTML 仍生成，爬虫不收录）；首页正常收录 + 定制 description
- **D-09:** 工具页 description 直接复用 `ToolMeta.description`（契约零变更，单一真相；SEO 长度不足再后续评估）
- **D-10:** 首页 description 由 Claude 起草（中文，含开发者/办公双线关键词），写入计划，验收时人工确认

### 站点 URL 单源
- **D-11:** `SITE_URL` 先填预期默认域名占位（如 https://little-utils.edgeone.app），首次部署后按实际分配值修正并重跑构建
- **D-12:** 四消费方单源：canonical + og:url + sitemap 全部 URL + robots.txt 的 Sitemap 行，统一从 `SITE_URL` 派生，禁止散落硬编码 — **Reversibility:** costly — sitemap 生成脚本、robots.txt、meta 注入层均为其消费方，Phase 5 七个新工具接入后换源机制需触及全部消费面

### 部署管线
- **D-13:** 新建 GitHub 公开仓（本地仓库首次配置 remote，推 main）
- **D-14:** EdgeOne Pages Git 集成部署（控制台配置仓库 + 构建命令，产物 dist，推 main 即自动构建部署；满足成功标准 5）
- **D-15:** EdgeOne 构建命令跑全门禁链：test + type-check + lint + check:chunks + build-only，任一失败不部署（线上产物永远过门）

### 零外链与验收自动化
- **D-16:** 字体保持系统字体栈（天然零外链零成本）；webfont（赛博朋克展示字体）留 Phase 6 再定，届时也必须自托管
- **D-17:** 200KB 首包预算硬卡：check 脚本超限非零退出，经 EdgeOne 构建命令链天然阻断部署（预算真正生效防漂移）
- **D-18:** 自动断言脚本扫 dist：每页 HTML 含非空 title/description（非 JS 空壳）、sitemap 路由与注册表一致、零第三方外链检测；跑进构建门禁链防回归（Phase 5 新工具自动覆盖）
- **D-19:** 大陆可访问性由作者在大陆网络（无代理）人工实测，human-check 验收项（实测环境只有作者有）

### Claude's Discretion
- sitemap 生成机制（vite.config.ts `onFinished` 已预留注释 vs 插件；vite.config.ts §ssgOptions 注释已预留三个 Phase 3 接缝）
- check:chunks 扩展 vs 新增体积/外链/meta 断言脚本的落点划分
- `SITE_URL` 的具体文件位置与导出形式（方向 src/config/site.ts）
- og meta 注入实现（@unhead/vue useHead/useSeoMeta 具体用法）
- EdgeOne 构建命令链的具体写法（pnpm 命令编排）
- 首页 description 文案的具体内容（起草权，验收时人工确认）
- 404 noindex 与首页 meta 注入的组件层实现

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目定义
- `.planning/PROJECT.md` — 纯前端/数据不出浏览器约束、部署平台决策（「由调研推荐」Pending 项已由 D-14 落定）
- `.planning/REQUIREMENTS.md` — 本阶段覆盖 ARCH-03（SSG 预渲染 SEO）、ARCH-05（部署管线）；Out of Scope 表
- `.planning/ROADMAP.md` §Phase 3 — 阶段目标与 5 条成功标准（curl 可见 title/description、sitemap/robots 公网可达、大陆可打开、200KB 预算、推即部署）
- `.planning/STATE.md` §Blockers — 「ICP 备案」挂起项（本讨论 D-02 已确认，planner 应指示 state 更新）

### 技术决策依据
- `.planning/research/STACK.md` — 版本清单与依赖纪律（What NOT to Use、T-02-SC 供应链闸门——新增依赖需人工批准）
- `.planning/research/ARCHITECTURE.md` — 注册表驱动架构（sitemap 应从注册表派生，同一路由真相）、SSG mounted 纪律
- `.planning/research/PITFALLS.md` — bundle 膨胀红线、SSG 预渲染约束

### Phase 1/2 决策与现状
- `.planning/phases/01-app-skeleton-tool-registry/01-CONTEXT.md` — D-03（框架壳只填不改）、注册表契约（sitemap 派生源）
- `.planning/phases/02-design-system-a11y-baseline/02-CONTEXT.md` — D-05（FOUC 内联脚本与预渲染默认暗色，改动 index.html head 时不得破坏）
- `vite.config.ts` §ssgOptions — Phase 3 预留注释：includedRoutes 过滤（现排除 `:` 路由）、onFinished 生成 sitemap、每路由 meta 验证
- `src/tools/tool.ts` — `ToolMeta.description` 注释「SEO description + 卡片副标题」双用途契约（D-09 消费源）
- `src/router/routes.ts` — `route.meta.tool`（注释标注「SEO 消费点」）
- `scripts/check-chunks.mjs` — 首包定义 = 入口页 chunk 可达闭包（BFS）；200KB 预算检查的基础
- `package.json` — build 命令链（type-check + build-only）、check:chunks 脚本；EdgeOne 构建命令的编排基础

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@unhead/vue` 3.4.0 + `createHead()` 已在 main.ts 接好 — meta 注入消费端就绪（useHead/useSeoMeta）
- `defineTool` 注册表元数据（name/description/keywords）— 每页 meta 与 sitemap 的数据源，Phase 5 新工具零成本接入
- `scripts/check-chunks.mjs` — 首包可达闭包计算已实现，200KB 预算硬卡（D-17）在其上扩展
- `vite-ssg` 28.3.0 — onBeforePageRender 钩子先例（Phase 2 暗色注入）；onFinished 可用于 sitemap 生成
- vitest + happy-dom 测试基建（172 测试）— 自动断言脚本可共享工具函数与运行入口

### Established Patterns
- 路由 = 注册表纯派生（routes.ts 禁手写工具路由）— sitemap URL 列表必须同源派生，不得第二真相
- head 内联脚本镜像断言（useThemeMode.test.ts 文本断言防漂移）— index.html 改动需同类守护
- T-02-SC 供应链纪律：新增依赖走 blocking-human 闸门（sitemap 相关 npm 包引入前先评估无依赖自研）
- 构建脚本层不变量：check-chunks 从 jiti 实载注册表模块取工具路由（双源消除先例）

### Integration Points
- `vite.config.ts` ssgOptions — includedRoutes 过滤 / onFinished sitemap / 每路由 meta 验证三处预留接缝
- `src/router/routes.ts` meta.tool — 工具页 meta 注入的元数据入口
- `public/` — robots.txt 与 favicon 等静态资源落点
- `index.html` head — FOUC 脚本与默认 title 所在，meta 体系不得破坏预渲染暗色基线
- EdgeOne Pages 控制台 — 仓库绑定、构建命令、产物目录、域名分配的配置面（代码外，计划需写成人工步骤）

</code_context>

<specifics>
## Specific Ideas

- title 分隔符用半角「-」，首页保留现有「—」全角破折号（index.html 现值不动）
- sitemap 路由列表与注册表一致性是断言脚本的一部分，防止 Phase 5 新工具漏收录
- 大陆网络实测环境只有作者本人具备，部署完成后必须交还人工验收
- 「新增工具页自动获得 meta 与 sitemap 收录」的保障靠 D-18 自动断言进门禁链，而非人工记忆

</specifics>

<deferred>
## Deferred Ideas

- 自托管 webfont（赛博朋克展示字体）→ Phase 6 视觉强化（届时必须自托管，守零外链）
- EdgeOne 大陆加速区切换 → ICP 备案通过后执行（控制台操作，代码零差异）
- 自定义域名注册与绑定 → 默认域名上线后按需进行

</deferred>

---

*Phase: 3-预渲染 SEO 与部署管线*
*Context gathered: 2026-09-09*
