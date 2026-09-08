---
phase: 02-design-system-a11y-baseline
plan: 04
subsystem: ui
tags: [vue-sfc, tailwindcss, clipboard, aria, wai-aria-tabs, roving-tabindex, keyboard-navigation, vitest, component-library]

# Dependency graph
requires:
  - phase: 02-design-system-a11y-baseline
    provides: plan 02-01 语义令牌与全局基线(var(--color-*)/--color-focus/:focus-visible 焦点环);plan 02-03 六件套前三件形态与测试纪律(Button/Input/Card:defineOptions 自命名/头注释决策引用/全 Tailwind 无 style 块/mount helper + 源码级断言);src/composables/useCopy.ts 能力层(Phase 1,D-17 封装对象)
provides:
  - src/ui/CopyableText.vue 复制展示组件(内部消费 useCopy 零重写 + Copy/Check 图标按钮 + 成功/失败/空内容三态反馈 + aria-live 常驻反馈区 + 默认插槽限高滚动展示区)
  - src/ui/Tabs.vue WAI-ARIA 标签页(role 三件套 + roving tabindex + ArrowLeft/Right 循环 + Home/End + 自动激活聚焦 scrollIntoView + hidden 面板 + 受控 v-model 契约)
  - 17 条组件测试锁定六件套后两件 API 契约(plan 02-07 复制按钮迁移与 Phase 4/5 分组 UI 的向后兼容面,D-14)
affects: [02-05(cm-theme,无直接依赖), 02-07(json-formatter 两处复制按钮直接替换为 CopyableText), phase-4/5(分组 UI 消费 Tabs;输出类工具消费 CopyableText,D-14), verify-work(D-23 手动抽验)]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
actuals:
  tokens: 5719    # 22875 chars / 4 over the realized diff (4 files, 全部新建 +508 行)
  tasks: 2
  commits: 3

# Tech tracking
tech-stack:
  added: []       # 零新依赖(T-02-SC 纪律:零安装、未动 pnpm-lock.yaml;图标 Copy/Check 来自已过闸的 @lucide/vue)
  patterns:
    - 六件套 SFC 形态延续:template 前 script 后 + defineOptions 自命名 + 头注释决策引用 + 无 style 块全 Tailwind
    - 组件测试纪律延续:mount helper + 工厂 + 源码级 class/attribute 断言(Pitfall 5)+ 剪贴板注入模式(useCopy.test.ts 成套复用)+ fake timers 成对
    - focus 类行为断言纪律(本计划新增):@vue/test-utils 默认挂载游离 DOM 树,focus 断言必须 attachTo: document.body + 用例内 unmount 清理
    - aria-live 反馈区纪律:节点常驻 DOM(sr-only),公告要求节点先于内容存在;成功/失败切换可见类

key-files:
  created:
    - src/ui/CopyableText.vue
    - src/ui/CopyableText.test.ts
    - src/ui/Tabs.vue
    - src/ui/Tabs.test.ts
  modified: []

key-decisions:
  - "VueUse 14.4.0 useClipboard(legacy:true) 真实失败语义实证:copy() 内部吞掉 clipboard.write 失败并转 execCommand 降级,唯一真实 reject 路径 = 降级 document.execCommand 本身抛错 —— CopyableText failed 态按此语义落地,失败测试构造该真实路径而非 mock composable(护住 D-17 封装断言)"
  - "@vue/test-utils 挂载游离树环境怪癖:mount() 默认不连接 document,happy-dom focus() 对未连接元素提前返回(isConnected 检查)——Tabs 键盘导航聚焦断言改 attachTo: document.body(探针实证:纯 happy-dom focus 正常、函数 ref 注册正常,唯挂载方式所致)"
  - "Tabs 采用受控 v-model 契约(activeId = props.modelValue ?? 首个 tab,与 Input/CodeMirrorJson 同构):点击/键盘只 emit update:modelValue,交互态经父组件回写驱动;aria-selected/tabIndex/hidden 三件套由 selectTab() 单点驱动防状态漂移(D-19)"
  - "CopyableText 反馈单源:failed 优先于 copied(失败点击可能落在前次成功 1500ms 窗口内,最近一次操作为准);每次点击尝试前复位 failed,防成功/失败反馈叠加"
  - "空内容禁用态补 disabled:cursor-not-allowed disabled:opacity-40(计划类清单未列,对齐 Button.vue/join-formatter disabled 语义惯例,使四态中的空内容态可见可辨)"
  - "成功反馈文案色 cyan(PATTERNS 授权:『成功态样式沿用 border/text-neon-cyan 语言』),失败文案消费 var(--color-danger)(D-10);图标 size-4(16px)与 text-sm 按钮协调"

patterns-established:
  - "组件测试 focus 断言模板:attachTo: document.body 挂载 + try/finally wrapper.unmount() 清理;游离树断言属性/类即可,连接态行为(focus/scrollIntoView 实效)必须 attachTo(Pitfall 5 家族新增成员,后续组件测试直接套用)"
  - "useClipboard 14.4.0 失败路径测试模板:patchNavigator clipboard(write.reject)+ permissions granted + document.execCommand 抛错 = 双层降级仍失败的唯一真实构造;复用于任何含失败反馈的复制类组件"
  - "aria-live 反馈区形态:span 常驻 sr-only + 计算类切换可见(成功 cyan/失败 danger),文本与状态单源 computed"

requirements-completed: []  # 计划 frontmatter requirements=[SITE-05],ready-ids 闸门返回 blocked(多计划共享依赖未全落),REQUIREMENTS.md 中 SITE-05 已由前置计划标记 Complete,本计划不重复标记

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "CopyableText 三态反馈契约:空内容 → 按钮禁用 + aria-label「暂无内容可复制」(UI-SPEC empty 行);成功 → 按钮 cyan 态 + 反馈「已复制」且随 copiedDuring 1500ms 复原(loading 行:同步快捷操作无 loading 态);失败 → 「复制失败,请手动复制」danger 色(UI-SPEC error 行);常态反馈 span sr-only 常驻 aria-live=polite;文案四行与 UI-SPEC Copywriting Contract 逐字一致(grep 对照)"
    requirement: SITE-05
    verification:
      - kind: unit
        ref: "src/ui/CopyableText.test.ts#8 用例(空内容/aria-label 定制/成功 1500ms 复原/失败/aria-live 常驻/44px)"
        status: pass
      - kind: other
        ref: "源码级 grep 对照:复制内容/已复制/复制失败,请手动复制/暂无内容可复制 四行逐字命中 CopyableText.vue:26,47,79,80"
        status: pass
    human_judgment: false
  - id: D2
    description: "CopyableText 展示区安全与 backstop:默认插槽 + max-h-72 限高滚动 fallback、复制 payload 恒为 props.text 全文(复制不截断于可见区,UI-SPEC long-text backstop 行);纯插值渲染零 v-html——含 <script>/onerror 属性的文本不产生对应节点(T-02-06 mitigate,RESEARCH §Security V5);内部消费 useCopy() 零剪贴板 API 直调(D-17,失败测试走真实 useCopy 拒绝路径)"
    requirement: SITE-05
    verification:
      - kind: unit
        ref: "src/ui/CopyableText.test.ts#backstop 1000+ 字全文复制 + 插值转义用例(断言 write payload 等于全文/script/img 节点不存在)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Tabs WAI-ARIA 完整键盘模式:role tablist/tab/tabpanel 三件套 + tablist 命名(ariaLabel 默认「标签页」);roving tabindex 仅活动 tab=0;ArrowLeft/Right 循环 + Home/End 跳两端;自动激活(聚焦即选中,焦点移至新 tab 经 attachTo 实测);非激活面板 hidden 属性节点常驻(禁 opacity/移出屏幕,RESEARCH Anti-Patterns);aria-selected/tabIndex/hidden 由 selectTab 单点驱动(D-19)"
    requirement: SITE-05
    verification:
      - kind: unit
        ref: "src/ui/Tabs.test.ts#9 用例(roving/aria 关联/点击 emit+hidden 翻转/ArrowRight 循环+聚焦/Home-End/单 tab 一致性/hidden 属性/44px)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Tabs 布局与视觉契约:tablist 容器 overflow-x-auto 水平滚动不换行(tab whitespace-nowrap)+ 键盘导航 scrollIntoView({block/inline:'nearest'})(UI-SPEC overflow 行);单 tab 照常渲染 aria 语义一致(zero-one-many 行);活动态指示消费 var(--color-neon-cyan)(UI-SPEC accent 保留清单);44px 触控 min-h-11(D-21);受控 v-model 契约与 Input 同构(D-14)"
    requirement: SITE-05
    verification:
      - kind: unit
        ref: "src/ui/Tabs.test.ts#overflow/whitespace-nowrap/accent 类 + 单 tab + 44px 用例;scrollIntoView 经源码级守卫与键盘用例路径覆盖"
        status: pass
    human_judgment: false

# Metrics
duration: 30min
completed: 2026-09-08
status: complete
---

# Phase 2 Plan 4: 设计系统与响应式/可访问性基线 — 六件套第二组垂直切片(CopyableText/Tabs) Summary

**CopyableText(内部消费 useCopy 零重写 + 成功/失败/空内容三态反馈 + 限高滚动全文复制)与 Tabs(WAI-ARIA roving tabindex + 方向键循环 + hidden 面板)全 Tailwind SFC 落地,17 条组件测试锁定契约,全量 172 测试绿、type-check/lint 退出码 0、零新依赖;文案四行与 UI-SPEC Copywriting Contract 逐字一致**

## Performance

- **Duration:** 30 min
- **Started:** 2026-09-08T07:42:15Z
- **Completed:** 2026-09-08T08:11:53Z
- **Tasks:** 2
- **Files modified:** 4 (全部新建)

## Accomplishments

- 新建 `CopyableText.vue`:内部消费 `useCopy()`(D-17 复制逻辑零重写,copy/copied/copiedDuring 1500ms 全部来自能力层);结构三件——①展示区(默认插槽 + max-h-72 overflow-auto 限高滚动 fallback,复制恒传 props.text 全文)、②图标复制按钮(@lucide/vue Copy/Check,44px min-h-11,copied 时切 cyan 成功态)、③aria-live="polite" 常驻反馈 span(常态 sr-only,成功「已复制」cyan/失败「复制失败,请手动复制」danger);空内容按钮禁用 + aria-label「暂无内容可复制」;纯插值渲染零 v-html(T-02-06 mitigate);8 条测试含 1000+ 字全文复制 backstop 与插值转义用例
- 新建 `Tabs.vue`:WAI-ARIA tabs pattern 完整落地——role 三件套(tablist/tab/tabpanel)+ tablist 命名(ariaLabel 默认「标签页」)、roving tabindex(仅活动 tab=0)、ArrowLeft/Right 循环 + Home/End 跳两端、自动激活模式(聚焦即选中 + scrollIntoView({block/inline:'nearest'}))、非激活面板 hidden 属性节点常驻(禁 opacity/移出屏幕);活动态指示消费 var(--color-neon-cyan)(UI-SPEC accent);受控 v-model 契约(activeId = modelValue ?? 首个 tab,与 Input 同构),aria-selected/tabIndex/hidden 三件套由 selectTab() 单点驱动(D-19 防状态漂移);9 条测试
- tracer 反馈门:Task 1 提交后重跑 verify 端到端(8/8 + type-check)通过,⚡ Tracer verified end-to-end — expanding
- 全量回归:172 测试(155 既有 + 17 新增)全绿、type-check/lint 退出码 0;零新依赖(pnpm-lock.yaml 未动,T-02-SC)

## Task Commits

Each task was committed atomically:

1. **Task 1: CopyableText — useCopy 展示层封装 + 成功/失败/空内容三态反馈** - `22b5ad2` (feat) — tracer 任务,提交后反馈门重跑 verify 端到端通过(⚡ Tracer verified end-to-end — expanding)
2. **Task 2: Tabs — WAI-ARIA roving tabindex + 方向键导航 + hidden 面板** - `d611072` (feat)

**插入提交:** `2a11914` (fix) — lint 卡口修复:oxlint vitest/require-mock-type-parameters 要求 vi.fn 显式类型参数(execCommand 失败 mock 补 `vi.fn<() => boolean>`,对齐 useCopy.test.ts 形态)。由计划整体 `<verification>` 的 `pnpm lint 退出码 0` 要求触发。

**Plan metadata:** docs commit(见 git log `docs(02-04)`)

_Note: 本计划无 TDD 任务;两个任务(tracer + auto)均单 commit 完成,另加 1 条 lint fix 插入提交。_

## Files Created/Modified

- `src/ui/CopyableText.vue` (created) — 复制展示组件(useCopy 封装 + 三态反馈 + 限高滚动展示区 + aria-live 反馈区)
- `src/ui/CopyableText.test.ts` (created) — 8 用例:空内容/aria-label/成功复原/失败/全文 backstop/aria-live 常驻/插值转义/44px
- `src/ui/Tabs.vue` (created) — WAI-ARIA 标签页(roving tabindex/方向键/Home-End/自动激活/hidden 面板/v-model 契约)
- `src/ui/Tabs.test.ts` (created) — 9 用例:roving/aria 关联/点击 emit/循环键/Home-End/单 tab/overflow/hidden 属性/44px

## Decisions Made

- **VueUse 14.4.0 useClipboard 失败语义(计划假设修正)**:计划写「useClipboard legacy:true 双层降级仍失败时进入失败态」,读 dist 源码实证——`copy()` 内部 catch 掉 `clipboard.write` 失败并静默转 `legacyCopy`(execCommand 返回值也不检查),**唯一真实 reject 路径是降级 `document.execCommand` 本身抛错**。实现保留 try/catch + failed 终态(该路径真实存在,如极旧浏览器/异构环境),失败测试构造该真实路径(write.mockRejectedValue + execCommand 抛错)而非 mock composable——既守住 UI-SPEC error 行契约,又守住 D-17「内部真实消费 useCopy」的封装断言(Phase 1 useCopy.test.ts 语义修正先例的同类处理)
- **Tabs 受控 v-model 契约**:按计划公式 `activeId = props.modelValue ?? props.tabs[0]?.id` 纯受控落地,与 Input/CodeMirrorJson 同构(库内 v-model 惯例);测试经 emitted + setProps 模拟父组件回写断言 hidden 翻转
- **Tabs 单根包裹 div**:计划结构①tablist②panels 未指定根形态,实现为单根包裹——避免多根组件的 attrs 透传告警(D-14 调用方零心智负担),无需 Input 的 inheritAttrs:false 复杂度
- **反馈优先级 failed > copied**:失败点击可能落在前次成功 1500ms 窗口内,以最近一次操作为准;每次点击尝试前复位 failed,防两种反馈叠加
- **空内容禁用态视觉语义**:计划类清单未列 disabled 样式,补 `disabled:cursor-not-allowed disabled:opacity-40`(对齐 Button.vue 02-03 既有 disabled 语义惯例),使四态中的空内容态可见可辨
- **focus 断言环境适配**:键盘导航「聚焦新 tab」用例经三步探针定位(纯 happy-dom focus 正常 → 函数 ref 注册正常 → @vue/test-utils 默认游离挂载致 isConnected=false)后改 `attachTo: document.body` + 用例内 `wrapper.unmount()` 清理

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] happy-dom + @vue/test-utils 游离挂载下 focus() 失效**
- **Found during:** Task 2(Tabs.test.ts ArrowRight 用例首次运行,`document.activeElement?.id` 断言失败:expected '' to be 'tab-a')
- **Issue:** @vue/test-utils `mount()` 默认把组件渲染进**游离 DOM 树**(未连接 document);happy-dom 的 `HTMLElementUtility.focus()` 对未连接元素(isConnected=false)提前返回,activeElement 恒为 body。探针实证:纯 happy-dom 手动 appendChild 后 focus 正常、组件函数 ref 注册正常(Map 已填充)、唯挂载方式所致——组件代码本身在真实浏览器行为正确
- **Fix:** 键盘导航用例改 `attachTo: document.body` 挂载(组件 DOM 连接后 focus 生效),try/finally 中 `wrapper.unmount()` 清理挂载点;其余游离树断言(属性/类)不受影响不改。修复记录进测试头注释(Pitfall 5 家族),形成可复用模式
- **Files modified:** src/ui/Tabs.test.ts(mountTabs 第三参 attachTo 选项 + ArrowRight 用例)
- **Verification:** Tabs 9/9 全绿(含 focus 断言)、全量 172 测试回归绿
- **Committed in:** d611072(Task 2 commit)

**2. [Rule 3 - Blocking] oxlint vitest/require-mock-type-parameters 卡口**
- **Found during:** 计划整体 `<verification>`(首次 `pnpm lint`,退出码 1)
- **Issue:** CopyableText.test.ts 中 execCommand 失败 mock 写作 `vi.fn(() => {...})`,oxlint 的 vitest/require-mock-type-parameters(correctness 档)要求 vi.fn 显式类型参数
- **Fix:** 补类型参数 `vi.fn<() => boolean>(() => {...})`,对齐 useCopy.test.ts 既有 `vi.fn<() => boolean>` 形态
- **Files modified:** src/ui/CopyableText.test.ts
- **Verification:** lint 退出码 0、CopyableText 8/8 重跑绿
- **Committed in:** 2a11914(独立 fix 提交,02-01 `4e9ae55`/02-03 `7093ee7` 先例)

---

**Total deviations:** 2 auto-fixed(2 Rule 3 blocking)
**Impact on plan:** 两处均为测试环境适配/工具链层面修正,交付物语义与验收标准完全一致;组件实现零返工。无范围蔓延。

## Issues Encountered

- VueUse 14.4.0 useClipboard 的 copy() 恒吞内部失败(legacy:true),计划「双层降级仍失败」假设与库实现有出入——按真实 reject 路径收窄失败态触发条件并在头注释留痕(详见 Decisions Made);UI-SPEC error 行契约不变
- 执行器环境命令链输出偶发截断(type-check/lint 退出码 echo 被吞,02-01/02-03 已知怪癖),改用落盘日志逐项确认,无实际影响

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- plan 02-07(json-formatter 迁移)消费面就绪:两处复制按钮(格式化文本/压缩结果)可直接替换为 `<CopyableText :text="..." label="复制格式化文本/复制压缩结果">`,复制反馈逻辑(lastCopiedKey 驱动)随之内聚进组件
- plan 02-06(存量页面迁移)与 Phase 4/5 分组 UI:Tabs 受控 v-model 契约 + 动态插槽名(tab.id)可直接消费;CopyableText 供输出类工具拿来即用(D-14 六件套契约实体已齐五件,余 ThemeToggle 归 02-02 已交付)
- 组件测试 focus 断言模板(attachTo + unmount 清理)与 useClipboard 失败路径构造模板沉淀,后续组件/复制类测试直接复制
- 无阻塞项;D-23 手动抽验(真机:44px 触控/复制反馈可达/Tabs 键盘走查)按计划留 phase verify-work 与 JSON 工具全流程一并走查

## Known Stubs

None - 本计划交付物无 stub(两组件全部完整实现,无占位数据/未接线逻辑)。

## Self-Check: PASSED

- FOUND: src/ui/CopyableText.vue / CopyableText.test.ts / Tabs.vue / Tabs.test.ts(4/4 created)
- FOUND: .planning/phases/02-design-system-a11y-baseline/02-04-SUMMARY.md
- FOUND: commit 22b5ad2(Task 1)/ d611072(Task 2)/ 2a11914(lint fix)(3/3)

---
*Phase: 02-design-system-a11y-baseline*
*Completed: 2026-09-08*
