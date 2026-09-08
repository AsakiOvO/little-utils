---
phase: 02-design-system-a11y-baseline
plan: 01
subsystem: ui
tags: [tailwindcss, oklch, design-tokens, wcag-contrast, dark-mode, accessibility, reduced-motion, vitest]

# Dependency graph
requires:
  - phase: 01-app-skeleton-tool-registry
    provides: oklch 霓虹令牌与暗色语义底初版(tokens.css)、vitest + vue-tsc 测试基建、就近 *.test.ts 布局约定
provides:
  - tokens.css 三层令牌体系:@theme 原语层 + 亮色语义层(D-07 起点值)/ .dark 暗色语义层(D-12 值一字不动)/ 组件层 --color-focus
  - D-10 功能色 danger/success/warning 亮暗双套 + 背景/边框变体;D-08 glow 亮色降强度;:root/.dark color-scheme 双声明(CSS 兜底单源)
  - tokens.ts 色值单点常量模块(neon/dark/light 全语义变量 + parseOklch 纯函数,零第三方色彩库)
  - tokens.test.ts D-20 改色即红双保险:WCAG 对比度(bottosson 矩阵)、黑白 21:1 锚点、暗亮 20 色对 ≥4.5:1、tokens.css↔tokens.ts 同步断言、.dark 源顺序防回归
  - base.css 四条全局基线:16px 三选择器兜底(D-21)、reduced-motion 全局中和(D-22)、:focus-visible 焦点环(D-19)、.theme-switching 主题瞬切(D-11)
affects: [02-02(useThemeMode 消费 .theme-switching 配对与 color-scheme JS 双写), 02-03(六件套消费 var(--color-*)/var(--color-focus)), 02-04(存量页面迁移), 02-05(cm-theme 消费 tokens.ts 字面值), phase-6(强风格化消费令牌与对比度红线)]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
actuals:
  tokens: 6500    # 26042 chars / 4 over the realized diff (7 files, +435/-11)
  tasks: 2
  commits: 3

# Tech tracking
tech-stack:
  added: []       # 零新依赖(T-02-SC 纪律:零安装、未动 pnpm-lock.yaml)
  patterns:
    - 三层令牌消费契约:页面/组件只经语义层 var(--color-*) 与组件层 var(--color-focus),不直连原语(D-09)
    - 色值单点双源:tokens.ts 字面值 ↔ tokens.css 逐字一致,由 tokens.test.ts 同步断言守护(改色即红)
    - .dark 普通块置于 @theme 与 :root 兜底之后,同特异性 (0,1,0) 靠源顺序覆盖(Pitfall 2)
    - 测试读盘用 node:fs + import.meta.dirname(vitest 下 import.meta.url 非 file 协议;?raw 被 vitest CSS mock 吞为空串)

key-files:
  created:
    - src/styles/tokens.ts
    - src/styles/tokens.test.ts
    - src/styles/base-rules.test.ts
  modified:
    - src/styles/tokens.css
    - src/styles/base.css
    - tsconfig.app.json
    - .oxlintrc.json

key-decisions:
  - "color-scheme 亮色 :root 兜底置于 .dark 块之前(按 02-RESEARCH §Pattern 1 骨架):计划步骤 4 的『文件末尾』顺序会让同特异性的 :root 声明在暗色模式反向覆盖 .dark 的 color-scheme: dark,破坏 CSS-only 兜底 —— 执行时按 RESEARCH 骨架修正(Rule 1)"
  - "tokens.ts 语义组补齐 D-10 背景/边框变体六键(计划仅列九键):使同步断言可覆盖『全部语义变量(亮值与暗值都断)』,变体值属计划授权的 executor 定值范围"
  - "同步断言用 node:fs + import.meta.dirname 读盘:计划原写法 new URL(import.meta.url) 在 vitest 下非 file 协议直接抛错,Vite ?raw 又被 vitest 默认 CSS mock 吞为空串(探针实证),node:fs 为唯一可靠形态(Rule 3)"
  - "tsconfig.app.json 排除 src/**/*.test.ts:app 项目(src/**/*、无 node types)此前会连坐检查测试文件;测试统一由带 node types 的 tsconfig.vitest.json 检查,Phase 1 就近布局的自然补全(Rule 3)"
  - "D-10 功能色背景/边框变体值 executor 定值(亮:背景同色相极浅低饱和 0.96/边框中强度 0.72-0.75;暗:背景深色调 0.26-0.28/边框中强度 0.45-0.48),非文字用途不受 4.5:1 约束"
  - ".oxlintrc.json 开启 vitest/valid-expect maxArgs=2:双参 expect(实际值, 失败消息)是 vitest 官方 API,保留 D-20『失败消息自带修复指引』"

patterns-established:
  - "改色即红:改 tokens.css 任一语义值而不同步 tokens.ts(或反之)→ vitest 红,失败消息含中文修复指引"
  - "全局规则内容级断言:base.css 规则存在性由 base-rules.test.ts readFileSync+正则守护(check-chunks.mjs 先例)"
  - ".theme-switching 配对注释:base.css 与 plan 02-02 useThemeMode 两处注释互指,机制改动需同步"

requirements-completed: [STYL-01, STYL-03, SITE-05]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "tokens.css 三层令牌体系就位:@theme 原语三色(Phase 1 值逐字保留)+ 亮色语义层(D-07 起点值)+ D-10 功能色亮暗双套含背景/边框变体 + .dark 暗色语义层(D-12 八值逐字搬迁,git 对照验证)+ 组件层 --color-focus + :root/.dark color-scheme 双声明"
    requirement: STYL-01
    verification:
      - kind: unit
        ref: "src/styles/tokens.test.ts#tokens.css ↔ tokens.ts 同步断言(D-20)"
        status: pass
    human_judgment: false
  - id: D2
    description: "tokens.ts 色值单点(neon/dark/light 全语义变量 + parseOklch)+ WCAG 对比度单测:黑白 21:1 精确锚点、暗亮两主题 20 对文字用途色对全部 ≥4.5:1、CSS↔TS 同步改色即红"
    requirement: STYL-01
    verification:
      - kind: unit
        ref: "src/styles/tokens.test.ts#暗色主题色对 ≥4.5:1(值锁定,D-12)"
        status: pass
      - kind: unit
        ref: "src/styles/tokens.test.ts#亮色主题色对 ≥4.5:1(D-07 浅冷灰底 + 深霓虹体系)"
        status: pass
      - kind: unit
        ref: "src/styles/tokens.test.ts#WCAG 对比度算法锚点(D-20 正确性哨兵)"
        status: pass
    human_judgment: false
  - id: D3
    description: "base.css 原生 input/select/textarea 一体适用 16px 兜底规则落地(D-21,置于 font:inherit 块之后靠源顺序取胜;不扩展 contenteditable)"
    requirement: SITE-05
    verification:
      - kind: unit
        ref: "src/styles/base-rules.test.ts#原生输入控件 16px 兜底,input/select/textarea 三选择器一体(D-21/Pitfall 4,防 iOS 聚焦缩放)"
        status: pass
    human_judgment: false
  - id: D4
    description: "iOS 真机/设备模拟下聚焦输入框不触发强制放大(16px 规则的行为面)"
    requirement: SITE-05
    verification: []
    human_judgment: true
    rationale: "happy-dom 无法模拟 iOS computed font-size 判定与虚拟键盘行为,规则存在性已由单测证明,行为正确性需 D-23 手动真机/设备模拟走 JSON 工具完整流程(输入→格式化→复制)"
  - id: D5
    description: "base.css reduced-motion 全局中和块落地(D-22):animation/transition 时长 0.01ms、迭代 1 次、scroll-behavior auto,Phase 6 装饰动画天然被覆盖"
    requirement: STYL-03
    verification:
      - kind: unit
        ref: "src/styles/base-rules.test.ts#reduced-motion 全局中和块存在且四项压缩属性齐备(D-22)"
        status: pass
    human_judgment: false
  - id: D6
    description: "base.css 全局 :focus-visible 焦点环(经组件层 --color-focus 消费,D-19/D-09)与 .theme-switching 主题瞬切中和规则(D-11,与 plan 02-02 useThemeMode 挂类/双 rAF 移除配对,注释互指)"
    verification:
      - kind: unit
        ref: "src/styles/base-rules.test.ts#全局 :focus-visible 焦点环就位且经组件层 --color-focus 消费(D-19/D-09,不直连原语)"
        status: pass
      - kind: unit
        ref: "src/styles/base-rules.test.ts#主题瞬切 .theme-switching 中和规则就位,与 plan 02-02 useThemeMode 挂类/双 rAF 移除配对(D-11/Pitfall 3)"
        status: pass
    human_judgment: false

# Metrics
duration: 44min
completed: 2026-09-08
status: complete
---

# Phase 2 Plan 1: 设计系统与响应式/可访问性基线 — 令牌与全局基线 Summary

**三层 oklch 设计令牌体系(亮暗双套语义 + 组件层 --color-focus)与 tokens.ts 色值单点、D-20 对比度/CSS↔TS 同步双保险单测、base.css 四条全局基线(16px 兜底 / reduced-motion / 焦点环 / 主题瞬切)全部落地,全量 122 测试绿、build + chunk 预算卡口通过、D-12 暗色八值 git 对照逐字一致**

## Performance

- **Duration:** 44 min
- **Started:** 2026-09-08T05:41:05Z
- **Completed:** 2026-09-08T06:25:00Z (approx)
- **Tasks:** 2
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments

- tokens.css 重构为三层令牌体系:@theme 内原语层(Phase 1 三色逐字保留)+ 亮色语义层(D-07 浅冷灰底起点值)+ D-10 功能色亮暗双套(含 executor 定值的背景/边框变体)+ D-08 glow 亮色降强度;其后 .dark 块承载暗色语义(D-12 机制性搬迁,git show 对照八值逐字一致)+ 暗色功能色与变体 + 暗色 glow 原值;组件层 --color-focus: var(--color-neon-cyan) 与 :root/.dark color-scheme 双声明就位
- 新建 tokens.ts 色值单点常量模块(neon/dark/light 全语义变量 + parseOklch 纯函数,零第三方色彩库),新建 tokens.test.ts 实现完整 WCAG 对比度算法(bottosson OKLab 公有领域矩阵):黑白锚点 21.00:1 精确匹配、暗亮两主题 20 对文字用途色对全部 ≥4.5:1(执行前 tmp 脚本实跑预验证,零调色返工)、tokens.css↔tokens.ts 全语义变量同步断言(改色即红,失败消息含中文修复指引)、.dark 块位于 @theme 之后的源顺序防回归断言
- base.css 增改五处:删除 html 硬编码 color-scheme(单源动态接管)、D-21 16px 三选择器一体兜底(置于 font:inherit 块之后)、D-22 reduced-motion 全局中和块、D-19 :focus-visible 焦点环(消费组件层 --color-focus)、D-11 .theme-switching 主题瞬切规则(与 plan 02-02 注释互指);新建 base-rules.test.ts 五条内容级断言全绿
- 全量回归:122 测试(86 既有 + 36 新增)全绿、type-check/lint/build(vite-ssg 全量预渲染)/check:chunks 全部退出码 0

## Task Commits

Each task was committed atomically:

1. **Task 1: 三层令牌重构 — tokens.css 亮暗双套语义 + tokens.ts 色值单点 + tokens.test.ts 对比度与同步断言** - `4012103` (feat) — tracer 任务,提交后反馈门重跑 verify 端到端通过(⚡ Tracer verified end-to-end — expanding)
2. **Task 2: base.css 全局基线 — 16px 兜底 + reduced-motion 中和 + 焦点环兜底 + 主题瞬切规则** - `82ae691` (feat)

**插入提交:** `4e9ae55` (fix) — lint 卡口修复:oxlint vitest/valid-expect 启用 maxArgs=2(vitest 官方双参 expect API)+ it.each 断言内联(oxlint expect-expect 无法识别辅助函数内的断言)。由计划整体 <verification> 的 `pnpm lint 退出码 0` 要求触发。

**Plan metadata:** docs commit(见 git log `docs(02-01)`)

_Note: 本计划无 TDD 任务;两个任务均为实现型(tracer + auto),单 commit 完成。_

## Files Created/Modified

- `src/styles/tokens.css` (modified) — 三层令牌体系重构(原语/亮色语义/.dark 暗色语义/组件层 + color-scheme 双声明)
- `src/styles/tokens.ts` (created) — D-20 色值单点常量模块 + parseOklch 纯函数(plan 02-05 cm-theme 的字面值来源)
- `src/styles/tokens.test.ts` (created) — WCAG 对比度算法 + 黑白锚点 + 20 色对双主题 + CSS↔TS 同步 + .dark 源顺序断言
- `src/styles/base.css` (modified) — 16px 兜底 / reduced-motion 中和 / :focus-visible 焦点环 / .theme-switching 瞬切 / color-scheme 单源化
- `src/styles/base-rules.test.ts` (created) — base.css 五条全局规则内容级断言(SITE-05/STYL-03 自动化部分)
- `tsconfig.app.json` (modified) — 排除 src/**/*.test.ts(测试由 tsconfig.vitest.json 统一检查,Rule 3)
- `.oxlintrc.json` (modified) — vitest/valid-expect maxArgs=2(lint 卡口,Rule 3)

## Decisions Made

- **color-scheme 声明顺序按 RESEARCH 骨架修正**:计划步骤 4 要求 `:root { color-scheme: light }` 置于文件末尾,但 `:root` 与 `.dark` 同特异性 (0,1,0)、靠源顺序覆盖——置于末尾会让暗色模式的 CSS-only 兜底被反向覆盖。按 02-RESEARCH §Pattern 1 骨架将亮色兜底置于 .dark 块之前,偏差已记录(Rule 1)。验收语义不变(双声明存在 + .dark 在 @theme 之后均有断言)
- **tokens.ts 补齐 D-10 变体六键**:计划 tokens.ts 结构仅列九键,但计划测试要求同步断言"全部语义变量(亮值与暗值都断)"——变体属语义变量,补齐后断言覆盖完整(计划授权的 executor 定值范围)
- **测试读盘形态**:计划原写法 `new URL('./tokens.css', import.meta.url)` 在 vitest(happy-dom)下 import.meta.url 非 file 协议直接抛 TypeError;Vite 惯用 `?raw` 导入被 vitest 默认 CSS mock 吞为空串(探针实证 LENGTH=0)。最终 `node:fs readFileSync + import.meta.dirname`(vitest 原生支持,TS 侧由 tsconfig.vitest.json 的 node types 支撑)
- **tsconfig.app.json 排除测试文件**:app 项目(src/**/*,无 node types)此前连坐检查 *.test.ts(Phase 1 无 node 依赖型测试故未暴露);排除后测试统一由 tsconfig.vitest.json 检查,type-check 保障面不缩水
- **D-10 功能色背景/边框变体定值**(亮:背景 oklch(0.96 ±0.02 同色相) / 边框 0.72-0.75;暗:背景 0.26-0.28 / 边框 0.45-0.48):非文字用途,不受 4.5:1 约束,均在计划授权的 executor 定值范围内

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] color-scheme 亮色兜底的声明顺序**
- **Found during:** Task 1(tokens.css 重构)
- **Issue:** 计划步骤 4 将 `:root { color-scheme: light; }` 置于文件末尾(所有块之后);因 `:root` 与 `.dark` 特异性同为 (0,1,0) 靠源顺序覆盖,该顺序会使暗色模式下 `.dark { color-scheme: dark; }` 被文件后方的 :root 声明反向覆盖,CSS-only 兜底失真(02-RESEARCH §Pattern 1 骨架即为 light 先、dark 后)
- **Fix:** 亮色 :root 兜底置于 .dark 块之前,注释写明源顺序纪律与修正原因
- **Files modified:** src/styles/tokens.css
- **Verification:** tokens.test.ts color-scheme 双声明断言 + D-12 git 对照全过
- **Committed in:** 4012103 (Task 1 commit)

**2. [Rule 3 - Blocking] 测试读盘:vitest 下 import.meta.url 非 file 协议 + ?raw 被 CSS mock 吞空**
- **Found during:** Task 1(tokens.test.ts 首次运行)
- **Issue:** 计划的 `readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')` 抛 `TypeError: The URL must be of scheme file`;改用 Vite `?raw` 导入后探针实测返回空字符串(vitest 默认 css:false 将 CSS 模块 mock 为空)
- **Fix:** `readFileSync(`${import.meta.dirname}/tokens.css`, 'utf8')`(vitest 原生支持 dirname,运行时探针验证 3223 字符逐字可断)
- **Files modified:** src/styles/tokens.test.ts
- **Verification:** vitest 31 测试全绿
- **Committed in:** 4012103 (Task 1 commit)

**3. [Rule 3 - Blocking] tsconfig.app.json 连坐检查测试文件导致 node:fs 幽灵类型错误**
- **Found during:** Task 1(首次 type-check)
- **Issue:** app 项目 include `src/**/*` 且 exclude 仅 `__tests__`,就近布局的 *.test.ts 被无 node types 的 app 项目检查,`node:fs` 报 TS2591
- **Fix:** tsconfig.app.json exclude 增加 `src/**/*.test.ts`(测试由 tsconfig.vitest.json 统一检查,Phase 1 就近布局决策的自然补全,保障面不缩水)
- **Files modified:** tsconfig.app.json
- **Verification:** type-check 退出码 0
- **Committed in:** 4012103 (Task 1 commit)

**4. [Rule 3 - Blocking] oxlint vitest/valid-expect 与 expect-expect 卡口**
- **Found during:** 整体验证(计划要求 `pnpm lint` 退出码 0)
- **Issue:** ① oxlint 默认 maxArgs=1 拒绝 vitest 官方双参 `expect(actual, message)`(D-20 失败消息修复指引依赖它);② `it.each` 回调内经辅助函数调用的断言被 expect-expect 规则判为"Test has no assertions"
- **Fix:** .oxlintrc.json 启用 `vitest/valid-expect: ["error", { maxArgs: 2 }]`;tokens.test.ts 将对比度断言内联回 it.each 回调(消息构建抽为 contrastFailHint 纯函数)
- **Files modified:** .oxlintrc.json, src/styles/tokens.test.ts
- **Verification:** lint 退出码 0,tokens 31 测试全绿
- **Committed in:** 4e9ae55(独立 fix 提交)

---

**Total deviations:** 4 auto-fixed(1 Rule 1 bug + 3 Rule 3 blocking)
**Impact on plan:** 四处均为实现形态/工具链层面修正,交付物语义与验收标准完全一致;无范围蔓延。

## Issues Encountered

- 计划色对首次实跑时自写验证脚本曾出现 9 对 FAIL,排查为脚本自身把 sRGB gamma 编码值直接当 WCAG 亮度用(漏掉解码抵消);修正算法后 20 对全 PASS——正式测试文件的算法实现(线性值直接加权)经黑白 21:1 精确锚点哨兵验证。计划提供的全部起点色值零调色返工
- 执行器运行环境的命令链输出偶发截断(type-check/lint 退出码 echo 被吞),通过单独重跑逐项确认,无实际影响

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- plan 02-02(useThemeMode)可直接落笔:base.css 已备好 .theme-switching 中和规则与配对注释,tokens.css 已备好 :root/.dark color-scheme CSS 兜底(JS 双写接管方);THEME_STORAGE_KEY 惯例 `little-utils:v1:*` 首落地待 02-02
- plan 02-03(六件套)消费面就绪:语义层 var(--color-bg/surface/surface-raised/text-*/border)、功能色及背景/边框变体、var(--color-focus) 焦点环语义角色全部可用
- plan 02-05(cm-theme)字面值来源就绪:`import { tokens } from '../../../styles/tokens'`(light 组含三个 *-deep 键)
- 亮暗双主题已可整站零改动翻转(挂/摘 .dark 类);对比度红线由 tokens.test.ts 守护,Phase 6 强风格化改色即红
- 无阻塞项;SITE-05 的 iOS 真机行为面与 reduced-motion 系统级走查按 D-23 留待 phase verify-work 手动抽验

## Known Stubs

None - 本计划交付物无 stub(全部为完整实现,无占位数据/未接线组件)。

## Self-Check: PASSED

- FOUND: src/styles/tokens.css / tokens.ts / tokens.test.ts / base.css / base-rules.test.ts(5/5)
- FOUND: .planning/phases/02-design-system-a11y-baseline/02-01-SUMMARY.md
- FOUND: commit 4012103(Task 1)/ 4e9ae55(lint fix)/ 82ae691(Task 2)(3/3)

---
*Phase: 02-design-system-a11y-baseline*
*Completed: 2026-09-08*
