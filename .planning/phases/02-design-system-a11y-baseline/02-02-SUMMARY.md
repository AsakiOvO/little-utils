---
phase: 02-design-system-a11y-baseline
plan: 02
subsystem: ui
tags: [theme-mode, dark-mode, vueuse, fouc, vite-ssg, accessibility, aria, touch-target, vitest]

# Dependency graph
requires:
  - phase: 02-design-system-a11y-baseline
    provides: base.css .theme-switching 瞬切中和规则与配对注释(plan 02-01)、tokens.css :root/.dark color-scheme 双声明、vitest + 就近 *.test.ts 布局、@lucide/vue 供应链闸门(Phase 1)
provides:
  - src/composables/useThemeMode.ts 三态主题状态机:THEME_STORAGE_KEY(little-utils:v1:theme,键惯例首落地)/ThemePreference/ResolvedTheme/useThemeMode(模块级单例,preference/resolved/cycle)
  - 三态语义:循环 暗→亮→跟随系统(D-02/D-03)、no-preference 显式回落暗(D-01)、系统实时联动 + 手动态隔离(D-04)、storage 白名单归一(Pitfall 7/T-02-03)、initOnMounted + document 守卫的 SSG 纪律(Pitfall 6)
  - src/ui/ThemeToggle.vue 三态循环图标按钮(Moon/Sun/Monitor,aria-label 三态文案,44px 触控,图标 aria-hidden)挂载双 layout 顶栏右上角
  - index.html head 内联 FOUC 阻塞脚本(与 useThemeMode resolved 判定逐字镜像)+ vite.config.ts onBeforePageRender 预渲染默认暗色类(幂等)= 零闪烁(D-05)
  - 镜像断言测试:index.html 内联脚本与状态机判定漂移即红(Pitfall 1 自动化防线)
affects: [02-03(六件套组件形态/aria/测试先例), 02-05(CodeMirrorJson 消费 useThemeMode().resolved 双主题切换), phase-4(favorites 键惯例 little-utils:v1:* 延续), verify-work(D-23 手动抽验)]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
actuals:
  tokens: 5540    # 22159 chars / 4 over the realized diff (8 files, +430/-2)
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []       # 零新依赖(T-02-SC 纪律:零安装、未动 pnpm-lock.yaml;useStorage/usePreferredColorScheme/@lucide/vue 均已在库)
  patterns:
    - 三态状态机:useStorage(initOnMounted + 自定义 serializer 白名单归一)+ usePreferredColorScheme + computed resolved + watch DOM 副作用,模块级单例共享
    - 判定镜像契约:index.html 内联脚本 ↔ composable resolved 逐字镜像,两处注释互指,文本断言守护漂移(改此必改彼)
    - 瞬切副作用配对:.theme-switching 挂类 → classList.toggle/colorScheme → 双 requestAnimationFrame 移除(与 base.css 注释互指,plan 02-01)
    - 组件测试纪律:vi.resetModules() + 动态 import 重置 composable 单例;matchMedia 工厂 fake(Pitfall 5);尺寸断言源码级;beforeEach 重置 documentElement 主题基线(同文件 DOM 共享隔离)

key-files:
  created:
    - src/composables/useThemeMode.ts
    - src/composables/useThemeMode.test.ts
    - src/ui/ThemeToggle.vue
    - src/ui/ThemeToggle.test.ts
  modified:
    - src/layouts/home.layout.vue
    - src/layouts/tool.layout.vue
    - index.html
    - vite.config.ts

key-decisions:
  - "测试 DOM 基线隔离:happy-dom 同文件用例共享 document,前序用例 watch 副作用(colorScheme/类)残留导致 ⑥ 初始断言失败,统一在 beforeEach 重置 documentElement className/colorScheme(Rule 1)"
  - "图标态断言走 lucide 渲染产物类名(lucide-moon/lucide-sun/lucide-monitor):断言用户可见 svg 而非比较组件引用,一次通过零返工"
  - "vite.config.ts onBeforePageRender 幂等实现:先核对 vite-ssg 28.3.0 真实签名 (route, indexHTML, appCtx),regex 检测 html 标签已含 dark 类则原样返回;实证 indexHTML 为逐路由传入的同一模板,无跨路由串改"
  - "镜像断言双参 expect(实际值, 失败消息)承载修复指引(02-01 oxlint maxArgs=2 先例);读盘沿用 02-01 定型 node:fs + import.meta.dirname"
  - "useThemeMode 头注释同时承载 Don't-Hand-Roll 禁用理由(useDark 两态/useColorMode no-preference 回落亮违反 D-01)与镜像互指,Task 3 无需回改 Task 1 文件"

patterns-established:
  - "改判定必双改:index.html 内联脚本与 useThemeMode.resolved 判定漂移 → useThemeMode.test.ts 镜像断言红(失败消息含『head 内联脚本与 useThemeMode 判定逻辑必须镜像对齐』)"
  - "composable 组件测试动态 import 模式:vi.resetModules() 重建模块级单例,matchMedia 工厂 fake 注入系统偏好"
  - "Phase 4 收藏键惯例先例:THEME_STORAGE_KEY = 'little-utils:v1:*' 首落地,唯一定义点 + 注释指明"

requirements-completed: [SITE-04]

# Coverage metadata (#1602)
coverage:
  - id: T1
    description: "用户可切换暗色/亮色模式:三态循环 暗→亮→跟随系统(D-02/D-03),选择经 useStorage 持久化(刷新后保持),默认跟随系统且 no-preference 回落暗(D-01/ROADMAP SC-1)"
    requirement: SITE-04
    verification:
      - kind: unit
        ref: "src/composables/useThemeMode.test.ts#① cycle 三态循环 dark→light→auto,localStorage 按序写入(D-02/D-03 持久化)"
        status: pass
      - kind: unit
        ref: "src/composables/useThemeMode.test.ts#② auto + 系统 no-preference → resolved dark(D-01 显式回落暗色)"
        status: pass
      - kind: unit
        ref: "src/ui/ThemeToggle.test.ts#④ localStorage 值随点击按 dark→light→auto 序列变化(D-02 持久化)"
        status: pass
    human_judgment: false
  - id: T2
    description: "跟随系统态实时联动:系统偏好变化立即生效;手动选择后系统变化不影响,切回 auto 恢复联动(D-04,经 usePreferredColorScheme change 回调)"
    requirement: SITE-04
    verification:
      - kind: unit
        ref: "src/composables/useThemeMode.test.ts#③ auto + 系统 light → light;matchMedia change 回调实时联动(D-04)"
        status: pass
      - kind: unit
        ref: "src/composables/useThemeMode.test.ts#④ 手动 dark 后系统变化不影响,切回 auto 恢复联动(D-04)"
        status: pass
    human_judgment: false
  - id: T3
    description: "ThemeToggle 三态循环图标按钮挂载双 layout 顶栏右上角(home: nav 并列右侧;tool: ml-auto 右推);图标 Moon/Sun/Monitor 随态变化,aria-label/title 三态文案(UI-SPEC Copywriting 锁定),图标 aria-hidden(D-19),44px 触控目标(D-21),新增工具页经 tool.layout 自动获得切换能力"
    requirement: SITE-04
    verification:
      - kind: unit
        ref: "src/ui/ThemeToggle.test.ts#①②③ aria-label/title 三态文案 + 图标类名随态 + 连点三次循环回初始态"
        status: pass
      - kind: unit
        ref: "src/ui/ThemeToggle.test.ts#⑤ 根类源码级断言 min-h-11 与 min-w-11(44px 触控目标,D-21/Pitfall 5)"
        status: pass
      - kind: unit
        ref: "src/ui/ThemeToggle.test.ts#⑥ 图标元素 aria-hidden=true(D-19)"
        status: pass
    human_judgment: false
  - id: T4
    description: "瞬切无全局过渡(D-11):resolved watch 挂 .theme-switching 类(配对 base.css 中和规则)→ classList.toggle + colorScheme → 双 rAF 移除;ThemeToggle 契约中无异步加载分支(UI-SPEC loading 行,点击反馈即终态)"
    requirement: SITE-04
    verification:
      - kind: unit
        ref: "src/composables/useThemeMode.test.ts#⑥ resolved 变更驱动 DOM:html.dark + colorScheme 翻转,瞬切窗口挂 .theme-switching、双 rAF 后移除(D-11)"
        status: pass
    human_judgment: false
  - id: T5
    description: "零闪烁(D-05):index.html head 内联阻塞脚本(meta charset 后)读 storage 白名单挂 .dark + colorScheme,判定与 useThemeMode 逐字镜像;vite-ssg onBeforePageRender 给每路由预渲染 HTML 默认挂 class=dark(亮色用户由内联脚本首绘前移除);镜像断言自动化防线"
    requirement: SITE-04
    verification:
      - kind: unit
        ref: "src/composables/useThemeMode.test.ts#head 内联脚本与 useThemeMode 判定镜像(storage key 字面值/dark-light 白名单分支/matchMedia 判定)"
        status: pass
      - kind: unit
        ref: "build + grep 实证:dist/index.html 与全部预渲染产物同时命中内联脚本与 class=\"dark\";check:chunks 预算卡口通过"
        status: pass
    human_judgment: true
    rationale: "真实浏览器『暗色系统直开/刷新目测无白闪』(RESEARCH §Pattern 3 验收口径)依赖首帧渲染行为,happy-dom 与 grep 无法替代;按 D-23 手动抽验路径留 phase verify-work 走 JSON 工具完整流程时一并确认"

# Metrics
duration: 23min
completed: 2026-09-08
status: complete
---

# Phase 2 Plan 2: 设计系统与响应式/可访问性基线 — 主题三态切换垂直切片 Summary

**useThemeMode 三态状态机(暗/亮/跟随系统,持久化 + 系统实时联动 + no-preference 回落暗)+ ThemeToggle 挂载双 layout 顶栏右上角 + head 内联 FOUC 镜像脚本与预渲染默认暗色类(零闪烁)全部落地,镜像断言防判定漂移,全量 136 测试绿、build + chunk 预算卡口通过、零新依赖**

## Performance

- **Duration:** 23 min
- **Started:** 2026-09-08T06:38:55Z
- **Completed:** 2026-09-08T07:02:23Z
- **Tasks:** 3
- **Files modified:** 8 (4 created, 4 modified)

## Accomplishments

- 新建 `useThemeMode.ts` 三态状态机:THEME_STORAGE_KEY(`little-utils:v1:theme`,PITFALLS 键惯例首落地)+ ThemePreference/ResolvedTheme 类型 + useThemeMode 模块级单例(preference/resolved/cycle);useStorage(initOnMounted 预渲染纪律 + serializer 白名单归一防脏值,T-02-03 mitigate)+ usePreferredColorScheme(实时联动)自组三态;no-preference 显式回落暗(D-01);DOM 副作用含 document 守卫、.theme-switching 瞬切窗口(D-11,与 base.css 双向注释互指)、双 rAF 移除;头注释承载 useDark/useColorMode 禁用理由与镜像互指
- 新建 `useThemeMode.test.ts` 八用例:三态循环 + localStorage 按序写入、no-preference 回落暗、系统 light 实时联动、手动态隔离 + 切回 auto 恢复、脏值 'blue' 归一 auto、DOM 副作用(fake timers 控双 rAF)、index.html 镜像断言两条(storage key 字面值/白名单分支 + matchMedia 判定,双参 expect 失败消息含修复指引)
- 新建 `ThemeToggle.vue`(Moon/Sun/Monitor 图标即状态、aria-label/title 三态文案 UI-SPEC 锁定、图标 aria-hidden、min-h-11 min-w-11 44px 触控、全 Tailwind 无 style 块、显式 import D-18)与六条组件测试(aria 三态/循环回初始/持久化序列/44px 源码级断言/aria-hidden);挂载双 layout 顶栏右上角(home: nav 并列;tool: ml-auto 右推)
- `index.html` head 插入 FOUC 阻塞 IIFE(判定与 resolved 逐字镜像:白名单 → light MQ → 回落暗;classList.toggle 布尔无注入面;catch 静默兜底暗色基线);`vite.config.ts` ssgOptions 增 onBeforePageRender(签名经 node_modules 类型核对,幂等追加 class="dark")
- 全量回归:136 测试(122 既有 + 14 新增)全绿、type-check/lint/build(vite-ssg 三页预渲染)/check:chunks 全部退出码 0;dist/*.html 三页均同时命中内联脚本与 dark 类

## Task Commits

Each task was committed atomically:

1. **Task 1: useThemeMode 三态状态机 — 偏好存储 + 系统联动 + 瞬切副作用** - `65cc11d` (feat) — tracer 任务,提交后反馈门重跑 verify 端到端通过(⚡ Tracer verified end-to-end — expanding)
2. **Task 2: ThemeToggle 组件 + 双 layout 顶栏右上角挂载** - `57b9676` (feat)
3. **Task 3: FOUC 内联阻塞脚本 + 预渲染默认暗色类 + 镜像断言** - `801c77f` (feat)

**Plan metadata:** docs commit(见 git log `docs(02-02)`)

_Note: 本计划无 TDD 任务;三个任务(tracer + auto ×2)均单 commit 完成。_

## Files Created/Modified

- `src/composables/useThemeMode.ts` (created) — 三态主题状态机(storage key 单点/循环/联动/回落/归一/SSG 守卫/瞬切副作用)
- `src/composables/useThemeMode.test.ts` (created) — 八用例:状态机六行为 + index.html 镜像断言两条
- `src/ui/ThemeToggle.vue` (created) — 三态循环图标按钮(a11y 内置/44px/无 style 块)
- `src/ui/ThemeToggle.test.ts` (created) — 六条组件行为 + 44px 源码级断言
- `src/layouts/home.layout.vue` (modified) — header 右侧并列容器包 nav + ThemeToggle(其余结构一行不动)
- `src/layouts/tool.layout.vue` (modified) — 品牌 span 移入 ml-auto 容器 + ThemeToggle(返回首页链接不动,归一在 02-06)
- `index.html` (modified) — head 内联 FOUC 阻塞脚本(与 useThemeMode 镜像互指)
- `vite.config.ts` (modified) — ssgOptions.onBeforePageRender 预渲染默认暗色类(幂等)

## Decisions Made

- **测试 DOM 基线隔离(Rule 1)**:happy-dom 同文件用例共享 document,前序用例 watch 副作用(colorScheme='light' 等)残留导致 ⑥ 初始断言红;在两个测试文件的 beforeEach 统一重置 `documentElement.className` 与 `style.colorScheme`。属测试实现修正,交付行为语义不变
- **图标态断言形态**:断言 lucide 渲染产物 `svg.classes()` 含 `lucide-moon/lucide-sun/lucide-monitor`(用户可见行为),非比较组件引用;一次通过
- **onBeforePageRender 幂等实现**:先读 node_modules/vite-ssg 类型声明核对签名 `(route, indexHTML, appCtx)`,再读产物源码确认 indexHTML 为逐路由传入的同一模板(循环变量不被跨路由改写);regex 检测 html 标签已含 dark 类则原样返回,否则替换开标签——双重幂等防线
- **镜像断言双参 expect**:失败消息「head 内联脚本与 useThemeMode 判定逻辑必须镜像对齐(改此必改彼)」承载修复指引(依赖 02-01 的 oxlint vitest/valid-expect maxArgs=2)
- **useThemeMode.ts 头注释一次到位**:承载 Don't-Hand-Roll 禁用理由 + 镜像互指 + .theme-switching 配对指认,Task 3 无需回改 Task 1 文件,保持任务提交原子性

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 测试 DOM 基线隔离缺失**
- **Found during:** Task 1(测试 ⑥ 首次运行)
- **Issue:** 同测试文件用例共享 happy-dom document,前序用例的 watch 副作用(documentElement.style.colorScheme='light')残留,⑥ 的初始空基线断言失败(expected 'light' to be '')
- **Fix:** beforeEach 统一重置 `documentElement.className = ''` 与 `style.colorScheme = ''`;ThemeToggle.test.ts 设计时即内置同款隔离
- **Files modified:** src/composables/useThemeMode.test.ts
- **Verification:** vitest 6/6 全绿
- **Committed in:** 65cc11d (Task 1 commit)

---

**Total deviations:** 1 auto-fixed(Rule 1)
**Impact on plan:** 仅测试隔离实现层面,交付物语义与验收标准完全一致;无范围蔓延。

## Issues Encountered

- 执行器环境命令链输出偶发截断(type-check 退出码 echo 被吞,02-01 已知怪癖),改用落盘日志 + 单独重跑逐项确认,无实际影响
- Task 2 执行中 tool.layout 品牌 span 曾被错误复制(span 计划语义是「移入」新容器),在提交前即时发现并修正,最终形态与计划一致,未进入任何提交

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- plan 02-03(六件套其余五件)先例就绪:ThemeToggle 提供 SFC 形态(template 前 script 后/defineOptions/头注释决策引用/无 style 块)、a11y 内置模式(aria-hidden 装饰 + 语义在 label)、组件测试纪律(resetModules + 动态 import + matchMedia fake + 源码级尺寸断言)全套可复制
- plan 02-05(cm-theme)接线点就绪:`useThemeMode().resolved` 即 CodeMirrorJson 双主题切换的状态源(Compartment reconfigure 消费)
- Phase 4 favorites 键惯例先例落地:`little-utils:v1:*` 首落地完成,收藏键沿此命名空间
- SITE-04 自动化面全部收口;D-23 手动抽验(真机/设备模拟:暗色系统直开无闪烁、聚焦输入不缩放、44px 触控)按计划留 phase verify-work 与 JSON 工具全流程一并走查
- 无阻塞项

## Known Stubs

None - 本计划交付物无 stub(状态机/组件/脚本/预渲染钩子全部完整实现,无占位数据/未接线逻辑)。

## Self-Check: PASSED

- FOUND: src/composables/useThemeMode.ts / useThemeMode.test.ts / src/ui/ThemeToggle.vue / ThemeToggle.test.ts(4/4 created)
- FOUND: index.html / vite.config.ts / src/layouts/home.layout.vue / tool.layout.vue(4/4 modified)
- FOUND: .planning/phases/02-design-system-a11y-baseline/02-02-SUMMARY.md
- FOUND: commit 65cc11d(Task 1)/ 57b9676(Task 2)/ 801c77f(Task 3)(3/3)

---
*Phase: 02-design-system-a11y-baseline*
*Completed: 2026-09-08*
