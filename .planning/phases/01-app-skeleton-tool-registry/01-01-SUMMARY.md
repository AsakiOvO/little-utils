---
phase: 01-app-skeleton-tool-registry
plan: 01
subsystem: ui
tags: [vue3, vite-ssg, tailwind4, oklch, tool-registry, derived-routing, pnpm, create-vue, vitest]

# Dependency graph
requires:
  - phase: none (greenfield)
    provides: 空工作区,无前置依赖
provides:
  - 可 corepack pnpm dev 运行、corepack pnpm build(vite-ssg 预渲染)产出 dist/index.html 的站点骨架
  - defineTool() 全站契约(ToolMeta/Tool/ToolCategoryId,icon 为组件引用 D-06)+ 空注册表单一事实来源
  - assertRegistryInvariants 四类不变量 + toolsByCategory 派生 helper + 路由纯派生(home + tools.map + 404 置尾)
  - RouteMeta 类型增强(layout/tool)与注册表/路由回归测试(20 用例)
  - home/tool 双布局框架壳(D-03 定型)+ ToolCard 组件 + 首页分类网格与空态
  - @theme oklch 霓虹三色令牌 + 暗色语义底 + glow 阴影(D-04),@custom-variant dark 声明未启用(D-05)
affects: [01-02, 01-03, 01-04, phase-2, phase-4, phase-5]

# Actuals (#2632)
actuals:
  tokens: 46861
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: [vue-router@5.3.1, vite-ssg@28.3.0, "@unhead/vue@3.4.0", "@vueuse/core@14.4.0", tailwindcss@4.3.3, "@tailwindcss/vite@4.3.3", dayjs@1.11.23, dompurify@3.4.14, happy-dom@20.13.2]
  patterns: [registry-derived-routing, dual-layout-meta-switch, define-tool-contract, css-first-theme-tokens, empty-registry-as-legal-state]

key-files:
  created:
    - package.json
    - pnpm-lock.yaml
    - vite.config.ts
    - vitest.config.ts
    - eslint.config.ts
    - index.html
    - src/main.ts
    - src/App.vue
    - src/styles/tokens.css
    - src/styles/base.css
    - src/tools/tool.ts
    - src/tools/index.ts
    - src/router/routes.ts
    - src/router/index.d.ts
    - src/tools/registry.test.ts
    - src/router/routes.test.ts
    - src/layouts/home.layout.vue
    - src/layouts/tool.layout.vue
    - src/pages/home.vue
    - src/pages/not-found.vue
    - src/components/ToolCard.vue
    - src/components/ToolCard.test.ts
  modified:
    - .gitignore

key-decisions:
  - "create-vue 3.23.0 生成基线版本整体采信:typescript ~6.0.3(非 RESEARCH 排除的 7.0.2 Go 编译器版,与 vue-tsc 3.3.11 官方组合自洽)、vitest 4.1.11——RESEARCH 假设 A5'采 create-vue 锁定版本'的直接应用"
  - "RouteMeta 类型增强(src/router/index.d.ts)从 Task 2 提前到 Task 1:routes.ts 已在 meta 使用 layout/tool 字段,无增强则 Task 1 type-check 无法通过(阻断性顺序依赖)"
  - "ESLint flat config 增补 globalIgnores(.codebuddy/.cursor/.claude/.planning)与 pages/layouts 目录 vue/multi-word-component-names 例外——lint 可运行的基础设施修正,不涉及 Plan 01-03 的消毒管线白名单"
  - "脚手架用普通名 scaffold-tmp 创建后合并:点前缀目录名(.scaffold-tmp)令 create-vue 的包名交互提示在非 TTY 下卡死"
  - "test.environment 切换 happy-dom 时同步移除 jsdom/@types/jsdom 依赖,回退注释保留在 vitest.config.ts(RESEARCH A4)"

patterns-established:
  - "注册表派生路由:tools.map() 生成工具路由 + catch-all 404 置尾,禁止手写静态工具路由"
  - "空注册表为合法状态:派生路由仅 home+404,UI 侧渲染空态而非白屏(ARCH-01/empty 登记假设)"
  - "布局切换:route.meta.layout 计算属性 + <component :is>,布局组件不感知具体工具(D-03 接缝)"
  - "设计令牌只消费不硬编码:组件禁止裸色值,一律 @theme 语义类/变量"
  - "工具契约字段 icon: Component 组件引用(D-06),defineTool() 派生 isNew,绝不手填"

requirements-completed: [ARCH-01, ARCH-02]

coverage:
  - id: D1
    description: vite-ssg 构建基线——type-check 与 vite-ssg build 全绿,dist/index.html 预渲染产出(ARCH-02)
    requirement: ARCH-02
    verification:
      - kind: integration
        ref: "command: corepack pnpm type-check && corepack pnpm build && test -f dist/index.html"
        status: pass
    human_judgment: false
  - id: D2
    description: 路由表由注册表纯派生(home 静态 + tools.map 懒加载 + catch-all 404 置尾),回归测试保护(ARCH-01)
    requirement: ARCH-01
    verification:
      - kind: unit
        ref: "tests/src/router/routes.test.ts#routes — 注册表纯派生(4 用例:home 首位/404 置尾/中间段一一对应/工具路由 meta)"
        status: pass
    human_judgment: false
  - id: D3
    description: 注册表不变量(路径唯一/以 / 开头/分类存在/keywords 非空)与 isNew 30 天派生有单元测试,含空注册表合法用例(ARCH-01)
    requirement: ARCH-01
    verification:
      - kind: unit
        ref: "tests/src/tools/registry.test.ts#defineTool + assertRegistryInvariants(11 用例,含空数组通过)"
        status: pass
    human_judgment: false
  - id: D4
    description: App.vue 按 route.meta.layout 切换 home/tool 双布局,布局组件不感知具体工具(D-03)
    requirement: ARCH-01
    verification:
      - kind: other
        ref: "grep route.meta.layout/<component :is src/App.vue + 预渲染 HTML 含 home 布局 chrome"
        status: pass
    human_judgment: true
    rationale: "App.vue 布局切换无组件级自动化测试;SSG 产物只覆盖 home 布局,tool 布局切换(需注册真实工具路由)与视觉克制需人工浏览验证"
  - id: D5
    description: home 页消费 toolsByCategory() 渲染分类卡片网格,空注册表显示空态而非白屏
    requirement: ARCH-01
    verification:
      - kind: other
        ref: "grep toolsByCategory src/pages/home.vue + 预渲染 dist/index.html 含空态文案"
        status: pass
    human_judgment: false
  - id: D6
    description: "@theme oklch 霓虹三色令牌 + 暗色语义底 + glow 阴影令牌就位,@custom-variant dark 已声明未启用(D-04/D-05)"
    requirement: ARCH-02
    verification:
      - kind: other
        ref: "grep @theme/--color-neon-cyan/--color-bg/@custom-variant src/styles/tokens.css + build 产出 CSS 9.36KB"
        status: pass
    human_judgment: false
  - id: D7
    description: ToolCard 消费注册表派生值(icon 组件引用/name/description/isNew 徽标),整卡 router-link
    requirement: ARCH-01
    verification:
      - kind: unit
        ref: "tests/src/components/ToolCard.test.ts#ToolCard(5 用例,含 isNew 徽标出现/不出现)"
        status: pass
    human_judgment: false

# Metrics
duration: 31 min
completed: 2026-09-04
status: complete
---

# Phase 1 Plan 1: 行走骨架(Scaffold + 空注册表派生路由 + 双布局)Summary

**create-vue + vite-ssg 构建基线、defineTool 契约与空注册表、注册表纯派生路由(404 置尾)、home/tool 双布局与 ToolCard、@theme oklch 设计令牌——22 文件,20 测试全绿,预渲染产出 dist/index.html**

## Performance

- **Duration:** 31 min
- **Started:** 2026-09-04T07:22:47Z
- **Completed:** 2026-09-04T07:53:45Z
- **Tasks:** 3
- **Files modified:** 28(22 新建 + .gitignore 合并 + pnpm-lock/tsconfig 系列生成物)

## Accomplishments

- Walking Skeleton 承重结构就位:`corepack pnpm dev` 可运行、`corepack pnpm build`(vite-ssg)预渲染产出 dist/index.html,SSG 纪律从 Phase 1 即被构建验证
- 注册表契约定型(D-06 costly):`defineTool()` + `ToolMeta.icon: Component`(组件引用)+ isNew 30 天派生;`src/tools/index.ts` 为全站单一事实来源(空注册表起步)
- 路由 = 注册表纯派生:home 静态导入(LCP)+ `tools.map()` 懒加载 + catch-all 404 置尾;四类不变量断言在模块加载即执行;RouteMeta 类型增强(layout/tool)
- 双布局框架壳(D-03 costly):App.vue 按 `route.meta.layout` 切换,home 强风格基线(霓虹青静态 glow 点缀)、tool 克制易读(零 glow,返回导航,max-w 容器);ToolCard 全语义类消费
- @theme oklch 霓虹三色 + 暗色语义底 + glow 阴影令牌(D-04);`@custom-variant dark` 声明未启用(D-05,Phase 2 只补切换)
- 回归测试 20 用例全绿:registry(11:isNew 正反、空注册表合法、四类不变量抛错)+ routes(4:home 首位、404 置尾、派生一一对应、meta 断言)+ ToolCard(5:渲染、链接、icon、徽标开关)

## Task Commits

Each task was committed atomically:

1. **Task 1: 脚手架 + 构建基线 + 设计令牌 + 空注册表派生路由(tracer)** - `fbb0494` (feat)
2. **Task 2: 注册表契约与派生路由的回归测试 + RouteMeta 类型增强** - `ebdc640` (test)
3. **Task 3: 双 layout 框架壳 + 工具卡片 + 首页分类网格(D-03)** - `6201308` (feat)

## Files Created/Modified

- `package.json` - name little-utils + `packageManager: pnpm@11.25.0` + build 切换 vite-ssg;7 运行时依赖 + vite-ssg/happy-dom
- `vite.config.ts` - vue + devtools + tailwindcss 插件,alias @,ssgOptions.includedRoutes 过滤含 `:` 路由
- `src/tools/tool.ts` - ToolMeta/Tool/ToolCategoryId + defineTool()(isNew 派生)+ NEW_WINDOW_DAYS=30
- `src/tools/index.ts` - toolCategories + 空注册表 tools[] + toolsByCategory() + assertRegistryInvariants()
- `src/router/routes.ts` - 注册表纯派生路由(home + tools.map + 404 置尾),模块加载即断言
- `src/router/index.d.ts` - RouteMeta 增强:layout?: 'home'|'tool'、tool?: Tool
- `src/styles/tokens.css` - @import tailwindcss + @custom-variant dark(未启用)+ @theme oklch 令牌全集
- `src/styles/base.css` - reset + :root 暗色基线(body 消费语义变量)
- `src/App.vue` - route.meta.layout 计算属性双布局切换
- `src/layouts/home.layout.vue` / `tool.layout.vue` - D-03 双布局骨架(强风格 / 克制易读)
- `src/pages/home.vue` - toolsByCategory 分类网格 + 两级空态(整页空态 / 分类空态)
- `src/pages/not-found.vue` - 404 文案 + 返回首页(落 home 布局)
- `src/components/ToolCard.vue` - 工具卡片(icon 动态组件 / isNew 徽标 / 整卡链接)
- `src/tools/registry.test.ts` / `src/router/routes.test.ts` / `src/components/ToolCard.test.ts` - 回归测试 20 用例
- `vitest.config.ts` - environment happy-dom + A4 jsdom 按文件回退注释
- `eslint.config.ts` - create-vue flat config + globalIgnores(GSD 工作流目录)+ pages/layouts multi-word 例外

## Decisions Made

- create-vue 基线版本整体采信:typescript ~6.0.3、vitest 4.1.11(RESEARCH 锁定 5.9.3/5.0.0,但 create-vue 3.23.0 产物自洽且 TS 6 非 7.0.2 Go 编译器;A5 假设应用)——vue/vite/vue-router/@unhead/vue 等其余版本与 RESEARCH 逐一致
- RouteMeta 类型增强提前至 Task 1(Rule 3 阻断性:routes.ts 的 meta 使用依赖该类型)
- ESLint 增补 globalIgnores 与 multi-word 例外是 lint 基础设施修正,不是消毒管线白名单(Plan 01-03 卡口不受影响)
- 脚手架经 scaffold-tmp 普通名目录创建后合并,规避 create-vue 非交互卡死;.gitignore 合并而非覆盖,保留 .claude/.codebuddy/.cursor 规则

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] RouteMeta 类型增强(index.d.ts)提前到 Task 1 创建**
- **Found during:** Task 1(src/router/routes.ts 编写时)
- **Issue:** routes.ts 已在 meta 使用 layout/tool 字段,而类型增强归在 Task 2 files——Task 1 的 `pnpm type-check` verify 无法通过
- **Fix:** 在 Task 1 即创建 `src/router/index.d.ts`(内容与 Task 2 action step 1 完全一致);Task 2 复核确认
- **Files modified:** src/router/index.d.ts(任务归属提前,内容不变)
- **Verification:** Task 1 type-check 退出码 0;AC grep(index.d.ts 含 declare module/layout?/tool?)通过
- **Committed in:** fbb0494(Task 1)

**2. [Rule 3 - Blocking] create-vue 生成版本与 RESEARCH 清单部分漂移,采信 create-vue 基线**
- **Found during:** Task 1(脚手架合并后)
- **Issue:** create-vue 3.23.0 生成 typescript ~6.0.0(RESEARCH 锁 5.9.3)、vitest 4.1.x(RESEARCH 锁 5.0.0);擅自降级会与生成的 tsconfig(@tsconfig/node24 等)脱钩
- **Fix:** 保留 create-vue 组合(TS 6.0.3 实装,vue-tsc 3.3.11 peer >=5.0.0 兼容;TS 6 非 RESEARCH 排除的 7.0.2 Go 编译器版)——RESEARCH 假设 A5"若 peer 冲突,采 create-vue 锁定版本"的直接应用
- **Files modified:** package.json(版本随 install 锁定进 lockfile)
- **Verification:** type-check 全绿;vue-tsc 3.3.11 与 RESEARCH 版本一致
- **Committed in:** fbb0494

**3. [Rule 1 - Bug] ESLint 扫到 GSD 工作流目录产生 2868 个无关错误**
- **Found during:** Task 1(lint verify)
- **Issue:** create-vue flat config 的 files 模式把 .codebuddy/.cursor/.claude 下的工作流 .cjs 脚本纳入 lint(2868 errors,全部 @typescript-eslint/no-require-imports 等,非应用代码)
- **Fix:** globalIgnores 增补 .codebuddy/.cursor/.claude/.planning;另对 src/pages 与 src/layouts 关闭 vue/multi-word-component-names(home.vue/tool.layout.vue 单词名,vue 官方 pages 惯例)
- **Files modified:** eslint.config.ts
- **Verification:** `corepack pnpm lint` 全绿(oxlint 0 + eslint 0)
- **Committed in:** fbb0494(ignores)/ 6201308(layouts 例外)

**4. [Rule 1 - Bug] routes.test.ts 条件 expect 违反 oxlint no-conditional-expect**
- **Found during:** Task 3(全套 lint)
- **Issue:** `if (tools.length === 0) { expect(...) }` 是条件断言(条件不满足时静默跳过),oxlint 报 2 errors
- **Fix:** 改写为无条件派生不变量断言:`routes.slice(1,-1) 严格等于 tools.map(path)` 且 `routes.length === 2 + tools.length`——对空注册表(当前)与非空注册表(未来)均成立,语义反而更强
- **Files modified:** src/router/routes.test.ts
- **Verification:** vitest 20/20 全绿;oxlint 0 errors
- **Committed in:** 6201308

**5. [Rule 3 - Blocking] vitest 环境切换 happy-dom 时移除 jsdom 依赖**
- **Found during:** Task 1(action step 15)
- **Issue:** create-vue 默认安装 jsdom + @types/jsdom;tsconfig.vitest.json 的 types 含 "jsdom",移除包后 type-check 报 TS2688
- **Fix:** 安装 happy-dom、移除 jsdom/@types/jsdom、tsconfig.vitest.json types 去掉 "jsdom";A4 按文件回退注释保留在 vitest.config.ts(真需回退时再装 jsdom)
- **Files modified:** vitest.config.ts、tsconfig.vitest.json、package.json、pnpm-lock.yaml
- **Verification:** type-check 全绿;vitest 全套通过
- **Committed in:** fbb0494

---

**Total deviations:** 5 auto-fixed(2 blocking 顺序/版本,3 bug 类修正)
**Impact on plan:** 全部为让 verify 全绿所必需的基础设施修正,未改变计划交付物与契约;无 scope creep。

## Issues Encountered

- create-vue 非交互脚手架在点前缀目录名(.scaffold-tmp)上卡死"Package name"提示(非 TTY 下 clack prompts 取消)——改用普通名 scaffold-tmp 创建后合并解决,临时目录已删除
- vite-ssg 的 ssgOptions 类型需 `/// <reference types="vite-ssg" />` 显式引入(vite.config.ts 内一行);vitest 4 对无扩展名 import 的 configLoader native 警告为无害提示,保留 create-vue 原写法(TS 未启用 allowImportingTsExtensions)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 01-02/01-04(真实工具注册):注册表契约与派生路由已定型,新增工具 = 工具自包含目录 + tools 数组一行;@lucide/vue 安装由 01-02 Task 1 的 blocking-human 供应链闸门把关
- Ready for 01-03(XSS 消毒管线 + ESLint 卡口):本计划未追加任何 no-v-html 白名单,ESLint 基线干净(全绿);src/ 当前零 v-html
- Phase 2 主题系统:tokens.css 令牌结构就位,@custom-variant dark 已声明未启用——只补切换不重做令牌(D-05)
- 注意:home.vue 首页空态文案("工具正在准备上线"/"该分类工具即将上线")是 ARCH-01/empty 登记假设的 UI 侧刻意设计(空注册表的正确渲染),非占位 stub;真实工具注册后自动消失

---
*Phase: 01-app-skeleton-tool-registry*
*Completed: 2026-09-04*

## Self-Check: PASSED

- 22 个关键文件全部存在于磁盘(`[ -f ]` 逐一验证,无 MISSING)
- 3 个任务提交哈希(fbb0494 / ebdc640 / 6201308)在 git log 中全部找到
- 整体 verification 复核:vitest 20/20、type-check 0 错、lint 0 错、vite-ssg build 产出 dist/index.html、无 HelloWorld 残留
