---
phase: 02-design-system-a11y-baseline
plan: 03
subsystem: ui
tags: [vue-sfc, tailwindcss, design-tokens, accessibility, aria, touch-target, v-model, useId, vitest, component-library]

# Dependency graph
requires:
  - phase: 02-design-system-a11y-baseline
    provides: plan 02-01 三层令牌体系(语义层 var(--color-*)/组件层 --color-focus)与 base.css 全局基线(16px 兜底/reduced-motion 中和/:focus-visible 焦点环);plan 02-02 ThemeToggle 先例(SFC 形态/a11y 内置/组件测试纪律)
provides:
  - src/ui/Button.vue 交互按钮(outline/ghost 两 variant + min-h-11 44px 触控 + disabled 语义 + 显式 type="button" 可被 attrs 覆盖)
  - src/ui/Input.vue 输入组件(Vue 3.5 useId 关联 label + v-model 契约 + multiline textarea 变体 + 错误态 aria 三件套[aria-invalid/aria-describedby/danger 边框文案])
  - src/ui/Card.vue 动态标签容器(as 透传 to/href/class + padding 可关 + 默认槽)
  - 三份就近组件测试 19 用例,锁定 D-13 六件套前三件 API 契约(Phase 5 批量工具的向后兼容面,D-14 costly)
affects: [02-04(六件套后三件沿用形态/测试纪律), 02-06/02-07(ToolCard/home/not-found/json-formatter 迁移消费 Button/Input/Card), phase-5(七个批量工具拿来即用 D-14), verify-work(D-23 手动抽验)]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
actuals:
  tokens: 4876    # 19504 chars / 4 over the realized diff (8 files, +383/-3)
  tasks: 3
  commits: 4

# Tech tracking
tech-stack:
  added: []       # 零新依赖(T-02-SC 纪律:零安装、未动 pnpm-lock.yaml;六件套全部自研)
  patterns:
    - 六件套 SFC 形态:template 前 script 后 + defineOptions 自命名 + 头注释决策引用 + 无 style 块全 Tailwind(延续 safe-html/ThemeToggle 先例)
    - 多根组件 attrs 处理:inheritAttrs:false + 控件显式 v-bind="$attrs" 置前,组件持有的 id/value/aria 绑定置后不被覆盖
    - 组件测试纪律:mount helper + 工厂 + 源码级 class 断言(Pitfall 5,不测布局计算)+ backstop 长文案用例 + createRouter 上下文(as="RouterLink")
    - 命名契约与 lint 冲突解法:oxlint overrides 按文件豁免保留名误报;eslint src/ui 并入 multi-word 单词名豁免块

key-files:
  created:
    - src/ui/Button.vue
    - src/ui/Button.test.ts
    - src/ui/Input.vue
    - src/ui/Input.test.ts
    - src/ui/Card.vue
    - src/ui/Card.test.ts
  modified:
    - .oxlintrc.json
    - eslint.config.ts

key-decisions:
  - "Input 多根组件 attrs 落地形态:计划仅写『attrs 透传 type 默认 text』,实现为 inheritAttrs:false + v-bind=\"$attrs\" 置前、组件绑定(:id/:value/aria-*)置后——label 关联的 id 契约不可被调用方覆盖,type 不写死由浏览器默认 text 兜底(调用方可透传覆盖)"
  - "lint 卡口冲突:oxlint vue/no-reserved-component-names 判 Button/Input 保留名,而组件名是 D-13/D-18 契约;行内 eslint-disable 指令会被 oxlint --fix 当未使用指令自动删除(实证),改 .oxlintrc.json overrides 按文件豁免(Rule 3)"
  - "eslint vue/multi-word-component-names:src/ui 并入既有 pages/layouts 单词名豁免块,六件套单名与文件名一致同属既定惯例(plan 02-04 的 Tabs 同受益)(Rule 3)"
  - "id 生成用 Vue 3.5 原生 useId()(SSG 安全零依赖,计划指定),错误节点 id 派生 `${id}-error` 经 aria-describedby 关联;测试断言走 attributes 对比不依赖 id 具体格式"

patterns-established:
  - "六件套组件测试模板:mountXxx helper 收敛选项 + 正/反断言成对 + backstop 长文案用例 + 源码级 min-h-11/text-base 断言(02-06/02-07 迁移与 02-04 后三件直接复制)"
  - "保留名组件豁免模式:D-13 命名契约组件在 .oxlintrc.json overrides 白名单 + .vue 内注释指认配置;新增保留名单名组件需同步 overrides"
  - "多根表单组件 attrs 契约:v-bind=\"$attrs\" 置前透传、组件持有绑定置后持有,测试锁定 id/aria 不被覆盖"

requirements-completed: [SITE-05, STYL-03]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Button 组件契约:outline/ghost 两 variant(withDefaults 默认 outline)、min-h-11 44px 触控(D-21)、disabled 透传语义(disabled:opacity-40/cursor-not-allowed)、显式 type=\"button\" 且 attrs 可覆盖为 submit、默认槽渲染、长文案换行不截断 backstop(UI-SPEC long-text 行)"
    requirement: SITE-05
    verification:
      - kind: unit
        ref: "src/ui/Button.test.ts#7 用例(根/type/outline 类/ghost 类/disabled/插槽/type 覆盖/长文案 backstop)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Input 组件契约:label for/id 关联(Vue 3.5 useId)、v-model 契约(update:modelValue)、multiline textarea(rows=4)变体、错误态 error prop → danger 边框/文案 + aria-invalid + aria-describedby(UI-SPEC error 行,文案零内置)、无错误基线无 aria、控件 text-base 16px + min-h-11 44px 源码级(D-21)、size prop 留位(D-16)"
    requirement: SITE-05
    verification:
      - kind: unit
        ref: "src/ui/Input.test.ts#7 用例(label 关联/v-model/multiline/错误态/无错误/源码级 16px+44px/size 留位)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Card 组件契约:as 动态标签(默认 div;as=\"RouterLink\" + :to 经 attrs 透传渲染 a/href)、padding 可关(默认 p-5,false 供 p-10/p-3 定制)、默认槽、卡片语言四件类(rounded-lg/border-[var(--color-border)]/bg-[var(--color-surface)]/p-5)、受控展示容器无 partial 分支(UI-SPEC partial 行)、长描述自然换行 backstop"
    verification:
      - kind: unit
        ref: "src/ui/Card.test.ts#5 用例(默认类/as=RouterLink href/padding 关闭/默认槽/长文案 backstop)"
        status: pass
    human_judgment: false
  - id: D4
    description: "组件克制与降级契约:三组件零 style 块、零 glow 类、零 v-html(T-02-05 mitigate:纯文本插值与 :prop 绑定);transition-colors 仅 hover 用途(D-11 不受限)且受 base.css reduced-motion 全局中和覆盖(plan 02-01 D-22)"
    requirement: STYL-03
    verification:
      - kind: unit
        ref: "src/styles/base-rules.test.ts#reduced-motion 全局中和块存在且四项压缩属性齐备(plan 02-01,覆盖本计划组件级 transition)"
        status: pass
      - kind: other
        ref: "源码级人工核对:grep <style|v-html|glow 三组件零实际命中(仅头注释文档文字),var(--color-*) 语义令牌消费"
        status: pass
    human_judgment: false

# Metrics
duration: 20min
completed: 2026-09-08
status: complete
---

# Phase 2 Plan 3: 设计系统与响应式/可访问性基线 — 六件套第一组垂直切片 Summary

**Button(outline/ghost + 44px + disabled 语义)、Input(useId 关联 label + v-model + textarea 变体 + 错误态 aria 三件套)、Card(as 动态标签 + padding 可关)三组件全 Tailwind SFC 落地,19 条组件测试锁定 D-13 契约,全量 155 测试绿、type-check/lint 退出码 0、零新依赖**

## Performance

- **Duration:** 20 min
- **Started:** 2026-09-08T07:11:20Z
- **Completed:** 2026-09-08T07:31:18Z
- **Tasks:** 3
- **Files modified:** 8 (6 created, 2 modified)

## Accomplishments

- 新建 `Button.vue`:variant 契约(outline 描边 hover 霓虹青 / ghost 提亮底色,withDefaults 默认 outline)、min-h-11 44px 触控(D-21)、disabled 透传语义(对齐 json-formatter 现有按钮与 tool.layout 返回键视觉语言)、显式 type="button" 且 attrs 可覆盖为 submit、焦点环依赖 base.css 全局 :focus-visible 不重复声明、无 weight 类(UI-SPEC weights 仅 400/600)、无 style 块、无 glow 类(D-08);7 条组件测试含 120 字长文案换行 backstop
- 新建 `Input.vue`:Vue 3.5 useId()(SSG 安全零依赖)关联 label for/id、v-model 契约(:value + @input emit,CodeMirrorJson 签名先例形态)、multiline 变体渲染 rows=4 textarea、错误态三件套(error prop → border-[var(--color-danger)] + aria-invalid + aria-describedby 指向 `${id}-error` 错误节点,文案零内置仅渲染调用方传入)、无错误时无 aria 属性与错误节点、控件 text-base 16px + min-h-11 44px(D-21 组件默认层)、焦点边框经组件层 --color-focus(D-09 不直连原语)、size prop 留位(D-16);多根组件以 inheritAttrs:false + 控件 v-bind="$attrs" 实现 type/placeholder 等透传;7 条测试
- 新建 `Card.vue`:as 动态标签容器(默认 div,as="RouterLink" + :to 经 attrs 自然透传渲染为 a/href——供 plan 02-06 ToolCard 迁移)、padding 可关(默认 p-5,false 供 home 空态 p-10/json-formatter 结果卡 p-3 定制)、默认槽、卡片语言四件类语义令牌消费、无 style 块无 glow;5 条测试含 createRouter 上下文 as=RouterLink 用例与 156 字长描述换行 backstop
- lint 卡口修复(Rule 3):D-13/D-18 单名契约与 oxlint 保留名规则/eslint 单词名规则冲突,以 .oxlintrc.json overrides(按文件)+ eslint.config.ts src/ui 豁免块解决,守卫面不缩水
- 全量回归:155 测试(136 既有 + 19 新增)全绿、type-check/lint 退出码 0;三组件源码级人工核对零 style 块/零 glow/零 v-html

## Task Commits

Each task was committed atomically:

1. **Task 1: Button 组件 — variant 契约 + 44px + disabled 语义** - `119279e` (feat) — tracer 任务,提交后反馈门重跑 verify 端到端通过(⚡ Tracer verified end-to-end — expanding)
2. **Task 2: Input 组件 — textarea 变体 + label 关联 + v-model + 错误态 aria** - `c14e5a7` (feat)
3. **Task 3: Card 组件 — 动态标签容器(as/padding)** - `5d789f8` (feat)

**插入提交:** `7093ee7` (fix) — lint 卡口修复:oxlint overrides 豁免 Button/Input 保留名误报 + eslint src/ui 并入单词名豁免块。由计划整体 `<verification>` 的 `pnpm lint 退出码 0` 要求触发。

**Plan metadata:** docs commit(见 git log `docs(02-03)`)

_Note: 本计划无 TDD 任务;三个任务(tracer + auto ×2)均单 commit 完成。_

## Files Created/Modified

- `src/ui/Button.vue` (created) — 交互按钮组件(outline/ghost 两 variant + 44px + disabled 语义 + type 覆盖契约)
- `src/ui/Button.test.ts` (created) — 7 用例:variant/disabled/插槽/type 覆盖 + 长文案 backstop
- `src/ui/Input.vue` (created) — 输入组件(label 关联 + v-model + textarea 变体 + 错误态 aria + 16px/44px 默认)
- `src/ui/Input.test.ts` (created) — 7 用例:label 关联/v-model/multiline/错误态/无错误/源码级/size 留位
- `src/ui/Card.vue` (created) — 动态标签容器(as/padding + attrs 透传 + 默认槽)
- `src/ui/Card.test.ts` (created) — 5 用例:默认类/as=RouterLink/padding/槽 + 长文案 backstop
- `.oxlintrc.json` (modified) — overrides 豁免 Button/Input 的 vue/no-reserved-component-names(Rule 3)
- `eslint.config.ts` (modified) — src/ui 并入 vue/multi-word-component-names 豁免块(Rule 3)

## Decisions Made

- **Input 多根组件 attrs 落地形态**:计划写「attrs 透传 type 默认 text」,实现为 `inheritAttrs: false` + 控件显式 `v-bind="$attrs"` 置前、组件持有绑定(`:id`/`:value`/`aria-*`)置后——label 关联的 id 契约不可被调用方覆盖;`type` 不写死,由浏览器默认 text 兜底且调用方可透传覆盖(password/email 等)。属计划授权的实现细节定形,测试未锁 id 具体格式(走 attributes 对比)
- **id 断言形态**:useId 生成格式不进断言(避免依赖 Vue 内部 id 命名),label for ↔ 控件 id、aria-describedby ↔ 错误节点 id 均以 attributes 相等性断言
- **Card attrs 透传依赖单根 + inheritAttrs:true(计划指定)**:as="RouterLink" 的 :to 以 attrs 传入(非 props),与显式 import + 全局注册 RouterLink 的测试上下文(ToolCard.test.ts 先例)配合验证
- **lint 豁免留痕**:两组件 defineOptions 上方注释写明 D-13/D-18 契约依据并指认 .oxlintrc.json overrides,配置豁免可追溯

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] lint 卡口:D-13 命名契约与组件命名规则冲突**
- **Found during:** 计划整体 `<verification>`(首次 `pnpm lint`,退出码 1)
- **Issue:** ① oxlint `vue/no-reserved-component-names`(correctness 档默认启用)判 `Button`/`Input` 为保留 HTML 名;② eslint `vue/multi-word-component-names`(flat/essential 档)判 Button/Input/Card 单词名。两组件名均为计划 `<action>` 明确要求(`defineOptions({ name: 'Button' })`/`{ name: 'Input' }`),D-13/D-18 契约与 lint 规则正面冲突;项目 SFC-only + 显式 import 无 in-DOM 模板歧义,属误报
- **Fix:** ① 先试行内 `// eslint-disable-next-line` 指令,实证被 `oxlint . --fix` 当作未使用指令自动删除(不可持续)→ 改 `.oxlintrc.json` overrides 仅对 Button.vue/Input.vue 关闭该规则;② eslint.config.ts 将 `src/ui/**/*.vue` 并入既有 pages/layouts 单词名豁免块。eslint 侧 no-reserved 规则本就经 buildFromOxlintConfigFile 委托 oxlint,配置一次收口双 linter
- **Files modified:** .oxlintrc.json, eslint.config.ts, src/ui/Button.vue(注释留痕), src/ui/Input.vue(注释留痕)
- **Verification:** lint 退出码 0;三组件测试 19/19、type-check、全量 155 测试重跑全绿
- **Committed in:** 7093ee7(独立 fix 提交,02-01 `4e9ae55` 先例)

---

**Total deviations:** 1 auto-fixed(Rule 3 blocking,含 oxlint/eslint 两处配置面)
**Impact on plan:** 交付物语义与验收标准完全一致;豁免仅限 D-13 契约组件,守卫面不缩水。无范围蔓延。

## Issues Encountered

- 行内 eslint-disable 指令在 oxlint 下不可用:`oxlint . --fix` 会将指令解析为未使用/未知指令并自动删除(运行后注释消失、错误复现),行内豁免与 lint:oxlint 的 --fix 形态互斥——记录为模式反例,同类冲突直接走 overrides 配置层
- 执行器环境命令链输出偶发截断(type-check 退出码 echo 被吞,02-01/02-02 已知怪癖),改用落盘日志 + 单独重跑逐项确认,无实际影响

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- plan 02-04(六件套后三件 Tabs/CopyableText/ThemeToggle 收尾)形态与测试纪律全套就绪:mount helper + 源码级断言 + backstop 用例模板可直接复制;单名组件(Tabs)若触发单词名规则,src/ui 豁免块已覆盖
- plan 02-06/02-07(存量迁移)消费面就绪:Card as="RouterLink" + :to 迁移 ToolCard、padding=false 迁移 home 空态卡(p-10)与 json-formatter 结果卡(p-3);Button variant/disabled 迁移 json-formatter 格式化/压缩按钮;Input 供 Phase 5 表单类工具直接消费
- 语义令牌消费面(02-01)+ 主题切换(02-02)+ 三组件契约(本计划)= Phase 5「拿来即用」契约(D-14)实体齐备前三件
- 无阻塞项;D-23 手动抽验(真机:输入聚焦不缩放、44px 触控、错误态读屏)按计划留 phase verify-work 与 JSON 工具全流程一并走查

## Known Stubs

None - 本计划交付物无 stub(三组件全部完整实现,无占位数据/未接线逻辑;错误文案零内置为 UI-SPEC 契约设计而非 stub)。

## Self-Check: PASSED

- FOUND: src/ui/Button.vue / Button.test.ts / Input.vue / Input.test.ts / Card.vue / Card.test.ts(6/6 created)
- FOUND: .oxlintrc.json / eslint.config.ts(2/2 modified)
- FOUND: .planning/phases/02-design-system-a11y-baseline/02-03-SUMMARY.md
- FOUND: commit 119279e(Task 1)/ c14e5a7(Task 2)/ 5d789f8(Task 3)/ 7093ee7(lint fix)(4/4)

---
*Phase: 02-design-system-a11y-baseline*
*Completed: 2026-09-08*
