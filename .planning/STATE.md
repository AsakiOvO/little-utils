---
gsd_state_version: 1.0
current_phase: 3
current_phase_name: 预渲染 SEO 与部署管线
status: verifying
stopped_at: Completed 03-03-PLAN.md
last_updated: "2026-09-09T09:05:49.411Z"
last_activity: 2026-09-09
last_activity_desc: Phase 3 execution started
state_head: 7ae5b539f76086106880962fa6e86468d6cb53f1
progress:
  total_phases: 8
  completed_phases: 2
  total_plans: 15
  completed_plans: 15
  percent: 25
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-04)

**Core value:** 打开网站 → 几秒内通过分类或搜索找到所需工具 → 浏览器端立即完成操作,全程无需登录、数据不出浏览器
**Current focus:** Phase 3 — 预渲染 SEO 与部署管线

## Current Position

Phase: 3 (预渲染 SEO 与部署管线) — EXECUTING
Plan: 3 of 3
Status: Phase complete — ready for verification
Last activity: 2026-09-09 — Phase 3 execution started

Progress: [███░░░░░░░] 25%

## Performance Metrics

**Velocity:**

- Total plans completed: 12
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 5 | - | - |
| 02 | 7 | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 31 min | 3 tasks | 28 files |
| Phase 01 P02 | 37 min | 3 tasks | 9 files |
| Phase 01 P03 | 23 min | 2 tasks | 8 files |
| Phase 01 P04 | 14 min | 3 tasks | 9 files |
| Phase 01 P05 | 13 min | 3 tasks | 6 files |
| Phase 02 P01 | 44 min | 2 tasks | 7 files |
| Phase 02 P02 | 23min | 3 tasks | 8 files |
| Phase 02 P03 | 20min | 3 tasks | 8 files |
| Phase 02 P04 | 30 min | 2 tasks | 4 files |
| Phase 02 P05 | 15 min | 2 tasks | 4 files |
| Phase 02 P06 | 8 min | 3 tasks | 6 files |
| Phase 02 P07 | 13min | 2 tasks | 1 files |
| Phase 03 P01 | 40min | 3 tasks | 11 files |
| Phase 3 P2 | 45min | 3 tasks | 6 files |
| Phase 3 P03-03 | 90min | 3 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 8 阶段采用研究"契约先行→基建→批量"结构——注册表契约 + XSS 消毒管线必须先于任何工具批量生产(Phase 1),SSG/部署先于批量工具(Phase 3),设计令牌先于强风格化(Phase 2 → 6)
- [Roadmap]: 部署按"EdgeOne 全球(不含大陆)可用区先上线"路径,ICP 备案为并行非阻塞事项
- [Phase 01]: 01-01: create-vue 基线版本整体采信(TS 6.0.3/vitest 4.1.11,A5 假设:采 create-vue 锁定版本)
- [Phase 01]: 01-01: RouteMeta 类型增强提前至 Task 1(Rule 3:routes.ts meta 使用依赖该类型,type-check 阻断)
- [Phase 1]: 01-02: @lucide/vue 1.39.0 经 blocking-human 供应链闸门人工批准后安装(D-06 落地),lucide-vue-next 弃用包未混入
- [Phase 1]: 01-02: 『加目录 + 注册表一行』工具接入模式首次真实验证,routes.ts 零改动(Phase 5 批量样板)
- [Phase 1]: 01-02: useCopy 测试按 VueUse 14.4.0 真实语义锁定(legacy:true 下 isSupported 恒 true,降级为内部路径切换),修正计划旧版库假设
- [Phase 1]: 01-04: check-chunks 首包定义 = 入口页 dist/index.html 的 chunk 可达闭包（BFS 含 import{...}from/export-from/dynamic import 链）——vite-ssg 平铺产物下工具页 modulepreload 自己的工具 chunk 属期望懒加载行为，不属共享首屏 — 01-04: check-chunks 首包定义 = 入口页 dist/index.html 的 chunk 可达闭包（BFS 含 import{...}from/export-from/dynamic import 链）——vite-ssg 平铺产物下工具页 modulepreload 自己的工具 chunk 属期望懒加载行为，不属共享首屏
- [Phase 1]: 01-04: CM 泄漏断言按页分组：入口页可达集零 CM；工具页可达集的 CM chunk 文件名必须以该工具 slug 开头（堵住经 useCopy 类共享异步 chunk 中转的泄漏路径） — 01-04: CM 泄漏断言按页分组：入口页可达集零 CM；工具页可达集的 CM chunk 文件名必须以该工具 slug 开头（堵住经 useCopy 类共享异步 chunk 中转的泄漏路径）
- [Phase 1]: 01-04: fail-first 验证采用产物层注入模拟——src 层探针（副作用 import / void 绑定）因 CM 库 tree-shakeable 被消除；共享层"导入但不使用"CM 天然不进产物，对 ARCH-02 是一层免费防护 — 01-04: fail-first 验证采用产物层注入模拟——src 层探针（副作用 import / void 绑定）因 CM 库 tree-shakeable 被消除；共享层"导入但不使用"CM 天然不进产物，对 ARCH-02 是一层免费防护
- [Phase 01]: isValidTimeZone 守卫置于 service 层（V7 契约位置），UI 零改动只消费 ok:false — Intl 调用收敛函数体内维持 Pitfall 3 预渲染纪律；错误文案仅内插 tz 本身
- [Phase 01]: check-chunks 工具路由唯一来源 = jiti 实载注册表模块，双源消除 — ARCH-01 构建脚本侧不变量恢复；断言 a-d 语义零改动经失败方向探针实证
- [Phase 01]: 测试文件就近 *.test.ts 布局接入 type-check 与 vitest lint；删除空 lib 覆盖恢复继承 DOM lib — 9/9 测试文件纳入保障面；type-check 一次通过零修复实证 lib 选择正确
- [Phase 02]: [Phase 02]: 02-01: color-scheme 亮色 :root 兜底置于 .dark 块之前 —— :root 与 .dark 同特异性靠源顺序覆盖,计划原定文件末尾会在暗色模式反向覆盖(Rule 1,按 RESEARCH Pattern 1 骨架修正)
- [Phase 02]: [Phase 02]: 02-01: 测试读盘定型 node:fs + import.meta.dirname —— vitest 下 import.meta.url 非 file 协议、?raw 被 CSS mock 吞空(探针实证);tsconfig.app.json 排除 *.test.ts 由 tsconfig.vitest.json(含 node types)统一检查
- [Phase 02]: [Phase 02]: 02-01: tokens.ts 补齐 D-10 背景/边框变体六键使同步断言覆盖全部语义变量;oxlint vitest/valid-expect maxArgs=2 保留双参 expect 修复消息
- [Phase 02]: 02-02: THEME_STORAGE_KEY='little-utils:v1:theme' 全站唯一定义点首落地;index.html 内联脚本与 useThemeMode.resolved 判定逐字镜像(测试文本断言守护漂移,Pitfall 1)
- [Phase 02]: 02-02: 三态状态机自组(useStorage initOnMounted + usePreferredColorScheme + computed)弃用 useDark/useColorMode;no-preference 显式回落暗(D-01);vite-ssg onBeforePageRender 幂等预渲染默认 dark 类
- [Phase 02]: 02-03: Input 多根组件 attrs 形态 —— inheritAttrs:false + v-bind=$attrs 置前透传、组件持有绑定(:id/:value/aria-*)置后;type 不写死由浏览器默认 text 兜底,id 契约不可被调用方覆盖
- [Phase 02]: 02-03: lint 卡口 —— D-13/D-18 单名契约与保留名/单词名规则冲突,行内 eslint-disable 被 oxlint --fix 自动删除(反例),改 .oxlintrc.json overrides 按文件豁免 + eslint src/ui 单词名豁免块(Rule 3)
- [Phase 02]: 02-04: VueUse 14.4.0 useClipboard(legacy:true) 的 copy() 内部吞掉 write 失败转 execCommand 降级,唯一真实 reject 路径 = 降级 execCommand 抛错 —— CopyableText failed 态按此语义落地,失败测试构造真实拒绝路径而非 mock composable(护住 D-17 封装断言)
- [Phase 02]: 02-04: @vue/test-utils 默认挂载游离 DOM 树(isConnected=false),happy-dom focus() 对未连接元素提前返回 —— 键盘导航聚焦断言改 attachTo: document.body 挂载并用例内 unmount 清理(探针实证,Pitfall 5 同类环境怪癖)
- [Phase 02]: 02-04: Tabs 采用受控 v-model 契约(activeId = modelValue ?? 首个 tab,与 Input/CodeMirrorJson 同构),aria-selected/tabIndex/hidden 三件套由 selectTab 单点驱动防状态漂移
- [Phase 02]: 02-05: CM 子包(@codemirror/state 6.7.2/@codemirror/language 6.12.4/@lezer/highlight 1.2.3)以 lockfile 精确版本提升为直接依赖 —— pnpm 隔离布局下传递依赖从项目根不可解析,计划/RESEARCH Pattern 4 骨架的 import 不可达(Rule 3);零新装零新下载,T-02-SC 纪律保持,EditorView 沿用 codemirror 元包重导出
- [Phase 02]: 02-05: createCmTheme(dark) 将 chrome+语法高亮打包为单一扩展数组进一个 Compartment —— watch(resolved) reconfigure 整体换主题不重建视图,输入/光标状态无损(D-06);色值全部取 tokens.ts 字面 oklch 与 D-20 单测同源
- [Phase 02]: 02-06: Card 三态消费形态齐备(as=RouterLink/ToolCard、:padding=false+p-10/home 空态、默认 p-5 通用)——Phase 5 批量工具消费面无未知分支;存量迁移三步模式定形(换根容器→Typography 归一→交互件 min-h-11),02-07 直接复制
- [Phase 02]: 02-06: 计划验证『py-3/py-1.5 存量归一』按迁移面口径执行(UI-SPEC Exceptions 点名双 layout);json-formatter py-1.5 归 02-07、timestamp-converter py-3 在 Phase 2 清单外,记录 deferred-items.md 不越界修复
- [Phase 02]: 02-07: json-formatter 迁移收口定形工具操作区样板(Button outline + CopyableText 双形态[默认展示区/默认插槽 JsonTree+payload=minified] + Card :padding=false p-3 + danger 错误态)——Phase 5 输出类工具直接复制;页面级 useCopy 组合删除(D-17 闭环)
- [Phase 02]: 02-07: 阶段终局门禁五项全绿(172 测试/type-check/lint/build 3 页预渲染/check:chunks OK)——ROADMAP SC-1..SC-5 中 SC-2/SC-3/暗色直开无闪烁待 D-23 四项人工抽验(验收载体 02-07-SUMMARY,preview http://localhost:4174/ 已就绪)
- [Phase 3]: @unhead/vue 对齐 vite-ssg 28 内置集成版本 ^2.1.2，main.ts 交由 ViteSSG 内置 head 管理（双实例 headSymbol 失配会使 SSG meta 零落盘）
- [Phase 3]: 工具页 SEO meta 走 useToolSeo 归拢层（route.meta.tool + SITE_URL 单源），新工具单句接入
- [Phase 3]: 03-02: onFinished 注册表类型用局部结构断言——typeof import() 会把全组件图拉进 tsconfig.node 程序产生幽灵 DOM/别名报错
- [Phase 3]: 03-02: check:all 聚合链用 test:unit:run(vitest run)——watch 态在非 CI TTY/EdgeOne 构建环境挂起;check:dist 殿后 build-only(Pitfall 7)
- [Phase 3]: 03-03: 部署平台 EdgeOne Pages 换为 Cloudflare Pages（Rule 4 用户决策——腾讯国际版实名认证不可行）；构建命令 pnpm check:all + 输出 dist + NODE_VERSION/PNPM_VERSION 环境变量，D-14/D-15 缓解等效迁移
- [Phase 3]: 03-03: SITE_URL 单源修正为 https://little-utils.pages.dev 并重部署——canonical/og:url/sitemap/robots 四消费方公网 curl 验证同步（D-11/D-12 换源机制首次真实验证）
- [Phase 3]: 03-03: D-02 路径落定——Cloudflare Pages 全球可达，ICP 备案不再阻塞部署路径；D-04 sitemap 提交与 D-20 大陆实测登记为 deferred（deferred-items.md）

### Pending Todos

None yet.

### Blockers/Concerns

- ~~[Phase 3 规划时]: ICP 备案与否需作者显式确认~~ — 已清账（03-03）：D-02 路径落定为 Cloudflare Pages 全球可达，ICP 备案不再阻塞
- [Phase 8 规划时]: 图片压缩 EXIF/HEIC/Worker 与 marked+DOMPurify 集成需专项调研(research flag)

## Deferred Items

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| SEO | D-04 sitemap 提交（Google Search Console + 百度站长平台） | 挂起（用户 SKIP，随时可执行） | 03-03 | 后续任意时点 |
| 验收 | D-20 大陆无代理实测 | 挂起（条件：自定义域名绑定后） | 03-03 | 条件满足时 |

## Session Continuity

Last session: 2026-09-09T09:05:49.333Z
Stopped at: Completed 03-03-PLAN.md
Resume file: None
