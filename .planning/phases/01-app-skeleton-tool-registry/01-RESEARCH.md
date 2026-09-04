# Phase 1: 应用骨架与工具注册表契约 - Research

**Researched:** 2026-09-04
**Domain:** Vue 3.5 + Vite 8 + Tailwind 4 纯前端静态工具箱脚手架；注册表驱动路由；XSS 消毒渲染管线；CodeMirror 6 集成
**Confidence:** HIGH（核心选型全部经 npm registry + 官方文档本会话验证；发现两项上游包已弃用并给出修正）

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 输入区使用 CodeMirror 6（~45KB gz，随工具路由懒加载，不进首屏 bundle），提供行号、语法高亮、错误定位 — Reversibility: costly
- **D-02:** 输出视图为"格式化文本 + 可折叠树形视图"左右双栏；树形视图针对电商嵌套数据（深层对象/长数组）场景
- **D-03:** Phase 1 即交付完整框架壳：顶栏 + 工具卡片网格 + 双 layout（home/tool）；Phase 4/6 只填充内容/样式，不重构布局结构 — Reversibility: costly
- **D-04:** Phase 1 即用 Tailwind 4 `@theme` 定义霓虹青/品红/电光黄 oklch 设计令牌，页面以暗色底呈现但风格克制使用 — Reversibility: reversible
- **D-05:** Phase 2 只补亮色主题切换与 reduced-motion 降级，不重做令牌体系
- **D-06:** 使用 lucide 图标库，注册表 `icon` 字段存组件引用；按需导入、tree-shake 后每图标 <1KB — Reversibility: costly（icon 字段类型是 defineTool 契约的一部分）

### Claude's Discretion
- defineTool 契约的具体字段清单与 TS 类型设计（除 icon 为组件引用外）
- 时间戳工具的具体 UI 布局
- XSS 消毒渲染管线的具体技术选型（DOMPurify 等由 researcher/planner 验证）
- ESLint 配置细节（禁 v-html 规则）
- 路由派生的具体实现机制（unplugin-vue-router vs 手写派生，research 阶段二选一定夺）

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope（阶段边界见 CONTEXT.md `<domain>`：不含主题系统完整实现、SSG/部署、搜索/收藏、其余工具）
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ARCH-01 | 工具注册表契约（defineTool 元数据），路由/导航/搜索/收藏校验/sitemap 全部从注册表派生 | `defineTool()` 接口设计（§Pattern 1）；路由派生选型已定夺：手写派生（§Pattern 2，unplugin 已弃用证据）；分类/卡片消费方式（§Pattern 4） |
| ARCH-02 | 每工具独立路由并懒加载，重依赖不进首屏 bundle | 注册表 component 字段 `() => import()` → 路由级 chunk（§Pattern 1/2）；CodeMirror 进工具 chunk 的机制（§Pattern 3）；vite-ssg 预渲染兼容懒路由已验证（§Pitfall 9） |
| ARCH-04 | 统一 XSS 消毒渲染管线（唯一渲染出口，ESLint 禁 v-html/innerHTML） | SafeHtml 唯一出口 + `ignorePattern` 白名单机制（§Pattern 5）；DOMPurify 3.4.14 集成；注入用例测试集（§Validation Architecture） |
| TOOL-01 | JSON 格式化/压缩/校验，长数字 ID 不丢失精度 | 纯文本 tokenizer 方案（数字逐字保留，§Pattern 6）；json-bigint/lossless-json 对比与排除理由；树形视图双栏方案（§Pattern 4） |
| TOOL-02 | Unix 时间戳与日期时间双向转换，含时区显示 | dayjs utc+timezone 插件链（utc 必须先于 timezone）、秒/毫秒识别、`tz.guess()`/`Z` 偏移显示（§Pattern 7） |
</phase_requirements>

## Summary

Phase 1 是全站契约定型阶段：`defineTool()` 注册表是路由、导航、搜索、收藏、sitemap 五个消费方的唯一数据源，其字段设计必须一次定型（D-01/D-03/D-06 均为 costly 可逆性）。本次研究的关键新发现是**两个上游包在项目调研（2026-09-04 早上）之后发生了弃用变更**：`lucide-vue-next` 已弃用（官方指向 `@lucide/vue`），`unplugin-vue-router` 已并入 vue-router 5 核心。前者直接影响 D-06 的安装包名（图标方案不变，改用官方延续包）；后者直接终结了"手写派生 vs unplugin"的选型讨论——文件路由与本项目的"注册表单一事实来源"架构相抵触，且该插件包已不再是独立维护的依赖。

技术路线全部经本会话一手验证：版本号来自 npm registry 实时查询（vue 3.5.42 / vite 8.2.2 / vite-ssg 28.3.0 / tailwindcss 4.3.3 / dompurify 3.4.14 等）；Tailwind 4 `@theme`/`@custom-variant dark`、CodeMirror 6 组装方式、vite-ssg 懒路由预渲染、DOMPurify SSR 行为、dayjs 时区插件链均取自官方文档。脚手架用 create-vue 3.23.0 非交互式 flags（`--help` 输出已验证），产物上叠加项目结构。XSS 管线采用"双保险"：优先 Vue vnode 渲染（框架自动转义，根本不产生 HTML 字符串），无法避免 HTML 字符串时统一走 `SafeHtml` 唯一出口（内部 DOMPurify + ESLint `vue/no-v-html` 的 `ignorePattern` 白名单强制收敛）。

JSON 工具的核心正确性模型是**纯文本 tokenizer**：数字与键名逐字保留、永不转换为 JS number——这是满足"长数字 ID 不丢失精度"（电商订单号 ≥ 2^53 场景）的唯一无损路径；同一 tokenizer 同时供给格式化、压缩、校验（行/列错误定位）与树形视图结构。时间戳工具用 dayjs utc+timezone 插件链完成双向转换与时区显示。

**Primary recommendation:** 用 create-vue（--ts --router --vitest --eslint --prettier --bare）起骨架，叠加 `tools/` 注册表目录结构；路由 = 注册表纯派生（不用文件路由）；CodeMirror 6 / DOMPurify 只出现在工具 chunk 与 `utils/sanitize.ts`；`pnpm build` 从 Phase 1 起就用 `vite-ssg build`（dev 体验不变），让"无模块顶层浏览器 API"纪律立即被构建验证。

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 工具注册表 + defineTool 契约 | 前端共享层（`src/tools/`） | 构建期（vite-ssg 读路由表） | 纯 TS 数据模块；五个消费方全部只读派生 |
| 路由派生 + 404 | 前端（`src/router/`） | — | 注册表 `map` 的纯函数派生，无 IO |
| 双 layout 切换 | 前端（`App.vue` + `layouts/`） | — | `route.meta.layout` 选择布局组件，布局不感知具体工具 |
| XSS 消毒渲染管线 | Browser/Client（执行期） | 构建期（ESLint 静态禁 v-html） | DOMPurify 需要 DOM；lint 在编译期拦截违规写法 |
| JSON 格式化/校验/树形视图 | Browser/Client（纯函数 service + Vue 组件） | — | 计算必须本地完成（项目硬约束）；service 无框架依赖可单测 |
| 时间戳转换 | Browser/Client（dayjs 纯函数） | — | 同上；时区数据来自浏览器 Intl |
| 设计令牌（@theme oklch） | CSS/构建期（Tailwind 4） | — | 零运行时；`@custom-variant dark` 为 Phase 2 预留 |
| 代码分割/预渲染 | 构建期（Vite + vite-ssg） | CDN/Static（Phase 3 部署） | `() => import()` 决定 chunk 边界；构建命令换为 vite-ssg build |
| 剪贴板复制 | Browser/Client | — | Clipboard API 需安全上下文 + 用户手势，统一 composable 降级 |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vue | 3.5.42 | UI 框架（stable，勿用 3.6-rc） | 项目调研锁定；registry 最新稳定版 [VERIFIED: npm registry] |
| vite | 8.2.2 | 构建工具 | create-vue 3.23.0 默认产物 [VERIFIED: npm registry] |
| typescript | 5.9.3 | 类型系统 | 5.x 线终版（registry latest 为 7.0.2，**勿用**——vue-tsc 兼容未经验证）；`npm view typescript@5.9.3` 本会话确认存在 [VERIFIED: npm registry] |
| vue-router | 5.3.1 | 路由 | v5 已把 unplugin-vue-router 并入核心；v4 用户零破坏升级 [VERIFIED: npm registry + router.vuejs.org 迁移指南] |
| vite-ssg | 28.3.0 | SSG 预渲染（Phase 3 完整接入，Phase 1 先换 build 命令） | peerDeps 支持 Vite 7/8 + vue-router 4/5；dev 模式 = 普通 `vite`，build = `vite-ssg build` [VERIFIED: npm registry + Context7 /antfu-collective/vite-ssg] |
| tailwindcss + @tailwindcss/vite | 4.3.3（两包同版本发布） | 样式系统 + 设计令牌 | `@theme` 定义 oklch 令牌；官方 Vite 插件零运行时、无 config 文件 [VERIFIED: npm registry + Context7 /websites/tailwindcss] |
| @unhead/vue | 3.4.0 | `useHead()` 每页 title/meta | vite-ssg 官方配套；v2 起需从 `/client`、`/server` 子路径导入 [VERIFIED: npm registry + CITED: unhead.unjs.io 迁移指南] |
| @vueuse/core | 14.4.0 | useClipboard（legacy 降级）/useStorage 等 | 收藏（Phase 4）与复制（本阶段）的底座 [VERIFIED: npm registry] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @lucide/vue | 1.40.0 | 图标（D-06） | **注意：`lucide-vue-next` 已弃用**，npm 弃用原文："Package deprecated. Please use @lucide/vue instead."（本会话 `npm view lucide-vue-next deprecated` 读取）[VERIFIED: npm registry 弃用声明]。同仓库 lucide-icons/lucide 的官方延续包，非弃用状态 [VERIFIED: package-legitimacy signals] |
| codemirror（meta 包，basicSetup） | 6.0.2 | 编辑器基础组装 | JSON 工具输入区（D-01），随工具 chunk 懒加载 [VERIFIED: npm registry] |
| @codemirror/lang-json | 6.0.2 | JSON 语法 + `jsonParseLinter` | 官方语言包，内置 linter 提供错误定位 [VERIFIED: npm registry + CITED: codemirror.net] |
| @codemirror/lint | 6.9.7 | linter 基建 | `linter()` + `lintGutter()` 标记错误行 [VERIFIED: npm registry + CITED: codemirror.net/docs/ref] |
| @codemirror/theme-one-dark | 6.1.3 | 暗色编辑器主题 | 官方社区主题列表收录；暗底站点开箱即用 [VERIFIED: npm registry + CITED: codemirror.net/docs/community] |
| dompurify | 3.4.14 | HTML 消毒 | SafeHtml 唯一出口内部使用；cure53 官方，周下载 6430 万 [VERIFIED: npm registry + package-legitimacy signals] |
| dayjs | 1.11.23 | 时间戳转换（TOOL-02） | 2KB；utc + timezone 插件链 [VERIFIED: npm registry + CITED: dayjs 官方插件文档] |
| vitest | 5.0.0（scaffold 选择优先） | 单元/组件测试 | create-vue --vitest 生成的配套版本为准，避免 peer 漂移 [VERIFIED: npm registry] |
| @vue/test-utils | 2.5.0 | 组件测试 | mount ToolCard/SafeHtml [VERIFIED: npm registry] |
| happy-dom | 20.14.0 | 测试 DOM 环境 | 比 jsdom 快；create-vue vitest 模板默认 jsdom，可改 [VERIFIED: npm registry] |
| eslint + eslint-plugin-vue + @vue/eslint-config-typescript | 10.9.1 / 10.10.0 / 14.9.0 | Lint 卡口（no-v-html） | create-vue --eslint 生成 flat config；plugin-vue 10.x 全 flat [VERIFIED: npm registry] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 手写注册表派生路由 | `vue-router/vite` 文件路由（unplugin-vue-router 的官方继承者） | 文件路由从 `pages/` 目录结构派生**路由**，但导航/搜索/收藏/sitemap 仍需注册表 → 两处真相，违反 ARCHITECTURE 反模式 1。手写派生零依赖且类型安全可用 `satisfies` 兜底。**已定夺：手写派生** |
| 纯文本 tokenizer（JSON） | json-bigint 1.0.0 / lossless-json 4.3.1 | json-bigint（README 已验证）：默认 BigNumber 存储下字符串层往返成立，但引入运行时依赖 + BigNumber 机器；`storeAsString: true` 会把大整数永久变成字符串（类型不可逆）。lossless-json 的 LosslessNumber 可行但依赖较重。tokenizer 约 100 行、零依赖、键序保持（parse/stringify 均会重排数字型键）、一份解析器喂四个功能 |
| @lucide/vue | lucide-vue-next | 后者已弃用，排除 |
| happy-dom | jsdom | happy-dom 快；若 DOMPurify 在 happy-dom 下出现边缘行为，DOMPurify 官方支持 jsdom（Node 20-26 实测），可按文件用 `// @vitest-environment jsdom` 回退 |

**Installation:**
```bash
# 脚手架（工作区根目录，非交互式；flags 已用 create-vue --help 本会话验证）
corepack pnpm create vue@latest . --ts --router --vitest --eslint --prettier --bare
# 说明：不装 --pinia（Phase 1 无跨组件状态需求；Phase 4 收藏再定 store 方案）

# 追加核心依赖
corepack pnpm add vue-router@5 @unhead/vue @vueuse/core tailwindcss @tailwindcss/vite @lucide/vue dayjs

# 工具依赖（CodeMirror 只被工具 chunk 引用）
corepack pnpm add codemirror @codemirror/lang-json @codemirror/lint @codemirror/theme-one-dark dompurify

# SSG（build 命令即换，完整 SEO meta 是 Phase 3）
corepack pnpm add -D vite-ssg
```

> **pnpm 注意：** 本机未直接安装 pnpm（存在失效的 nvm alias），但 corepack 0.35.0 可用，`corepack pnpm --version` → 11.25.0 已实测。**package.json 必须写 `"packageManager": "pnpm@11.25.0"`**（或团队选定版本），之后所有命令用 `corepack pnpm ...` 或 `corepack enable` 后直接 `pnpm`。 [VERIFIED: 本会话环境探测 + corepack 输出]

**版本验证记录（2026-09-04，npm registry 本会话查询）：** vue 3.5.42 / vite 8.2.2 / vite-ssg 28.3.0 / tailwindcss 4.3.3 / @tailwindcss/vite 4.3.3 / vue-router 5.3.1 / @unhead/vue 3.4.0 / typescript 5.9.3 / vue-tsc 3.3.11 / @vueuse/core 14.4.0 / dayjs 1.11.23 / codemirror 6.0.2 / @codemirror/lang-json 6.0.2 / @codemirror/theme-one-dark 6.1.3 / @codemirror/lint 6.9.7 / dompurify 3.4.14 / @lucide/vue 1.40.0 / vitest 5.0.0 / @vue/test-utils 2.5.0 / happy-dom 20.14.0 / eslint 10.9.1 / eslint-plugin-vue 10.10.0 / @vue/eslint-config-typescript 14.9.0 / create-vue 3.23.0。

## Package Legitimacy Audit

> Package Legitimacy Gate 已于 2026-09-04 运行（`gsd_run query package-legitimacy check --ecosystem npm ...`）。

| Package | Registry | 周下载 | Source Repo | Verdict | Disposition |
|---------|----------|--------|-------------|---------|-------------|
| vite-ssg | npm | 62,366 | github.com/antfu-collective/vite-ssg | OK | Approved |
| tailwindcss | npm | 125.6M | github.com/tailwindlabs/tailwindcss | OK | Approved |
| vue-router | npm | 8.36M | github.com/vuejs/router | SUS（too-new：2026-09-02 发布） | Approved — 信号为"最近有发布"，Vue 官方仓库，非风险 |
| @unhead/vue | npm | 3.56M | github.com/unjs/unhead | SUS（too-new） | Approved — 同上，活跃维护的官方包 |
| @vueuse/core | npm | 10.96M | github.com/vueuse/vueuse | OK | Approved |
| dayjs | npm | 70.1M | github.com/iamkun/dayjs | SUS（too-new） | Approved — 官方仓库 + 超大规模下载 |
| codemirror / @codemirror/lang-json | npm | 722 万（lang-json） | github.com/codemirror/* | OK | Approved |
| @codemirror/theme-one-dark | npm | 5.62M | github.com/codemirror/theme-one-dark | OK | Approved |
| dompurify | npm | 64.3M | github.com/cure53/DOMPurify | SUS（too-new：2026-08-19 发布） | Approved — cure53 官方安全库，SUS 信号仅为近期发布 |
| @lucide/vue | npm | 496,623 | github.com/lucide-icons/lucide | SUS（too-new：2026-09-03 发布） | Approved — 官方延续包（lucide-vue-next 弃用指向它）；planner 在安装任务加 `checkpoint:human-verify` 确认包名 |
| json-bigint（备选，仅记录） | npm | 51.8M | github.com/sidorares/json-bigint | OK | Not used（推荐 tokenizer 方案） |
| lossless-json（备选，仅记录） | npm | 1.0M | github.com/josdejong/lossless-json | OK | Not used（同上） |
| vue3-json-viewer / json-tree-view-vue3（备选，仅记录） | npm | 18,022 / 4,084 | 个人仓库 | OK | REMOVED from recommendation — 生态碎片化、低下载量个人包；树视图自研（见 §Pattern 4） |
| lucide-vue-next | npm | 988,408 | github.com/lucide-icons/lucide | SUS（**deprecated**） | **REPLACED** — npm 弃用原文 "Package deprecated. Please use @lucide/vue instead."；禁用 |
| unplugin-vue-router | npm | 1.03M | github.com/posva/unplugin-vue-router | SUS（**deprecated**） | **REPLACED** — 弃用原文 "Merged into vuejs/router"；禁用 |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `@lucide/vue`（too-new，官方仓库，低风险——planner 加一个 checkpoint:human-verify 确认 `@lucide/vue` 包名后安装）、`vue-router`/`@unhead/vue`/`dompurify`/`dayjs`/`happy-dom`（全部为 "too-new" 信号 = 最近有版本发布 + 官方仓库 + 巨量下载，属活跃维护误报，无需单独 checkpoint）
**Postinstall 脚本检查：** 全部候选包 `postinstall: null` [VERIFIED: package-legitimacy signals]

## Architecture Patterns

### System Architecture Diagram

```
[浏览器/爬虫请求 /json-formatter]
        │
        ▼
┌────────────────────────── 构建期（Phase 1 已生效）─────────────────────────┐
│  create-vue 脚手架 + 手写项目结构                                          │
│  vite-ssg build：遍历路由表 → 每路由预渲染 HTML（含 @unhead/vue meta）      │
│  Vite：tools/<slug>/ 通过 () => import() → 每工具独立异步 chunk            │
│  Tailwind 4 @tailwindcss/vite：@theme 令牌 → 工具类 CSS（零运行时）        │
│  ESLint flat config：vue/no-v-html(+ignorePattern) 静态卡口               │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   ▼
┌────────────────────────── 运行期（浏览器 SPA）────────────────────────────┐
│  main.ts: ViteSSG(App, {routes}, setup)                                   │
│      routes = 注册表派生（tools.map）+ home + 404（置尾）                  │
│      setup: app.use(createHead())                                         │
│  App.vue ──route.meta.layout──▶ home.layout / tool.layout                 │
│      home.layout: 顶栏 + 工具卡片网格（消费 toolsByCategory）              │
│      tool.layout: 顶栏 + <router-view> + 返回导航                         │
│                                                                           │
│  [工具页挂载] → 工具 chunk 下载 → CodeMirror/ dayjs 首次进入内存           │
│                                                                           │
│  [用户输入] ──v-model──▶ *.service.ts 纯函数（tokenizer / dayjs）          │
│      ├─▶ 文本输出 → Vue vnode 渲染（token→span，自动转义，无 HTML 字符串） │
│      ├─▶ 树形结构 → 递归 TreeNode 组件（vnode 渲染）                       │
│      └─▶ 确需 HTML 字符串 → utils/sanitize.ts(DOMPurify) → SafeHtml       │
│              （全站唯一 v-html，ignorePattern 白名单强制）                 │
│                                                                           │
│  [复制输出] → useCopy() → useClipboard(legacy:true) → 剪贴板/降级提示     │
└───────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
little-utils/
├── package.json                  # packageManager: pnpm@11.25.0
├── vite.config.ts                # vue() + tailwindcss() + ssgOptions（includedRoutes 预留）
├── eslint.config.ts              # create-vue 生成 + no-v-html 白名单规则（见 Pattern 5）
├── index.html                    # create-vue 产物（入口改挂 createApp export）
├── src/
│   ├── main.ts                   # export const createApp = ViteSSG(App, { routes }, setup)
│   ├── App.vue                   # route.meta.layout → 动态 layout 组件
│   ├── router/
│   │   └── routes.ts             # ★ 注册表派生路由 + home + catch-all 404（置尾）
│   ├── tools/
│   │   ├── tool.ts               # ★ Tool 接口 + defineTool()（全站契约）
│   │   ├── index.ts              # ★ toolCategories + tools 数组 + 派生 helpers
│   │   ├── json-formatter/
│   │   │   ├── index.ts          # defineTool({... component: () => import('./json-formatter.vue')})
│   │   │   ├── json-formatter.vue           # 双栏视图：编辑器 | 格式化文本+树
│   │   │   ├── json-formatter.service.ts    # ★ tokenizer：format/minify/validate/tree
│   │   │   ├── json-formatter.service.test.ts
│   │   │   └── components/
│   │   │       ├── JsonTree.vue             # 递归可折叠树
│   │   │       └── CodeMirrorJson.vue       # CM6 封装（onMounted 创建/onBeforeUnmount 销毁）
│   │   └── timestamp-converter/
│   │       ├── index.ts
│   │       ├── timestamp-converter.vue
│   │       ├── timestamp-converter.service.ts   # 秒/毫秒识别、双向转换、时区显示
│   │       └── timestamp-converter.service.test.ts
│   ├── layouts/
│   │   ├── home.layout.vue       # 强风格基线（D-03：结构此阶段定型）
│   │   └── tool.layout.vue       # 克制易读
│   ├── pages/
│   │   ├── home.vue              # 不懒加载（LCP 关键页，it-tools 同款）
│   │   └── not-found.vue
│   ├── components/
│   │   └── ToolCard.vue          # 消费 Tool 元数据：icon/name/description
│   ├── composables/
│   │   └── useCopy.ts            # useClipboard(legacy:true) 统一封装（成功标准 #4）
│   ├── ui/
│   │   └── safe-html.vue         # ★ 唯一 v-html 出口
│   ├── utils/
│   │   ├── sanitize.ts           # DOMPurify 封装（含无 DOM 环境守卫）
│   │   └── with-default-on-error.ts
│   └── styles/
│       ├── tokens.css            # @import "tailwindcss" + @theme + @custom-variant dark
│       └── base.css              # reset、:root 暗色基线
└── vitest.config.ts（或并入 vite.config） # environment: happy-dom
```

### Pattern 1: defineTool 契约与注册表

**What:** `Tool` 接口 = 全站契约。字段设计原则：能派生的绝不手填（isNew 由 createdAt 派生）；五个消费方（路由/导航/搜索/收藏/sitemap）所需字段在 Phase 1 一次备齐。
**When to use:** `tools/<slug>/index.ts` 每工具导出一份；`tools/index.ts` 集中汇入。

```typescript
// src/tools/tool.ts
import type { Component } from 'vue'

/** 分类 id 必须是 tools/index.ts 中 toolCategories 的键 */
export type ToolCategoryId = 'developer' | 'office'

export interface ToolMeta {
  /** 显示名（中文优先） */
  name: string
  /** URL 路径，'/xxx' 形式，全站唯一（含 home 之外的静态页） */
  path: string
  /** SEO description + 卡片副标题（一句话中文） */
  description: string
  /** 搜索关键词：中英混合，含别名（Phase 4 fuse.js 直接消费） */
  keywords: string[]
  category: ToolCategoryId
  /** lucide 图标组件引用（D-06：契约字段，勿改为字符串） */
  icon: Component
  /** 懒加载组件：() => import('./x.vue')（ARCH-02 的 chunk 边界） */
  component: () => Promise<Component>
  /** ISO 日期 'YYYY-MM-DD'，isNew 由它派生（30 天窗口） */
  createdAt: string
}

export interface Tool extends ToolMeta {
  isNew: boolean
}

const NEW_WINDOW_DAYS = 30

export function defineTool(meta: ToolMeta): Tool {
  const created = new Date(meta.createdAt).getTime()
  return { ...meta, isNew: Date.now() - created < NEW_WINDOW_DAYS * 86_400_000 }
}
```

```typescript
// src/tools/index.ts
import { defineTool, type Tool, type ToolCategoryId } from './tool'
import { Braces, Clock } from '@lucide/vue'
import jsonFormatter from './json-formatter'
import timestampConverter from './timestamp-converter'

export const toolCategories: Record<ToolCategoryId, { name: string }> = {
  developer: { name: '开发辅助' },
  office: { name: '办公效率' },
}

/** 全站单一事实来源：新增工具 = 加目录 + 此处一行 */
export const tools: Tool[] = [jsonFormatter, timestampConverter]

// —— 派生 helpers（消费方只读这些，不碰原始数组）——
export const toolsByCategory = (): Array<{ id: ToolCategoryId; name: string; tools: Tool[] }> =>
  Object.entries(toolCategories).map(([id, c]) => ({
    id: id as ToolCategoryId,
    name: c.name,
    tools: tools.filter((t) => t.category === id),
  }))

/** dev 期不变量校验（单元测试 + 主进程 dev 断言） */
export function assertRegistryInvariants(): void {
  const paths = new Set<string>()
  for (const t of tools) {
    if (paths.has(t.path)) throw new Error(`duplicate tool path: ${t.path}`)
    if (!t.path.startsWith('/') || t.path.includes('//')) throw new Error(`bad path: ${t.path}`)
    if (!(t.category in toolCategories)) throw new Error(`unknown category: ${t.category}`)
    if (t.keywords.length === 0) throw new Error(`no keywords: ${t.path}`)
    paths.add(t.path)
  }
}
```

```typescript
// src/tools/json-formatter/index.ts —— 工具自注册
import { defineTool } from '../tool'
import { Braces } from '@lucide/vue'

export default defineTool({
  name: 'JSON 格式化',
  path: '/json-formatter',
  description: 'JSON 校验、格式化与压缩，浏览器本地完成，长数字 ID 不丢精度',
  keywords: ['json', 'format', '格式化', '校验', '美化', '压缩'],
  category: 'developer',
  icon: Braces,
  component: () => import('./json-formatter.vue'),
  createdAt: '2026-09-04',
})
```

### Pattern 2: 路由 = 注册表纯派生（已定夺：手写，不用文件路由）

**What:** 路由表是注册表的一次 `map`；通配 404 必须置尾。
**Why not 文件路由:** `unplugin-vue-router` 已弃用并入 `vue-router/vite`，但其派生源是 `pages/` 目录——本站导航/搜索/收藏/sitemap 四个消费方仍需注册表，等于两处真相（ARCHITECTURE 反模式 1）。类型安全用 `satisfies` 补偿。
**Evidence:** `npm view unplugin-vue-router deprecated` → "Merged into vuejs/router. Migrate: https://router.vuejs.org/guide/migration/v4-to-v5.html" [VERIFIED: npm registry 本会话]

```typescript
// src/router/routes.ts
import type { RouteRecordRaw } from 'vue-router'
import Home from '../pages/home.vue'          // 首页不懒加载（LCP）
import NotFound from '../pages/not-found.vue'
import { tools } from '../tools'
import { assertRegistryInvariants } from '../tools'

assertRegistryInvariants() // 路由构建即校验注册表不变量

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Home,
    meta: { layout: 'home' },
  },
  ...tools.map((tool) => ({
    path: tool.path,
    component: tool.component,          // 懒加载组件直接作为路由组件 → 独立 chunk
    meta: { layout: 'tool', tool },     // 布局选择 + 元数据进 meta（SEO 消费点）
  })),
  { path: '/:pathMatch(.*)*', component: NotFound, meta: { layout: 'home' } }, // 必须最后
]
```

```typescript
// src/router/index.d.ts 或 env.d.ts —— meta 类型增强
import 'vue-router'
declare module 'vue-router' {
  interface RouteMeta {
    layout?: 'home' | 'tool'
    tool?: import('../tools/tool').Tool
  }
}
```

### Pattern 3: CodeMirror 6 in Vue 3（D-01）

**What:** 编辑器封装为工具内组件；`onMounted` 创建 `EditorView`、`onBeforeUnmount` 销毁；通过 `watch` 把外部值同步进 editor（避免双向绑定的回环）。包全部从 `codemirror` meta 包 + 官方 scoped 包取。
**Why this way:** CM6 文档的标准组装是 `new EditorView({ extensions, parent })` [CITED: codemirror.net/docs/guide]；DOM 挂载约束天然映射到 `onMounted`（同时满足 vite-ssg 预渲染纪律——Node 里没有 DOM）。`@codemirror/lang-json` 导出 `json()` 与 `jsonParseLinter()`，配合 `@codemirror/lint` 的 `linter()` 实现错误定位（成功标准关联 TOOL-01）。

```typescript
// src/tools/json-formatter/components/CodeMirrorJson.vue（setup 核心逻辑）
import { EditorView, basicSetup } from 'codemirror'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { linter } from '@codemirror/lint'
import { oneDark } from '@codemirror/theme-one-dark'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
const host = ref<HTMLElement | null>(null)
let view: EditorView | null = null

onMounted(() => {
  view = new EditorView({
    extensions: [
      basicSetup,
      json(),
      linter(jsonParseLinter()),
      oneDark, // 暗底站点开箱即用；Phase 2 亮色主题再按 EditorView.theme 定制
      EditorView.updateListener.of((u) => {
        if (u.docChanged) emit('update:modelValue', u.state.doc.toString())
      }),
    ],
    doc: props.modelValue,
    parent: host.value!,
  })
})

watch(() => props.modelValue, (v) => {
  const current = view?.state.doc.toString()
  if (view && v !== current) view.dispatch({ changes: { from: 0, to: current?.length ?? 0, insert: v } })
})

onBeforeUnmount(() => { view?.destroy(); view = null })
```

**懒加载机制：** 组件只被 `json-formatter.vue`（工具 chunk 入口）静态引用 → CodeMirror 全部依赖自动落进该工具的异步 chunk，零额外配置。**不要**在任何共享层（ui/composables）静态 import CodeMirror。

### Pattern 4: JSON 树形视图 —— 自研递归组件（D-02）

**What:** 不引入树视图库。生态三个候选（vue3-json-viewer 2.4.1 / json-tree-view-vue3 2.0.0 / vue-json-viewer）均为低下载量个人包（4k–18k/周，[VERIFIED: package-legitimacy signals]），且无法与 tokenizer 的"数字保真"数据结构对接。自研递归组件 ~150 行，样式直接消费 @theme 令牌。
**关键设计：**
- 数据源 = tokenizer 产出的结构（数字是 raw 字符串，非 number），天然满足长 ID 显示不丢精度；
- 对象/数组节点可折叠；**默认展开深度 2**（电商深层嵌套场景：默认收起长数组，头部显示 `Array(50)` 计数徽标）；
- 数字节点当 `|n| ≥ 2^53` 时加"JS 精度不安全"小标记（提示该值在 JS 侧已是文本保真）；
- 树与"格式化文本"双栏共享同一份解析结果，解析失败时右栏显示错误 + 行/列定位。

### Pattern 5: XSS 消毒渲染管线（ARCH-04）

**What:** 两级渲染出口，全部收敛：
1. **默认路径（优先）**：一切"用户输入 → 显示"用 Vue vnode 渲染（插值/`:props`/token→span 的 render 函数）。框架自动转义，**根本不产生 HTML 字符串**——JSON 工具两条输出（格式化文本、树视图）都走这条路径，实际零 v-html。
2. **HTML 字符串路径（未来工具用）**：`utils/sanitize.ts` → `ui/safe-html.vue`，全站唯一 v-html。

```typescript
// src/utils/sanitize.ts
import DOMPurify from 'dompurify'

/**
 * 消毒任意 HTML 字符串。
 * 无 DOM 环境（vite-ssg 预渲染/Node 测试）时退化为纯转义，保证构建期安全。
 * DOMPurify 官方：Node 中需显式传 jsdom window；浏览器自动绑定 window。
 * [CITED: github.com/cure53/DOMPurify README]
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') return escapeHtml(dirty)
  return DOMPurify.sanitize(dirty, { ALLOWED_URI_REGEXP: /^(?:https?|mailto|tel):/i })
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
```

```vue
<!-- src/ui/safe-html.vue —— 全站唯一允许 v-html 的组件 -->
<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="safe-html" v-html="sanitizedHtml" />
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { sanitizeHtml } from '../utils/sanitize'
const props = defineProps<{ html: string }>()
const sanitizedHtml = computed(() => sanitizeHtml(props.html))
</script>
```

**ESLint 强制（flat config）：**

```typescript
// eslint.config.ts —— 在 create-vue 生成物上追加/覆盖
import pluginVue from 'eslint-plugin-vue'

export default [
  // ...create-vue 生成的配置
  {
    rules: {
      // 全局禁止 v-html；变量名以 sanitized 开头的绑定豁免（= SafeHtml 组件专用）
      'vue/no-v-html': ['error', { ignorePattern: '^sanitized' }],
    },
  },
]
```

**机制说明 [VERIFIED: eslint.vuejs.org/rules/no-v-html.html 本会话抓取]：** 该规则报告**所有** v-html 用法，包含于 `flat/recommended` preset；**唯一豁免选项是 `ignorePattern`**（对绑定变量名做正则匹配），没有单行豁免。因此白名单机制 = "绑定变量必须叫 `sanitized*`"，而 `sanitized*` 命名只能来自 `sanitizeHtml()` 的返回值——出口被类型 + lint 双重收敛。code review 红线：出现 `innerHTML`/`insertAdjacentHTML` 同样告警（可用 `no-restricted-properties` 追加）。

### Pattern 6: JSON tokenizer（TOOL-01 的正确性核心）

**What:** `json-formatter.service.ts` 是纯函数模块：手写 JSON tokenizer（字符串/数字/标点/字面量四种 token），产出：
- `formatJson(text, indent)` → 格式化文本（**数字与键名逐字拷贝**，永不经过 JS number）；
- `minifyJson(text)` → 压缩文本；
- `validateJson(text)` → `{ ok, error: { line, column, message } }`（tokenize 失败即报错并给行列；另用 `JSON.parse` try/catch 交叉校验语法合法性）；
- `buildTree(text)` → 树形结构（数字节点 `{ type: 'number', raw: '9052710354240385291' }`）。

**Why（禁止 JSON.parse+stringify 主路径的原因）：**
1. `JSON.parse` 对 ≥ 2^53 整数静默舍入（IEEE 754，多源一致 [VERIFIED: 多来源交叉]）——电商订单号/雪花 ID 必炸，TOOL-01 明确要求不丢精度；
2. `JSON.stringify(obj, null, 2)` 会**重排数字型键**（JS 对象语义），格式化器悄悄改数据形状不可接受；
3. json-bigint 可做字符串层往返（README 已验证 `s === stringify(parse(s))`）但引入运行时依赖且对象层往返类型不可逆；tokenizer 约 100 行、零依赖、一份解析喂四个功能。
**纪律：** service 零 Vue/DOM 依赖；必须用"合法 JSON 往返 = 原文规范化后逐 token 相等"的属性测试对拍。

### Pattern 7: 时间戳转换（TOOL-02）

**What:** dayjs + `utc` + `timezone` 插件；**`dayjs.extend(utc)` 必须先于 `dayjs.extend(timezone)`**（官方明确依赖顺序）[CITED: dayjs 官方 plugin-timezone 文档]。

```typescript
// timestamp-converter.service.ts 关键逻辑
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)       // 必须在前
dayjs.extend(timezone)

/** 10 位=秒，13 位=毫秒；其余长度按位数启发判定并在 UI 回显识别结果（防 1000 倍错判） */
export function detectUnit(ts: string): 's' | 'ms' | 'invalid' {
  if (!/^-?\d+$/.test(ts.trim())) return 'invalid'
  const len = ts.replace('-', '').length
  if (len <= 11) return 's'
  if (len <= 14) return 'ms'
  return 'invalid'
}

export function fromTimestamp(ts: string, tz?: string) {
  const unit = detectUnit(ts)
  const d = unit === 's' ? dayjs.unix(Number(ts)) : dayjs(Number(ts))
  return {
    detectedUnit: unit,
    local: d.format('YYYY-MM-DD HH:mm:ss'),          // 浏览器本地时区
    utc: d.utc().format('YYYY-MM-DD HH:mm:ss'),      // UTC
    offset: d.format('Z'),                            // '+08:00'
    timeZone: dayjs.tz.guess(),                       // IANA 名，如 Asia/Shanghai
    target: tz ? d.tz(tz).format('YYYY-MM-DD HH:mm:ss Z') : null,
  }
}

/** 反向：日期时间 → 时间戳（毫秒/秒） */
export function toTimestamp(input: string, tz?: string) {
  const d = tz ? dayjs.tz(input, tz) : dayjs(input)
  return { ok: d.isValid(), ms: d.valueOf(), sec: d.unix() }
}
```

**时区下拉：** 用 `Intl.supportedValuesOf('timeZone')` 枚举（现代浏览器全支持；失败时降级为手填 IANA 名 + 常用列表）[ASSUMED: 运行时可用性，需在实现时特性检测]。
**UI 纪律（PITFALLS checklist）：** 每次转换回显"识别为秒/毫秒 + 原始输入"，防错判；输出区一键复制走 `useCopy`。

### Anti-Patterns to Avoid
- **手写静态路由表 / 文件路由双真相：** 路由只能从 `tools.map()` 派生（见 Pattern 2）。
- **共享层静态 import CodeMirror：** CM 只能被工具 chunk 引用，否则首包 +45KB gz（违反 ARCH-02）。
- **把注册表写成"元数据在 A 文件、组件在 B 文件"：** 一个工具一个自包含目录，`index.ts` 内闭包引用自己的 `.vue`，删目录即删工具。
- **`JSON.parse`+`JSON.stringify` 当格式化主路径：** 精度丢失 + 键重排双重破坏（见 Pattern 6）。
- **在共享组件里硬编码霓虹色值：** 只消费 `@theme` 生成的语义类/变量；Phase 2 调色盘时零改动。
- **挂载前读 `localStorage`/`window`：** Phase 1 就用 `vite-ssg build`，模块顶层碰浏览器 API 构建即炸（这是特性不是 bug）。Phase 1 本身无 localStorage 读写（收藏是 Phase 4），但守卫模式从本阶段建立。
- **动画动 `box-shadow`/`text-shadow`：** Phase 1 的发光基线用伪元素静态阴影 + opacity/transform 过渡。

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML 消毒 | 正则过滤 `<script>` | DOMPurify（cure53） | 绕过向量无穷（SVG/MathML/属性上下文/编码）；官方 9 平台自动化测试 |
| 剪贴板 | 裸调 `navigator.clipboard` | @vueuse/core `useClipboard(legacy: true)` | 安全上下文检测 + execCommand 降级 + 权限拒绝反馈，一个 composable 全站复用 |
| 编辑器 | 自研 textarea 增强 | CodeMirror 6 | 行号/高亮/linter/移动端，Monaco 2.5MB 被项目明确排除 |
| 暗色主题基建 | 手写 class 切换引擎 | Tailwind `@custom-variant dark`（Phase 1 声明，Phase 2 启用） | 官方机制，VueUse useDark 兼容 |
| 日期时区 | 手算 UTC 偏移/DST | dayjs utc+timezone 插件 | DST 边界、IANA 数据、偏移格式化全是坑 |
| route 类型增强 | 自己 patch router 类型 | `declare module 'vue-router'` 合并 `RouteMeta` | TS 标准增强点，升级无冲突 |

**例外（允许且必须手写）：** JSON tokenizer——见 Pattern 6，"手写"正是工具的核心价值（库方案都绕不开数字/键序的破坏性转换）。**禁止**手写：BigInt 运算器（不需要运算，只需保真显示）、HTML 解析器。

## Runtime State Inventory

> 不适用：greenfield 首阶段，无 rename/refactor/migration。工作区无既有代码（`list_dir` 确认仅 `.planning/`、`.codebuddy/` 配置目录）。**五类逐项回答：**
>
> | Category | Items Found | Action Required |
> |----------|-------------|-----------------|
> | Stored data | None — 无任何数据库/存储（纯前端首阶段，localStorage 也未使用） | 无 |
> | Live service config | None — 无外部服务 | 无 |
> | OS-registered state | None — 无 OS 级注册 | 无 |
> | Secrets/env vars | None — 无密钥；后续 VITE_* 变量需进 `.env.example` | 无 |
> | Build artifacts | None — 无已安装产物；注意 `node_modules` 由 pnpm 全新生成 | 无 |

## Common Pitfalls

### Pitfall 1: v-html 渗漏回潮
**What goes wrong:** 某个工具图省事直接 `v-html` 渲染高亮输出，管线被架空。
**Why:** Vue 自动转义制造"安全错觉"；highlight 输出"看起来像安全 HTML"。
**How to avoid:** `vue/no-v-html: ['error', { ignorePattern: '^sanitized' }]` 全局生效 + CI 跑 lint；渲染优先 vnode 路径；注入用例进测试集（见 Validation Architecture）。
**Warning signs:** `grep -r "v-html" src/` 出现 SafeHtml 之外的命中；`innerHTML` 出现在工具代码。

### Pitfall 2: CodeMirror 混入首包
**What goes wrong:** 在 ui/composables 层 import CodeMirror，或工具被 home 页静态引用 → 首包 +45KB gz。
**Why:** "先 import 再说"；linter/IDE 自动补全把 import 放到共享文件。
**How to avoid:** 依赖方向 lint（工具间 & 工具→pages 禁止 import）；`pnpm build` 产物检查 `dist/assets/index-*.js` 体积不含 CM（可加 size 预算脚本）。
**Warning signs:** 首页 chunk 出现 `@codemirror` 字样；`vite build` 输出中只有一个大 chunk。

### Pitfall 3: 模块顶层碰浏览器 API
**What goes wrong:** `const tz = dayjs.tz.guess()` 写在模块顶层——`vite-ssg build` 在 Node 预渲染时抛错。
**Why:** SPA 开发期无感；预渲染跑在 Node（无 window/localStorage/navigator）。
**How to avoid:** 浏览器 API 只出现在 `onMounted`/事件回调/`isClient` 分支内；service 纯函数接受参数而不是自己读环境。vite-ssg `--mock` flag 是兜底而非解法。
**Warning signs:** 本地 `pnpm dev` 正常但 `pnpm build` 报 `window is not defined`。

### Pitfall 4: 双 layout 接缝漏液
**What goes wrong:** 工具区被赛博朋克装饰污染，或首页卡片网格样式写进 tool.layout。
**Why:** 单 layout 开发习惯；样式全局泄漏。
**How to avoid:** layout 只提供 `<slot>`/`<router-view>` 与各自 chrome；工具页样式全部 scoped + 语义类；`ui/` 中性组件兜底工具区可读性（D-03 契约）。
**Warning signs:** tool.layout 出现 glow 动画类；home 组件 import 了工具内部组件。

### Pitfall 5: Tokenizer 的 Unicode/转义边界
**What goes wrong:** 手写 tokenizer 在 `"\u0041"`、`"\\`、BOM、四字节 emoji 上出错。
**Why:** JSON 字符串转义规则细碎。
**How to avoid:** 按 ECMA-404 文法实现（字符串只有 `\" \\ \/ \b \f \n \r \t \uXXXX` 八种转义）；测试集必须含：空对象/数组、嵌套 10+ 层、长数组、`2^53` 边界整数、负数/指数、BOM、emoji 键、重复键（保持原序）。
**Warning signs:** 往返属性测试（合法 JSON 规范化后逐 token 相等）失败。

### Pitfall 6: `packageManager` 缺失导致 corepack 装错版本
**What goes wrong:** 团队/CI 用不同 pnpm 大版本，lockfile 格式漂移。
**How to avoid:** `package.json` 写 `"packageManager": "pnpm@11.25.0"`；本机 `pnpm` alias 已损坏（nvm 包装），统一 `corepack pnpm` 或 `corepack enable`。 [VERIFIED: 本会话环境探测]

### Pitfall 7: create-vue 模板残留
**What goes wrong:** `--bare` 之外的示例组件（HelloWorld 等）与模板 router 残留，与注册表路由并存。
**How to avoid:** 脚手架后第一个任务就是清理：删除模板 views/components、重写 `src/router`、`main.ts` 换 ViteSSG 包装。
**Warning signs:** `grep -r "HelloWorld" src/` 有命中；`/about` 路由意外存在。

## Code Examples

已验证模式汇总（来源标注在各 Pattern 内）：

### vite.config.ts（Phase 1 完整形态）
```typescript
// Source: Context7 /antfu-collective/vite-ssg + /websites/tailwindcss
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  ssgOptions: {
    // Phase 3 起：includedRoutes 过滤、onFinished 生成 sitemap、每路由 meta 验证
    includedRoutes(paths, routes) {
      return paths.filter((p) => !p.includes(':')) // 暂不预渲染 catch-all 404
    },
  },
})
```

### main.ts（ViteSSG 包装入口）
```typescript
// Source: Context7 /antfu-collective/vite-ssg README
import { ViteSSG } from 'vite-ssg'
import { createHead } from '@unhead/vue/client' // v2+ 子路径导出 [CITED: unhead.unjs.io migration]
import App from './App.vue'
import { routes } from './router/routes'
import './styles/tokens.css'
import './styles/base.css'

export const createApp = ViteSSG(
  App,
  { routes, base: import.meta.env.BASE_URL }, // history 由 vite-ssg 自动注入
  ({ app }) => {
    app.use(createHead())
  },
)
```

### Tailwind 4 设计令牌（D-04/D-05 地基）
```css
/* Source: tailwindcss.com/docs/colors /docs/theme /docs/dark-mode（Context7 官方文档） */
/* src/styles/tokens.css */
@import "tailwindcss";

/* Phase 2 启用类切换暗色；Phase 1 先声明不启用 */
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* —— 霓虹原色（oklch）—— */
  --color-neon-cyan: oklch(0.85 0.16 195);
  --color-neon-magenta: oklch(0.72 0.24 330);
  --color-neon-yellow: oklch(0.92 0.19 105);

  /* —— 暗色语义底（Phase 1 默认主题）—— */
  --color-bg: oklch(0.16 0.02 260);
  --color-surface: oklch(0.2 0.025 260);
  --color-surface-raised: oklch(0.24 0.03 260);
  --color-text-primary: oklch(0.93 0.01 260);
  --color-text-muted: oklch(0.65 0.02 260);
  --color-border: oklch(0.3 0.03 260);

  /* —— 字体 —— */
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;

  /* —— 发光阴影（静态；动画只碰 opacity/transform）—— */
  --shadow-glow-cyan: 0 0 12px oklch(0.85 0.16 195 / 0.35);
  --shadow-glow-magenta: 0 0 12px oklch(0.72 0.24 330 / 0.3);
}
```
> 具体数值为设计占位 [ASSUMED]，Phase 2 按"正文对比度 ≥ 4.5:1"全量校验调整；结构（`--color-*`/`--font-mono`/`--shadow-*` 命名空间）是官方文法，已验证。

### 布局切换（App.vue）
```vue
<!-- route.meta.layout 驱动；布局不感知具体工具（D-03 接缝） -->
<template>
  <component :is="layout">
    <router-view />
  </component>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import HomeLayout from './layouts/home.layout.vue'
import ToolLayout from './layouts/tool.layout.vue'

const route = useRoute()
const layout = computed(() => (route.meta.layout === 'tool' ? ToolLayout : HomeLayout))
</script>
```

### useCopy（成功标准 #4 基建）
```typescript
// Source: VueUse useClipboard 文档（legacy 选项提供 execCommand 降级）
import { useClipboard } from '@vueuse/core'

export function useCopy() {
  // legacy: true → Clipboard API 不可用时降级 document.execCommand('copy')
  const { copy, copied, isSupported } = useClipboard({ legacy: true, copiedDuring: 1500 })
  return { copy, copied, isSupported }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `unplugin-vue-router` 独立包 | 并入 vue-router 5（`vue-router/vite` 插件） | v5 发布（迁移指南在案） | 本项目不受影响（选了手写派生）；若未来要文件路由，装 vue-router 即得 |
| `lucide-vue-next` | `@lucide/vue` | npm 弃用声明（本会话读取） | D-06 安装包名修正；图标 API/仓库不变 |
| Tailwind 3 config 文件 | v4 CSS-first `@theme` | 2025-01 v4 GA | 无 tailwind.config.js；令牌即 CSS 变量 |
| `@unhead/vue` 单入口 | v2+ `/client` `/server` 子路径导出 | v2 | main.ts 导入路径注意 |
| ESLint eslintrc | flat config（eslint-plugin-vue 10.x 仅 flat） | ESLint 9/10 | create-vue 默认生成 eslint.config.ts |
| JSON 格式化 = parse+stringify | 保真 formatter（数字/键序逐字保留） | —— | 精度要求（TOOL-01）下唯一正确形态 |

**Deprecated/outdated（本项目相关）：**
- `lucide-vue-next`：弃用 → `@lucide/vue` [VERIFIED: npm registry]
- `unplugin-vue-router`：并入 vuejs/router → `vue-router/vite` [VERIFIED: npm registry + router.vuejs.org]
- TypeScript 7.0.2（Go 编译器首版）：registry latest，但 vue-tsc 生态未验证 → 锁 5.9.3 [VERIFIED: npm registry；决策沿用项目调研]
- Vue 3.6-rc：非生产就绪 → 3.5.42

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | oklch 令牌具体数值（0.85/0.16/195 等）为设计占位，未经对比度校验 | Code Examples / tokens.css | Phase 2 校验时需调值（结构不变，低风险） |
| A2 | `@lucide/vue` 组件 API 与 lucide-vue-next 一致（`import { Braces } from '@lucide/vue'`） | Standard Stack / Pattern 1 | 若导入名不同，工具注册处小幅改写（同仓库延续包，低风险；实现时以包 README 为准） |
| A3 | `@unhead/vue` v3 在 ViteSSG setup 中 `app.use(createHead())`（client 子路径导入）即可工作 | main.ts 示例 | 若 v3+vite-ssg 接线变化，Phase 1 可退化为 router.afterEach 设 `document.title`（useHead 是 Phase 3 元体系的一部分，接口契约不受影响） |
| A4 | DOMPurify 3.4.14 在 happy-dom 测试环境下可正常运行 | Validation Architecture | 个别用例可能需 `// @vitest-environment jsdom` 回退（官方 jsdom 支持在案） |
| A5 | vitest 5.0.0 与 create-vue 生成的 @vitejs/plugin-vue/vue-tsc 配置兼容 | Standard Stack | 若 peer 冲突，采 create-vue 锁定版本即可（测试命令不变） |
| A6 | `Intl.supportedValuesOf('timeZone')` 在目标浏览器可用 | Pattern 7 | 降级为常用时区列表 + 手填（实现时特性检测一行代码） |
| A7 | vite-ssg `includedRoutes` 过滤 `:` 路由后，404 catch-all 不参与预渲染、运行时兜底可用 | Code Examples / vite.config | 若 Phase 1 build 对 catch-all 报错，改为排除该路由或在 Phase 3 一并处理（不阻塞本阶段验收） |

## Open Questions

1. **`@lucide/vue` 安装确认（checkpoint:human-verify）**
   - What we know: lucide-vue-next 弃用声明指向它；同仓库、非弃用、周下载 49.7 万。
   - What's unclear: 图标导出名/按需导入行为是否与旧包逐字一致。
   - Recommendation: 安装前打开包 README 核对一次导入示例（planner 加 checkpoint 任务）。
2. **vue-tsc 3.3.11 + TS 5.9.3 + Vite 8 的类型检查耗时**
   - What we know: 版本兼容官方声明在案（vue-tsc peer `>=5.0.0`）。
   - What's unclear: 大目录 `tools/` 增长后 type-check 时长。
   - Recommendation: Phase 1 不处理；纳入 Phase 5 批量工具时观察。
3. **首包体积预算的具体阈值脚本形态**
   - What we know: 项目调研定了"首包 gzip ≤ 200KB"（Phase 3 CI 卡口）。
   - What's unclear: 用 size-limit 还是自写脚本、卡在哪个 chunk。
   - Recommendation: Phase 1 只交付"构建产物 chunk 清单人工核对"（轻量），正式预算卡口随 Phase 3 部署管线交付。

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite 8 / vite-ssg / 工具链 | ✓ | v24.18.0 | — |
| pnpm | 包管理（项目决策） | ✗（alias 损坏） | — | **corepack 0.35.0 → `corepack pnpm` 实测 11.25.0 可用**；packageManager 字段固定版本 |
| corepack | pnpm 供给 | ✓ | 0.35.0 | — |
| git | 版本管理/提交 | ✓ | 2.50.1 | — |
| npm registry | 包安装/验证 | ✓ | — | — |

**Missing dependencies with no fallback:** none（pnpm 有 corepack 回退路径，已实测）
**Missing dependencies with fallback:** pnpm 直装缺失 → `corepack enable`（或每条命令 `corepack pnpm`）；建议执行者首个任务先跑 `corepack enable pnpm` 消除别名问题。

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest（create-vue --vitest 生成版）+ @vue/test-utils 2.5.0 + happy-dom |
| Config file | `vitest.config.ts`（create-vue 生成；确认 `environment: 'happy-dom'`，若模板为 jsdom 改 happy-dom） |
| Quick run command | `corepack pnpm vitest run src/tools` |
| Full suite command | `corepack pnpm vitest run && corepack pnpm type-check && corepack pnpm lint` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ARCH-01 | 注册表不变量：路径唯一/格式合法/分类存在/keywords 非空；isNew 派生正确 | unit | `corepack pnpm vitest run src/tools/registry.test.ts` | ❌ Wave 0 |
| ARCH-01 | 路由派生：`routes` 含全部 tool.path + home + 404 置尾；404 路由为最后一条 | unit | `corepack pnpm vitest run src/router/routes.test.ts` | ❌ Wave 0 |
| ARCH-02 | 工具懒加载：Tool.component 为函数；`vite-ssg build` 产物中每个工具独立 chunk、首包不含 @codemirror 字符串 | build gate | `corepack pnpm build` + 产物 grep（脚本化） | ❌ Wave 0（脚本） |
| ARCH-04 | sanitizeHtml：`<script>`、`<img onerror>`、`javascript:` URL、事件属性全部剥离；无害文本保留 | unit | `corepack pnpm vitest run src/utils/sanitize.test.ts` | ❌ Wave 0 |
| ARCH-04 | SafeHtml：mount 后注入载荷不产生可执行节点；ESLint：`grep v-html src/` 仅 safe-html.vue 命中 | component + lint gate | `corepack pnpm vitest run src/ui/safe-html.test.ts && corepack pnpm lint` | ❌ Wave 0 |
| TOOL-01 | tokenizer：合法 JSON 往返逐 token 相等（含 2^53 大整数、指数、BOM、emoji、重复键、深层嵌套、长数组） | unit（属性化用例） | `corepack pnpm vitest run src/tools/json-formatter/json-formatter.service.test.ts` | ❌ Wave 0 |
| TOOL-01 | validate 错误定位：缺引号/尾逗号等返回正确 line/column | unit | 同上 | ❌ Wave 0 |
| TOOL-02 | 秒/毫秒识别边界（10/11/13/14 位、负数、非数字）；双向转换；时区偏移格式 `Z` | unit | `corepack pnpm vitest run src/tools/timestamp-converter/timestamp-converter.service.test.ts` | ❌ Wave 0 |
| 成功标准 #4 | useCopy 在 happy-dom 下可调用（剪贴板 mock） | component | `corepack pnpm vitest run src/composables/useCopy.test.ts` | ❌ Wave 0 |
| 手工（不自动化） | 真机/真浏览器剪贴板权限、iOS 行为 | manual-only | Phase 2 响应式基线一并走查；本阶段 dev 手测记录 | — |

### Sampling Rate
- **Per task commit:** `corepack pnpm vitest run src/tools`（受影响目录）
- **Per wave merge:** 全套（vitest + type-check + lint）
- **Phase gate:** 全套 + `corepack pnpm build`（vite-ssg 预渲染成功 = 预渲染纪律的 Nyquist 信号）+ 产物 chunk 检查（ARCH-02）+ `pnpm lint` 通过（ARCH-04 静态卡口）

### Wave 0 Gaps
- [ ] `src/tools/registry.test.ts`、`src/router/routes.test.ts` — ARCH-01
- [ ] `src/utils/sanitize.test.ts`、`src/ui/safe-html.test.ts` — ARCH-04（含 `<script>`/`<img onerror>` 注入样本集，来自 CONTEXT `<specifics>` 验收标准）
- [ ] 两个工具的 `*.service.test.ts` — TOOL-01/02
- [ ] `scripts/check-chunks.mjs`（或等价）— 构建产物断言：工具 chunk 分离、首包无 @codemirror
- [ ] 测试环境确认：create-vue 默认 jsdom → 改 happy-dom 并保留回退注释（A4）

## Security Domain

> `security_enforcement: true`（config.json），ASVS Level 1。

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | 纯前端无账户体系（项目 Out of Scope） |
| V3 Session Management | no | 无会话 |
| V4 Access Control | no | 无受保护资源 |
| V5 Input Validation & Sanitization | **yes（本阶段核心）** | 唯一渲染出口：vnode 优先 + `sanitizeHtml()`（DOMPurify）+ ESLint `vue/no-v-html` 全局 error |
| V6 Cryptography | no | 本阶段无加密需求（Web Crypto 属 Phase 5 哈希工具） |
| V7 Error Handling | yes（轻量） | service 返回结构化错误 `{ok,error}`，不裸抛；错误文案不内插原始输入片段超长（限流） |
| V14 Configuration | yes（轻量） | 零第三方外链（全部依赖本地打包）；`packageManager` 锁版本；依赖合法性审计（上文） |

### Known Threat Patterns for 纯前端格式化工具站

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| 粘贴载荷 XSS（`<script>`/`<img onerror>`/闭合逃逸） | Tampering / Elevation of Privilege | vnode 自动转义优先；HTML 字符串必须过 DOMPurify 唯一出口；注入样本测试集回归 |
| 反射型 XSS（本阶段无 URL 传参，Phase 7 DIFF-01 引入） | Tampering | 预防性设计：分享链接届时只传数据不传标记、走同一渲染管线（已写入管线设计原则） |
| localStorage 窃取/篡改 | Tampering | 本阶段零 localStorage 使用；PITFALLS 纪律"绝不把用户输入写入 localStorage"自 Phase 4 收藏功能起强制 |
| 供应链投毒（恶意 npm 包） | Tampering | package-legitimacy gate 已跑（上文审计表）；锁版本 + lockfile 提交；postinstall 全空已验证 |
| tabnabbing（Phase 4+ 外链） | Tampering | 届时全局 `rel="noopener noreferrer"`（DOMPurify hook 模式已研究在案） |

## Sources

### Primary (HIGH confidence)
- npm registry（2026-09-04 本会话实时查询）— 全部版本号、`lucide-vue-next`/`unplugin-vue-router` 弃用声明、`typescript@5.9.3` 存在性
- `gsd-tools query package-legitimacy check`（本会话）— 合规信号（downloads/repo/postinstall/deprecated）
- Context7 `/antfu-collective/vite-ssg` — ViteSSG 入口、includedRoutes、ClientOnly、onFinished、dev=`vite`/build=`vite-ssg build`
- Context7 `/websites/tailwindcss` — `@theme`、oklch 色板、`@custom-variant dark`、`--shadow-*`/`--animate-*`
- Context7 `/websites/codemirror_net` — EditorView 组装、`linter()`、oneDark、baseTheme
- Context7 `/cure53/dompurify` — sanitize 用法、jsdom/Node、afterSanitizeAttributes hook
- Context7 `/iamkun/dayjs` — utc/timezone 插件链、unix/valueOf、Z/ZZ、tz.guess()
- Context7 `/vitest-dev/vitest` — environment 配置、vi.stubGlobal
- eslint.vuejs.org/rules/no-v-html.html（本会话抓取）— 规则行为与 ignorePattern
- router.vuejs.org/guide/migration/v4-to-v5.html（本会话抓取）— unplugin 并入与 `vue-router/vite` 替代
- create-vue `--help` 实际输出（本会话运行）— feature flags 全集
- unhead.unjs.io 迁移指南 — v2+/v3 子路径导出与 vite 插件
- corepack 实测（本会话）— pnpm 11.25.0 供给路径

### Secondary (MEDIUM confidence)
- json-bigint README（GitHub raw 抓取）— storeAsString 行为与往返限制
- `.planning/research/{STACK,ARCHITECTURE,PITFALLS}.md`（项目既有调研，it-tools 源码级验证）— 注册表模式、it-tools Tool 接口形状、部署约束
- WebSearch 多源交叉 — JSON.parse 2^53 精度丢失共识、Vue 3 树视图库生态碎片化

### Tertiary (LOW confidence)
- 无（未采信任何单源未验证结论；低置信项全部归入 Assumptions Log）

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 版本与弃用状态全部本会话 registry 实查；两个弃用包的替代路径一手确认
- Architecture: HIGH — 注册表模式有 it-tools 源码级先例 + 官方文档（vite-ssg/Tailwind/CM6）逐项验证
- Pitfalls: HIGH — 大部分为官方文档背书（SSG 纪律、no-v-html 机制、dayjs 插件顺序）；tokenizer 细节以测试集兜底
- 工具实现细节（UI 布局/令牌色值）: MEDIUM — 属设计决策，已全部登记 Assumptions Log

**Research date:** 2026-09-04
**Valid until:** 2026-10-04（稳定栈；lucide/vue-router 生态变动需关注 registry）

---
*Phase: 1-应用骨架与工具注册表契约*
*Research completed: 2026-09-04*
