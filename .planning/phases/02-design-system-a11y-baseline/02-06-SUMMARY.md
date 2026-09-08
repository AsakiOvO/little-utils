---
phase: 02-design-system-a11y-baseline
plan: 06
subsystem: ui
tags: [component-migration, tailwindcss, design-tokens, typography-normalization, touch-target, card, theme-toggle, d15]

# Dependency graph
requires:
  - phase: 02-design-system-a11y-baseline
    provides: plan 02-03 Card 契约(as 动态标签 + :to attrs 透传 + padding 可关)与 Button outline 样式语言;plan 02-02 ThemeToggle 双 layout 挂载(D-03 位置契约);plan 02-01 语义令牌消费面 var(--color-*)
provides:
  - src/components/ToolCard.vue 经六件套 Card(as=RouterLink + attrs 透传)渲染——D-15 存量迁移第一站,Card API 完备性经真实消费验证
  - src/pages/home.vue 整页空态经 Card(:padding=false + p-10)渲染 + 全页 Typography 归一(h1 Display 28px/600、h2/空态标题 Heading 20px/600)
  - src/pages/not-found.vue 返回首页 44px 触控(RouterLink + Button outline 样式语言)+ weight/Heading 归一
  - src/layouts/home.layout.vue 品牌 Display 28px/600(glow-cyan 保留)+ footer 14px;src/layouts/tool.layout.vue header 16px 核心档 + 返回键 min-h-11
  - 全站迁移面(font-bold/font-medium 零残留、py-3/py-1.5 存量归一)——排版硬规则 UI-SPEC Typography 在 D-15 第一批落地
affects: [02-07(json-formatter Button/CopyableText/Card 迁移沿同款归一纪律,py-1.5 存量随迁归一), phase-4(首页/导航改版时新旧组件不并存的前提就位), phase-6(强风格化只加装饰不迁组件)]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
actuals:
  tokens: 2655    # 10620 chars / 4 over the realized diff (6 files, +38/-24 src diff)
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []       # 零新依赖(T-02-SC 纪律:零安装、未动 package.json/pnpm-lock.yaml;纯存量文件迁移)
  patterns:
    - Card as="RouterLink" 真实消费形态:根容器样式四件套(rounded-lg/border/bg-surface/p-5)下沉组件,调用方只叠加布局与 hover accent 类
    - Card :padding="false" + 显式 p-10 定制内边距形态(空态大留白场景)
    - Typography 归一映射:text-3xl/bold → text-[28px]/semibold、text-lg|text-xl → text-[20px]、font-medium → 400 或 600
    - 12px 存量归一:py-3 → py-4、py-1.5 → min-h-11 承担(交互件 44px 与垂直内边距合并解决)

key-files:
  created: []
  modified:
    - src/components/ToolCard.vue
    - src/components/ToolCard.test.ts
    - src/pages/home.vue
    - src/pages/not-found.vue
    - src/layouts/home.layout.vue
    - src/layouts/tool.layout.vue

key-decisions:
  - "ToolCard 测试适配取最小形态:既有 wrapper.find('a') 断言天然兼容 Card as=RouterLink 渲染产物,仅更新用例描述与头注释对齐消费语义,断言本体零改动(计划授权的『或直接对 wrapper.find(a)』分支)"
  - "not-found 返回首页选 RouterLink + Button outline 样式语言而非 Button 组件消费(计划两案择一):Button 无链接形态,保留语义导航优先;类字符串逐字采用计划给定值(min-h-11/去 font-medium/hover accent 三类)"
  - "home 分类空态虚线卡保留原样式不套 Card:虚线不属于 Card 实线卡片语言(UI-SPEC Component Inventory),注释写明保留原因,文案逐字锁定"
  - "计划验证条款『py-3/py-1.5 存量已归一』按迁移面口径执行:UI-SPEC Spacing Exceptions 点名双 layout header 与返回键——json-formatter(py-1.5,归 plan 02-07)与 timestamp-converter(py-3,Phase 2 迁移清单外)不越界修复,记录 deferred-items.md"

patterns-established:
  - "存量迁移三步模式(02-07 直接复制):换根容器为六件套(样式下沉)→ Typography 类逐项归一(28/20/600)→ 交互件补 min-h-11 并淘汰 12px 档"
  - "归一注释留痕:每处归一点(品牌/footer/header/返回键/空态)以行内注释引用 UI-SPEC 档位与 D-XX 编号,后续改版可追溯归一依据"
  - "hover accent 保留契约:迁移不丢既有 hover 语言(工具卡 hover:border-neon-cyan + hover:bg-surface-raised;not-found 返回键 hover 三类对齐 Button outline)"

requirements-completed: [STYL-03]

# Coverage metadata (#1602)
coverage:
  - id: C1
    description: "ToolCard 根容器由手写卡片样式换用六件套 Card(as=RouterLink + :to attrs 透传),rounded-lg/border/bg-surface/p-5 由 Card 默认提供;hover accent 两类保留(hover:border-neon-cyan + hover:bg-surface-raised,UI-SPEC Accent reserved「工具卡 hover 边框」);icon size-6 aria-hidden、NEW 徽标、h3/p 内部结构一行不动;显式 import Card(D-18);Card API 完备性经真实消费验证(D-15)"
    requirement: STYL-03
    verification:
      - kind: unit
        ref: "src/components/ToolCard.test.ts#5 用例全绿:名称/描述文本、Card as=RouterLink 渲染 a/href=/json-formatter、icon 函数式渲染、NEW 徽标正反"
        status: pass
      - kind: other
        ref: "源码级 grep:import Card from '../ui/Card.vue' 可见,无双套并存(根容器无手写 rounded-lg/border/bg-surface 残留)"
        status: pass
    human_judgment: false
  - id: C2
    description: "home.vue 整页空态卡(v-if=!hasAnyTool)换 Card(:padding=false + class p-10 text-center),内部两行文案逐字保留;空态标题 text-lg/font-medium → text-[20px]/font-semibold;h1 text-3xl/font-bold → text-[28px]/font-semibold(Display);h2 text-lg → text-[20px](Heading);分类空态虚线卡样式与文案保留(虚线非 Card 语言,注释留痕)"
    requirement: STYL-03
    verification:
      - kind: unit
        ref: "全量 vitest 172 测试(18 文件)全绿——含 ToolCard/registry/routes 既有用例回归"
        status: pass
      - kind: other
        ref: "源码级 grep:font-bold/font-medium 全站零类残留(唯一命中为注释文字)"
        status: pass
    human_judgment: true
    rationale: "空态三行文案与 UI-SPEC Empty state 行逐字一致(整页空态标题/正文 + 分类空态)为执行中人工对照确认,本计划未新增自动化文案断言(计划不要求,既有文案零改写即零风险面)"
  - id: C3
    description: "not-found.vue:404 font-bold → font-semibold(weights 仅 400/600,尺寸 text-6xl 保留——UI-SPEC 未点名);h1 text-xl → text-[20px]/font-semibold;返回首页 RouterLink 保留语义导航 + Button outline 样式语言:inline-flex/items-center/justify-center + min-h-11(44px 触控,D-21)、px-4、去 font-medium 与 py-2、hover:bg-raised + hover:border-cyan + hover:text-cyan(对齐 Button outline 三类)"
    requirement: STYL-03
    verification:
      - kind: other
        ref: "源码级核对:not-found 类字符串与计划 <action> 给定值逐字一致;min-h-11 存在;font-medium 零残留"
        status: pass
    human_judgment: false
  - id: C4
    description: "双 layout 归一:home 品牌 logo text-lg/font-bold → text-[28px]/font-semibold(Display,cyan + glow-cyan 保留——D-08 装饰/品牌层既有用法);home footer 文案 text-xs → text-sm(Label/Meta 14px);tool header 内容器 py-3 → py-4(12px 存量归一 16px 核心档);tool 返回键 px-2.5/py-1.5 → px-3 + min-h-11(py-1.5 淘汰);ThemeToggle 挂载结构与位置双 layout 均未移动(D-03);header py-4/nav text-sm/主区 max-w-4xl px-4 py-8 不动"
    requirement: STYL-03
    verification:
      - kind: unit
        ref: "全量 vitest 172 + type-check + lint(Found 0 warnings and 0 errors)三项退出码 0"
        status: pass
      - kind: other
        ref: "源码级 grep:双 layout 内 py-3/py-1.5 零类残留(唯一命中为归一注释文字);ThemeToggle 组件行原文未动"
        status: pass
    human_judgment: false

# Metrics
duration: 8min
completed: 2026-09-08
status: complete
---

# Phase 2 Plan 6: 设计系统与响应式/可访问性基线 — D-15 存量迁移第一批(ToolCard/home/not-found/双 layout)Summary

**ToolCard 经六件套 Card(as=RouterLink)真实消费(D-15 第一站,Card API 完备性验证成立)、home/not-found/双 layout Typography 归一全落地(weights 400/600、尺寸 16/14/20/28、12px 存量归一 16px 档)、空态三行文案逐字锁定、返回键与 404 页 44px 触控,全量 172 测试 + type-check + lint 三绿、零新依赖零 package.json 变更**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-08T08:43:06Z
- **Completed:** 2026-09-08T08:51:06Z
- **Tasks:** 3
- **Files modified:** 6 (all modified, 0 created)

## Accomplishments

- **ToolCard 迁移(tracer)**:根 RouterLink 手写卡片样式(rounded-lg/border/bg-surface/p-5)换用 `<Card as="RouterLink" :to="tool.path">`,布局类(group flex flex-col gap-2)与 hover accent 两类(hover:border-neon-cyan + hover:bg-surface-raised)保留叠加;内部结构(icon size-6 aria-hidden、NEW 徽标 magenta、h3/p)一行不动;显式 import Card(D-18);头注释补引 D-15。Card 的 as=RouterLink + :to attrs 透传经生产消费面真实验证(plan 02-03 Card.test.ts 契约成立)
- **home/not-found 迁移**:home 整页空态卡换 `<Card :padding="false" class="mt-12 p-10 text-center">`(Card 默认 p-5 不符空态大留白);h1 `text-3xl font-bold` → `text-[28px] font-semibold`(Display 28px/600/1.2 语义)、h2 与空态标题 `text-lg` → `text-[20px] font-semibold`(Heading);not-found 404 `font-bold` → `font-semibold`、h1 `text-xl` → `text-[20px]`;返回首页 RouterLink 保留语义导航 + Button outline 样式语言 + `min-h-11`(44px,D-21),去 font-medium,hover accent 三类对齐 outline 语言
- **双 layout 归一**:home 品牌 logo `text-lg font-bold` → `text-[28px] font-semibold`(cyan + glow-cyan 保留,D-08 品牌层既有用法);footer 文案 `text-xs` → `text-sm`(Label/Meta 14px);tool header `py-3` → `py-4`(12px 存量归一 16px 核心档);返回键 `px-2.5 py-1.5` → `px-3 + min-h-11`(py-1.5 淘汰);ThemeToggle 挂载结构与位置零移动(D-03)
- **文案锁定**:空态三行(「工具正在准备上线」「工具注册表尚未收录任何工具,敬请期待。」「该分类工具即将上线」)逐字保留零改写(UI-SPEC Empty state 锁定)
- **全量回归**:172 测试(18 文件)全绿、type-check 退出码 0、lint "Found 0 warnings and 0 errors";全站 grep font-bold/font-medium 类零残留、迁移面 py-3/py-1.5 零残留

## Task Commits

Each task was committed atomically:

1. **Task 1: ToolCard 迁移 — Card(as=RouterLink) 消费 + hover accent 保留** - `cf06362` (feat) — tracer 任务,提交后反馈门重跑 verify 端到端通过(⚡ Tracer verified end-to-end — expanding)
2. **Task 2: home/not-found 迁移 + Typography 归一 + 文案锁定** - `2231fee` (feat)
3. **Task 3: 双 layout 归一 — 品牌 Display/footer 14px/header 16px/返回键 44px** - `7181c57` (feat)

**Plan metadata:** docs commit(见 git log `docs(02-06)`)

_Note: 本计划无 TDD 任务(MVP+TDD gate 未激活);三个任务(tracer + auto ×2)均单 commit 完成,零偏差提交。_

## Files Created/Modified

- `src/components/ToolCard.vue` (modified) — 根容器换 Card(as=RouterLink),样式下沉组件、hover accent 保留、头注释补引 D-15
- `src/components/ToolCard.test.ts` (modified) — 头注释与链接用例描述对齐 Card 消费语义(断言本体与语义零改动)
- `src/pages/home.vue` (modified) — 空态卡换 Card(:padding=false + p-10)、h1/h2/空态标题归一、分类空态虚线保留并注释、import Card
- `src/pages/not-found.vue` (modified) — 404/600、h1 20px、返回键 min-h-11 + outline hover 语言、头注释归一依据
- `src/layouts/home.layout.vue` (modified) — 品牌 Display 28px/600(glow 保留)、footer text-sm
- `src/layouts/tool.layout.vue` (modified) — header py-4、返回键 min-h-11(px-3)、归一注释留痕

## Decisions Made

- **ToolCard 测试最小适配**:既有 `wrapper.find('a')` + href 断言天然兼容 Card as=RouterLink 渲染产物(动态标签渲染同为 a 元素),取计划授权的「直接对 wrapper.find('a')」分支——仅描述与头注释对齐,断言本体零改动,避免无意义测试翻新
- **not-found 返回键方案择一**:计划给「Button 组件消费」与「RouterLink + Button 样式语言」两案,选后者(Button 无链接形态,语义导航优先)——类字符串逐字采用计划给定值,注释说明选择依据
- **分类空态虚线卡保留**:虚线不属于 Card 实线卡片语言(UI-SPEC Component Inventory Card 行),强行套 Card 反而引入 variant 概念;注释写明保留原因,文案逐字锁定
- **计划验证条款口径**:「py-3/py-1.5 存量已归一」按迁移面执行(UI-SPEC Spacing Exceptions 点名双 layout header 与返回键);json-formatter py-1.5 归 plan 02-07 既定迁移面、timestamp-converter py-3 在 Phase 2 迁移清单外——按 SCOPE BOUNDARY 不越界修复,记录 deferred-items.md 供后续阶段处置

## Deviations from Plan

None - plan executed exactly as written. 三个任务全部按计划 <action> 逐字执行:类字符串、组件消费形态、文案锁定、注释留痕均与计划一致;零 Rule 1-4 触发,零插入提交。

## Issues Encountered

- 执行器环境命令链输出偶发截断(vitest 汇总行/退出码 echo 被吞,02-01/02-02/02-03 已知怪癖),改用落盘日志 + 单独重跑逐项确认,无实际影响
- 计划级 grep「py-3/py-1.5 存量已归一」在工具操作区(timestamp-converter/json-formatter)存在命中——属迁移面之外的既有存量而非本计划回归,见上「计划验证条款口径」决策与 deferred-items.md

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- plan 02-07(JSON 工具迁移)就绪:本计划确立「换根容器 → Typography 归一 → 交互件 min-h-11」三步迁移模式与注释留痕纪律可直接复制;json-formatter 的 py-1.5 按钮、错误卡、复制按钮随 Button/CopyableText/Card 迁移一并归一
- Card 组件三态消费形态齐备:as=RouterLink(ToolCard)/ :padding=false + p-10(home 空态)/ 默认 p-5(通用)——Phase 5 批量工具消费面无未知分支(D-14 目标达成)
- D-15 第一批完成:ToolCard/home/not-found/双 layout 新旧组件零并存;第二批(02-07 JSON 工具)完成后六件套真实消费闭环
- 无阻塞项;D-23 手动抽验(真机 44px 触控/暗色切换/输入不缩放)按计划留 phase verify-work 与 JSON 工具全流程一并走查

## Known Stubs

None - 本计划交付物无 stub(全部为存量文件原地迁移,无占位数据/未接线组件;文案锁定为 UI-SPEC 契约设计而非 stub)。

## Self-Check: PASSED

- FOUND: src/components/ToolCard.vue / ToolCard.test.ts / src/pages/home.vue / not-found.vue / src/layouts/home.layout.vue / tool.layout.vue(6/6 modified)
- FOUND: .planning/phases/02-design-system-a11y-baseline/02-06-SUMMARY.md
- FOUND: commit cf06362(Task 1)/ 2231fee(Task 2)/ 7181c57(Task 3)(3/3)

---
*Phase: 02-design-system-a11y-baseline*
*Completed: 2026-09-08*
