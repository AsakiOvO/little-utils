# Walking Skeleton — little-utils

**Phase:** 1
**Generated:** 2026-09-04
**Mode:** MVP（tracer-first）+ Walking Skeleton

## Capability Proven End-to-End

> **用户打开站点（dev server 或 vite-ssg 构建产物）→ 首页看到按分类组织的工具卡片网格 → 进入 `/timestamp-converter` 完成 Unix 时间戳与日期时间的双向转换（含时区显示）→ 一键复制结果——全程浏览器本地完成，零网络请求，数据不出浏览器。**

这条最薄的真实路径一次性打通本项目的全部架构层：`pnpm` 脚手架 → Tailwind 4 设计令牌 → `defineTool()` 注册表契约 → 注册表派生路由（懒加载）→ 双 layout → 工具自包含目录（service + page + 自注册）→ 共享 composable（useCopy）→ `vite-ssg build` 预渲染。后续 12 个工具与全部站点能力都在这条已验证的路径上做**扩展**，不再新开架构。

**用户故事（源自 ROADMAP Phase 1 Goal）：** **作为** 开发者与办公用户，**我想** 打开网站就立即用 JSON 格式化、时间戳转换完成真实操作（浏览器本地完成、数据不出浏览器），**以便** 秒级搞定日常高频小任务且无需登录或上传任何数据；同时"注册表 → 路由/导航/分包"派生机制与 XSS 消毒渲染管线作为全站契约定型，后续工具零改动接入。

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Vue 3.5.42 + Vite 8.2.2（create-vue 3.23.0 `--ts --router --vitest --eslint --prettier --bare`） | 中文生态第一梯队，SFC 模型适配"每工具一个自包含目录"；勿用 Vue 3.6-rc / TS 7（RESEARCH 已验证排除） |
| Package manager | pnpm 11.25.0（`package.json` 写死 `"packageManager": "pnpm@11.25.0"`，经 corepack 供给） | 本机 pnpm alias 损坏，corepack 0.35.0 实测可用；锁版本防 lockfile 漂移 |
| Styling | Tailwind CSS 4.3.3 + `@tailwindcss/vite`；`src/styles/tokens.css` 用 `@theme` 定义霓虹青/品红/电光黄 oklch 令牌 + 暗色语义底 | v4 CSS-first 零运行时；D-04 提前落令牌、D-05 声明 `@custom-variant dark` 但不启用（Phase 2 只补切换） |
| SSG / Build | vite-ssg 28.3.0：`dev` = `vite`，`build` = `vite-ssg build`（Phase 1 起即生效） | 让"模块顶层不碰浏览器 API"纪律从第一天就被构建验证；完整 SEO meta 是 Phase 3 |
| Routing | vue-router 5.3.1，**手写注册表派生**：`routes = home + tools.map() + catch-all 404（置尾）` | 文件路由（unplugin-vue-router 已并入 vue-router/vite）与"注册表单一事实来源"相抵触；unplugin 包已弃用，排除 |
| State | **零状态**：不装 Pinia，无 localStorage 读写 | Phase 1 无跨组件状态；收藏（useLocalStorage）归 Phase 4 |
| Icons | `@lucide/vue`（lucide-vue-next 已弃用），注册表 `icon` 字段存**组件引用**（D-06 契约字段） | 按需导入 tree-shake 后每图标 <1KB；icon 字段类型是 defineTool 契约的一部分（costly 可逆性，安装前有人工供应链闸门） |
| Rendering 安全基线 | vnode 优先（Vue 自动转义，不产生 HTML 字符串）+ `utils/sanitize.ts`(DOMPurify) + `ui/safe-html.vue` 全站唯一 HTML 字符串出口 + ESLint 白名单卡口 | ARCH-04 契约：粘贴脚本载荷只渲染为纯文本，结构性不可能执行 |
| Editor | CodeMirror 6（meta 包 basicSetup + @codemirror/lang-json），只被工具 chunk 静态引用 | D-01：~45KB gz 随工具路由懒加载，不进首屏；共享层禁止 import（Pitfall 2） |
| Deployment target | 静态产物（`dist/`，vite-ssg 预渲染）；EdgeOne Pages 公网部署归 Phase 3 | 骨架阶段以本地 `build` + `vite preview` 验证全栈可运行 |
| Directory layout | `src/tools/<slug>/` 自包含目录（index.ts 自注册 + .vue + service + tests）+ `src/tools/index.ts` 单一事实来源；路由/导航/搜索/收藏/sitemap 五消费方只读派生 | it-tools 源码级验证模式；"新增工具 = 加目录 + 注册表一行"是 Phase 5/8 批量复制的接入点 |

## Stack Touched in Phase 1

- [x] Project scaffold（Vite 8 + Vue 3.5 + TS 5.9.3 + ESLint flat + Prettier + Vitest happy-dom）
- [x] Routing — 注册表派生的真实路由（home / 工具路由 / 404 置尾），路由级懒加载 chunk
- [x] 数据层等价物 — `defineTool()` 注册表契约（纯前端无 DB；注册表即全站数据源，含不变量校验与单测）
- [x] UI — 一个真实工具交互闭环：时间戳双向转换 + 时区显示 + 一键复制（useClipboard legacy 降级）
- [x] Deployment — `corepack pnpm build`（vite-ssg 预渲染）+ `vite preview` 本地全栈验证；EdgeOne 公网部署在 Phase 3 接管

## Out of Scope (Deferred to Later Slices)

> 明确排除，防止后续阶段重新翻案 Phase 1 的最小化决策：

- 亮色主题切换、reduced-motion 降级、对比度校验（Phase 2 —— 令牌结构本阶段已定型，只补切换）
- 每路由 SEO meta 全量、sitemap.xml/robots.txt、EdgeOne 部署与体积预算 CI 卡口（Phase 3）
- 首页搜索、收藏/最近使用、隐私声明页（Phase 4）
- 其余 11 个工具（Phase 5 / Phase 8）
- 赛博朋克强风格化 glow/glitch/HUD（Phase 6 —— Phase 1 只做克制基线，动画不碰 box-shadow）
- URL 状态编码、Cmd+K 命令面板、PWA（Phase 7）

## Subsequent Slice Plan

每个后续阶段在本骨架之上叠加一个垂直切片，**不改动**上表架构决策：

- Phase 2: 设计系统与响应式/可访问性基线（令牌校验、暗色切换、基础组件库）
- Phase 3: 预渲染 SEO 与 EdgeOne 部署管线（每路由 meta、sitemap、公网可用）
- Phase 4: 站点级体验（分类首页充实、fuse.js 搜索、收藏/最近使用）
- Phase 5: 开发辅助工具批量补齐（7 工具，"加目录 + 注册表一行"模式复制）
- Phase 6: 赛博朋克视觉强化（首页/导航装饰层）
- Phase 7: 差异化增强（URL 状态/命令面板/PWA）
- Phase 8: 办公效率双线第一批（图片/Markdown/颜色）

## 本阶段"Artifacts this phase produces"总清单（与各 PLAN 同步维护）

**共享契约与基建：** `ToolMeta`/`Tool`/`ToolCategoryId` 类型、`defineTool()`、`toolCategories`/`tools` 常量、`toolsByCategory()`、`assertRegistryInvariants()`、`routes` 派生路由、`RouteMeta` 增强（`layout`/`tool`）、`sanitizeHtml()`/`escapeHtml()`、`SafeHtml` 组件、`useCopy()`、`ToolCard` 组件、`home.layout`/`tool.layout`、`home`/`not-found` 页面
**工具（后续批量样板）：** `detectUnit`/`fromTimestamp`/`toTimestamp` + `timestamp-converter.vue`；`formatJson`/`minifyJson`/`validateJson`/`buildTree` + `json-formatter.vue`/`CodeMirrorJson.vue`/`JsonTree.vue`
**配置与脚本：** `package.json`（packageManager 锁定 + `check:chunks`）、`vite.config.ts`、`vitest.config.ts`（happy-dom）、`eslint.config.ts`（唯一出口白名单卡口）、`src/styles/tokens.css`/`base.css`、`scripts/check-chunks.mjs`
**测试：** `registry.test.ts`、`routes.test.ts`、`ToolCard.test.ts`、`useCopy.test.ts`、`sanitize.test.ts`、`safe-html.test.ts`、`timestamp-converter.service.test.ts`、`json-formatter.service.test.ts`
