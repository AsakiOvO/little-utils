---
phase: 02-design-system-a11y-baseline
plan: 05
subsystem: ui
tags: [codemirror, compartment, theme-switching, oklch, design-tokens, dark-mode, syntax-highlighting, pnpm, zero-new-deps]

# Dependency graph
requires:
  - phase: 02-design-system-a11y-baseline
    provides: tokens.ts 色值单点(字面 oklch + light *-deep 深霓虹,plan 02-01)、useThemeMode resolved 三态状态源(plan 02-02)、check-chunks 首包零 CM 卡口(Phase 1 01-04)
provides:
  - src/tools/json-formatter/components/cm-theme.ts —— createCmTheme(dark) 双主题工厂(EditorView.theme chrome + HighlightStyle 语法高亮打包为单一扩展数组);仅本工具目录可 import(ARCH-02/T-02-09)
  - CodeMirrorJson.vue Compartment 双主题:themeComp.of(初始对齐 resolved)+ watch(resolved) reconfigure,切换不重建视图(输入/光标状态无损)
  - 依赖面:@codemirror/state/language/lezer-highlight 提升为直接依赖(lockfile 精确版本),@codemirror/theme-one-dark 移除
affects: [phase-5(批量工具接入复制 CM 主题形态与 Compartment 接线), phase-6(改色经 tokens.ts 同源保护编辑器配色), verify-work(D-23 手动抽验编辑器双主题)]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
actuals:
  tokens: 2107    # 8428 chars / 4 over the realized diff (4 files, +82/-17)
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []       # 零新装(T-02-SC):三个 CM 子包已是 lockfile 中 codemirror 元包传递依赖,仅提升为直接依赖(精确锁定既有版本,零下载);oneDark 移除
  patterns:
    - CM 主题工厂:createCmTheme(dark): Extension 返回 chrome+highlight 扩展数组,打包进一个 Compartment reconfigure 整体换
    - Compartment 主题接线三件套:themeComp.of(初始对齐 resolved)+ watch(resolved) reconfigure + 生命周期不动 —— 视图不重建
    - pnpm 传递依赖提升纪律:import 不可达时按 lockfile 精确版本提升为直接依赖(禁 pnpm update、禁版本替代)

key-files:
  created:
    - src/tools/json-formatter/components/cm-theme.ts
  modified:
    - src/tools/json-formatter/components/CodeMirrorJson.vue
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "CM 子包提升为直接依赖(Rule 3):pnpm 隔离布局使 @codemirror/state 等传递依赖从项目根不可解析,计划/RESEARCH Pattern 4 骨架的 import 不可达;按 lockfile 既有版本精确固定三子包(@codemirror/state@6.7.2、@codemirror/language@6.12.4、@lezer/highlight@1.2.3)修复 —— 零新装零新下载,T-02-SC 纪律保持;EditorView 走 codemirror 元包重导出(本文件既有惯例),manifest 变更收窄为 3 条"
  - "createCmTheme 返回扩展数组(chrome + HighlightStyle 打包)进单一 Compartment:reconfigure 原子换主题,dark 标志(EditorView.theme({dark}))与语法高亮同步切换,无 chrome/高亮半更新状态窗口"
  - "chrome spec 以单一 const c = dark ? tokens.dark : tokens.light 别名收敛七处色值引用;语法高亮亮色分支取 light['neon-*-deep'](D-07 深霓虹),暗色分支取 neon 原语(D-12 值)"

patterns-established:
  - "Phase 5 批量工具接入的 CM 双主题形态先例:cm-theme.ts 置于工具 components/ 目录只导出 createCmTheme(dark),Compartment 接线三件套(of 初始/watch reconfigure/生命周期不动)"
  - "语法高亮色彩映射成为 tokens.ts 消费面之一(亮 = 深霓虹 *-deep / 暗 = neon 原语):Phase 6 改色即红时编辑器配色同步被保护"

requirements-completed: [STYL-01, SITE-04]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "cm-theme 双主题模块(D-06):createCmTheme(dark) 工厂 —— chrome(底色=surface、活动行/选区=surface-raised、gutter 中性化 border:none、焦点环让渡宿主容器 focus-visible)+ 语法高亮(暗=霓虹原语三色 / 亮=D-07 深霓虹 *-deep 三色 + 中性 text-muted),色值全部取自 tokens.ts 字面 oklch;模块仅位于 json-formatter/components/(ARCH-02 懒加载边界,T-02-09 mitigate)"
    requirement: STYL-01
    verification:
      - kind: other
        ref: "corepack pnpm type-check && corepack pnpm vitest run(172 测试全绿;tokens.ts 导入与 Compartment 接线经类型系统确认)"
        status: pass
      - kind: other
        ref: "corepack pnpm build && corepack pnpm check:chunks(入口页可达集零 CM + CM chunk 以 json-formatter slug 开头 + 预算卡口,均退出码 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "CodeMirrorJson Compartment 双主题接线(D-06):oneDark 引用清零,themeComp.of(createCmTheme(resolved)) 初始对齐 + watch(resolved) reconfigure 切换主题不重建视图(输入/光标状态无损);@codemirror/theme-one-dark 从 package.json/lockfile 移除且 src 零残留"
    requirement: SITE-04
    verification:
      - kind: other
        ref: "corepack pnpm type-check 退出码 0(oneDark 引用清除由类型系统确认;若残留引用将 TS2307)"
        status: pass
      - kind: other
        ref: "corepack pnpm build && corepack pnpm check:chunks 退出码 0(切换载体编译进 json-formatter 工具 chunk,分包纪律不破)"
        status: pass
    human_judgment: true
    rationale: "编辑器底色/语法高亮随站点主题瞬切的实际视觉效果、以及切换中不丢输入/光标的交互体验,依赖真实浏览器渲染与交互;happy-dom 无 CM 组件测试(既有 172 测试全为回归面),按 D-23 手动抽验路径留 phase verify-work 走 JSON 工具完整流程时一并确认"

# Metrics
duration: 15min
completed: 2026-09-08
status: complete
---

# Phase 2 Plan 5: 设计系统与响应式/可访问性基线 — CodeMirror 双主题与 oneDark 移除 Summary

**CodeMirror 6 编辑器从硬编码 oneDark 换为站点语义令牌对齐的亮/暗双主题——createCmTheme(dark) 工厂(chrome + 深霓虹语法高亮)打包进单一 Compartment,watch(resolved) reconfigure 切换不重建视图;oneDark 死依赖移除,172 测试 + build/check:chunks 卡口全绿,零新装纪律闭环**

## Performance

- **Duration:** 15 min
- **Started:** 2026-09-08T08:19:19Z
- **Completed:** 2026-09-08T08:34:24Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- 新建 `src/tools/json-formatter/components/cm-theme.ts`:导出 `createCmTheme(dark): Extension` 工厂,返回 `[EditorView.theme(chrome, {dark}), syntaxHighlighting(HighlightStyle.define(...))]` 扩展数组。chrome 对齐语义令牌('&' 底色=surface+文字=text-primary、.cm-gutters=surface+border:none+text-muted、.cm-activeLine=surface-raised、选区三选择器=surface-raised、&.cm-focused outline:none 让渡宿主 focus-visible);语法高亮按 D-06 契约——propertyName=cyan、string=magenta、[number,bool,null]=yellow、[keyword,punctuation,operator]=text-muted,暗色取霓虹原语、亮色取 D-07 深霓虹 *-deep;色值全部 `import { tokens } from '../../../styles/tokens'` 字面 oklch(与 D-20 单测同源,RESEARCH A3 绕开 var() 不确定性);头注释逐字复制懒加载边界声明并补主题模块归属(T-02-09)
- `CodeMirrorJson.vue` 七个动作点全部落地:oneDark import 删除、`Compartment` 引入、useThemeMode 显式相对导入(`../../../composables/useThemeMode`)解构 resolved、`themeComp.of(createCmTheme(resolved.value === 'dark'))` 初始对齐、`watch(resolved) → themeComp.reconfigure` 不重建视图、onMounted/onBeforeUnmount 与模板一行未动、懒加载边界注释补「主题模块在 ./cm-theme.ts,仅本目录可 import」
- Task 2:`corepack pnpm remove @codemirror/theme-one-dark`(importers/packages/snapshots 三段同步清除,零其它变更);构建卡口复跑 `build && check:chunks` 退出码 0——入口页可达集零 CM、CM chunk 以 json-formatter slug 开头、预算通过,分包纪律不破
- 全量回归:type-check 退出码 0、172 测试(18 文件)全绿、vite-ssg 三页预渲染正常

## Task Commits

Each task was committed atomically:

1. **Task 1: cm-theme 双主题模块 + CodeMirrorJson Compartment 切换** - `37dfc13` (feat) — tracer 任务,提交后反馈门重跑 verify 端到端通过(⚡ Tracer verified end-to-end — expanding)
2. **Task 2: oneDark 死依赖移除 + 构建卡口复跑** - `3e48520` (chore)

**Plan metadata:** docs commit(见 git log `docs(02-05)`)

_Note: 本计划无 TDD 任务;两个任务(tracer + auto)均单 commit 完成。_

## Files Created/Modified

- `src/tools/json-formatter/components/cm-theme.ts` (created) — createCmTheme(dark) 双主题工厂(chrome + 语法高亮,tokens.ts 字面值,懒加载边界头注释)
- `src/tools/json-formatter/components/CodeMirrorJson.vue` (modified) — oneDark → Compartment 双主题接线(of 初始 + watch reconfigure)
- `package.json` (modified) — +3 条 CM 子包精确版本依赖(Rule 3 偏差,见下)、-1 条 oneDark
- `pnpm-lock.yaml` (modified) — 与 package.json 同步(+9 行 importers 段 / oneDark 三段清除)

## Decisions Made

- **CM 子包提升为直接依赖(Rule 3,唯一偏差)**:pnpm 默认隔离布局下 `node_modules/@codemirror/` 根仅含直接依赖(lang-json/lint/theme-one-dark),`@codemirror/state`/`@codemirror/language`/`@lezer/highlight` 是 `codemirror` 元包传递依赖,从项目根 `require.resolve` 全部 FAIL(实证),计划与 RESEARCH Pattern 4 骨架的 import 不可达。修复:三个子包按 **lockfile 既有解析版本**精确固定(`@codemirror/state@6.7.2`、`@codemirror/language@6.12.4`、`@lezer/highlight@1.2.3`,`pnpm add --save-exact`)——包本体已在 store 中,零新装零新下载,T-02-SC「零新装」与「禁止拉 too-new 版本」纪律完整保持;EditorView 沿用 `codemirror` 元包重导出(dist ESM 实证 `export { EditorView } from '@codemirror/view'` 同一实例),manifest 变更从 4 条收窄为 3 条。lockfile diff 复核:仅 importers 段 +9 行,packages/snapshots 段零漂移
- **createCmTheme 打包为单一扩展数组**:chrome 与语法高亮同进一个 Compartment,reconfigure 原子换主题——`EditorView.theme({dark})` 标志与 HighlightStyle 永远同步切换,不存在半更新状态窗口
- **chrome spec 变量收敛**:`const c = dark ? tokens.dark : tokens.light` 单别名承载七处色值引用,避免逐键三元(与 RESEARCH 骨架同构、diff 更小);pnpm add 后 git diff 逐一核对,确认无版本漂移

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] CM 子包在 pnpm 隔离布局下不可解析,计划 import 不可达**
- **Found during:** Task 1(实现前依赖可达性探针)
- **Issue:** 计划动作②要求 `import { Compartment } from '@codemirror/state'`、cm-theme.ts 要求 `@codemirror/language`/`@lezer/highlight` 导入;但这三包均为 `codemirror` 元包的传递依赖(不在 package.json 直接依赖中),pnpm 隔离 node_modules 下 `require.resolve` 全部失败;`codemirror` 元包仅重导出 EditorView/basicSetup/minimalSetup,无法替代。属计划的 RESEARCH「Standard Stack [VERIFIED: package.json:21-23,28]」误读(21-23 行实为 lang-json/lint/theme-one-dark)
- **Fix:** `corepack pnpm add --save-exact @codemirror/state@6.7.2 @codemirror/language@6.12.4 @lezer/highlight@1.2.3`(精确锁定 lockfile 既有版本,零下载);EditorView 改走 `codemirror` 元包(本文件既有惯例)
- **Files modified:** package.json, pnpm-lock.yaml(随 Task 1 提交)
- **Verification:** type-check 退出码 0 + 172 测试绿 + build/check:chunks 绿;lockfile diff 仅 importers +9 行零版本漂移
- **Committed in:** 37dfc13 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed(Rule 3)
**Impact on plan:** 依赖显式化为 lockfile 既有包的精确版本提升,零新装零新供应链面;交付物语义与验收标准完全一致,无范围蔓延。

## Issues Encountered

- 执行环境命令链输出偶发截断(type-check/vitest 退出码与后续 echo 被吞,02-01/02-02 已知怪癖),以落盘日志 + 分步重跑逐项确认,无实际影响
- `requirements.mark-complete STYL-01 SITE-04` 幂等无写入(两需求已由 plan 02-01/02-02 勾选),`write_set_complete: false` 为预期行为非故障

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- plan 02-06(存量迁移 I)不受本计划影响,照常执行;编辑器外全站页面已可用 `.dark` 类零改动翻转(02-01/02-02 产物)
- plan 02-07(存量迁移 II + 阶段终局门禁)注意:json-formatter 页迁移 Button/CopyableText 时 CodeMirrorJson.vue 的 Compartment 接线勿动;D-23 手动抽验清单新增「编辑器亮暗双主题瞬切 + 语法高亮深霓虹映射目测」(coverage D2 human_judgment 项)
- Phase 5 工具批量接入如需 CM,照 cm-theme 形态复制到各自工具目录(共享层零 CM 由 check-chunks 持续断言)
- 无阻塞项

## Known Stubs

None - 本计划交付物无 stub(主题工厂/接线/依赖清理全部完整实现,无占位数据/未接线逻辑)。

## Self-Check: PASSED

- FOUND: src/tools/json-formatter/components/cm-theme.ts / CodeMirrorJson.vue(2/2)
- FOUND: .planning/phases/02-design-system-a11y-baseline/02-05-SUMMARY.md
- FOUND: commit 37dfc13(Task 1)/ 3e48520(Task 2)(2/2)

---
*Phase: 02-design-system-a11y-baseline*
*Completed: 2026-09-08*
