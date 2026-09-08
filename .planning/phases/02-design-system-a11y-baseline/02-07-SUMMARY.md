---
phase: 02-design-system-a11y-baseline
plan: 07
subsystem: ui
tags: [component-migration, tailwindcss, design-tokens, danger-semantic, copyable-text, button, card, json-tool, phase-gate, d15, d23]

# Dependency graph
requires:
  - phase: 02-design-system-a11y-baseline
    provides: plan 02-03 Button(outline/disabled/44px)与 Card(:padding=false 授权 p-3 形态)契约;plan 02-04 CopyableText(label prop 承载 aria 语义 + 默认展示区限高滚动 pre);plan 02-05 json-formatter 双主题基线(CM chunk 边界);plan 02-06 迁移三步模式与 py-1.5 deferred 迁移面(02-07 既定范围)
provides:
  - src/tools/json-formatter/json-formatter.vue 六件套真实消费样板(D-15 迁移收口:Button outline ×2 / CopyableText ×2 / Card ×2 / danger 错误卡),Phase 5「加目录+注册表一行」的复用参照
  - 错误卡消费 --color-danger 语义色(D-10 消费点闭环:校验失败属 UI-SPEC Destructive 语义)
  - 复制逻辑页面级组合(useCopy/lastCopiedKey/copyValue/isCopied)删除,复制能力收进 CopyableText(D-17 消费闭环)
  - 阶段终局门禁五项全绿记录(全量 172 测试/type-check/lint/build/check:chunks)+ D-23 人工验收载体与 preview 环境就绪
affects: [phase-4(分组 UI 消费六件套时参照本页样板), phase-5(批量工具「拿来即用」的迁移三步模式), verify-work(D-23 人工抽验与 SC-1..SC-5 闭环)]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
actuals:
  tokens: 2105    # 8422 chars / 4 over the realized diff (1 file, +29/-84 src diff)
  tasks: 2
  commits: 2      # Task 1 feat commit + plan docs commit;Task 2 自动门禁无代码产出

# Tech tracking
tech-stack:
  added: []       # 零新依赖(T-02-SC 纪律:零安装、零 package.json/pnpm-lock.yaml 变更;六件套与 preview 均为存量)
  patterns:
    - 迁移三步模式(02-06 定形)在工具操作区落地:换组件(Button/CopyableText/Card)→ 语义色归一(neon-magenta→danger)→ 交互件 44px 随组件内建
    - CopyableText 双消费形态:无插槽(默认展示区=限高滚动 pre,格式化文本卡)/ 默认插槽(展示区=树,复制 payload=minified 全文,树形卡)——复制与展示解耦但同源
    - 归一注释留痕:每处迁移点行内注释引用 D-XX 编号与 deferred-items 依据(py-1.5 随 Button 迁移归一)

key-files:
  created: []
  modified:
    - src/tools/json-formatter/json-formatter.vue

key-decisions:
  - "格式化文本卡采用 CopyableText 默认展示区(组件内建 max-h-72 pre,text-sm):计划明示『默认展示区即限高滚动 pre』,不复制页面原 pre 的 text-xs 定制——消费组件内建语言优先,避免调用方重写展示区样式"
  - "树形卡 CopyableText 默认插槽放 JsonTree:展示区=树、复制 payload=minified 全文(计划授权的解耦但同源形态),页面原『复制压缩』按钮文案由组件 aria-label『复制压缩结果』承接"
  - "requirements-completed 按模板复制 frontmatter [SITE-05],但 REQUIREMENTS.md 中 SITE-05 已由前置计划标记 Complete——不重复调用 requirements mark-complete(02-04 先例),避免勾选操作噪音"
  - "preview 验收环境按 checkpoint 协议先行启动(计划 Task 2 第二步授权 dev server 或 preview,未锁端口):4173 被遗留进程占用(404),改 4174 启动并探活 200——零风险端口避让,未触碰未知进程"

patterns-established:
  - "工具操作区迁移样板(Phase 5 直接复制):操作按钮 Button outline + :disabled 语义、输出区 CopyableText(text 或默认插槽两形态)、结果容器 Card :padding=false + p-3、错误态 --color-danger"
  - "human-check 环境先行:checkpoint 返回前 preview server 必须已启动并探活(curl 200),人工验收清单附 Local/Network URL 与逐项预期——执行器跑通自动化面,人工只做目测/触控判定"

requirements-completed: [SITE-05]  # 模板硬性要求复制 plan frontmatter requirements;REQUIREMENTS.md 已由前置计划(02-03)标记 Complete,本计划不重复标记

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "json-formatter 迁移收口(D-15 六件套消费闭环):格式化/压缩按钮换 Button(outline,:disabled=!hasResult,py-1.5 存量随迁归一 min-h-11);错误卡边框与行号文案消费 --color-danger(D-10,role=alert 与 line/column/message 结构保留);格式化文本卡/树形卡容器换 Card(:padding=false + p-3);两处复制按钮+展示区合并为 CopyableText(格式化文本=默认展示区;树形卡默认插槽 JsonTree+payload=minified);script 删 useCopy/lastCopiedKey/copyValue/isCopied,imports 显式 Button/CopyableText/Card(D-18);服务层与数据纪律零改动,文件头渲染纪律注释保留"
    requirement: SITE-05
    verification:
      - kind: unit
        ref: "全量 vitest 172 测试(18 文件)全绿——含 json-formatter.service 既有用例回归(服务层零改动实证)"
        status: pass
      - kind: other
        ref: "源码级 grep:六件套消费可见(Button×2/CopyableText×2/Card×2/--color-danger×2);useCopy|lastCopiedKey|isCopied|copyValue 零命中;py-1.5/neon-magenta 零实际残留(唯一命中为归一注释文字)"
        status: pass
    human_judgment: false
  - id: D2
    description: "阶段终局门禁五项全绿:corepack pnpm vitest run(172 passed/18 files)+ type-check(0)+ lint(Found 0 warnings and 0 errors)+ build(vite-ssg 3 页预渲染,json-formatter chunk 独立 35.15 kB)+ check:chunks(OK: chunk budget pass,零 VIOLATION——CM 仅在 json-formatter chunk、首包零 CM)"
    requirement: SITE-05
    verification:
      - kind: other
        ref: "命令链逐项退出码 0(落盘日志 /tmp/02-07-gate1..5-*.log);build 产物 dist/{index,timestamp-converter,json-formatter}.html 齐备"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-23 手动验收四项(ROADMAP SC-2/SC-3 与 02-VALIDATION Manual-Only 清单):①iOS 真机或设备模拟(375px)完整走 JSON 工具「输入→格式化→复制」——输入不缩放(16px)、按钮 44px 可准确点按、复制反馈可见且剪贴板正确;②OS 开启「减少动态效果」后 hover/过渡瞬时;③「跟随系统」态下 OS 深浅色切换页面立即联动;④corepack pnpm preview 暗色系统直开无白闪无跳变(D-05)"
    verification: []
    human_judgment: true
    rationale: "D-23 锁定路径:需真机/设备模拟的触控与聚焦行为、OS 级 prefers-reduced-motion/prefers-color-scheme 切换——happy-dom 无法模拟,计划明示不引入 E2E 设施;验收环境(preview server http://localhost:4174/ + Network URL)已就绪,清单见 SUMMARY『D-23 Manual Acceptance』节"

# Metrics
duration: 13min
completed: 2026-09-08
status: complete
---

# Phase 2 Plan 7: 设计系统与响应式/可访问性基线 — D-15 迁移收口(json-formatter)+ 阶段终局门禁 Summary

**json-formatter 工具页完成六件套迁移收口(Button outline ×2 / CopyableText ×2 / Card ×2 / 错误卡 danger 语义色),页面级复制组合删除(D-17 闭环),五项终局门禁全绿(172 测试 + type-check + lint + build + check:chunks),D-23 人工验收四项载体与 preview 环境就绪待作者抽验**

## Performance

- **Duration:** 13 min
- **Started:** 2026-09-08T08:57:03Z
- **Completed:** 2026-09-08T09:10:12Z
- **Tasks:** 2(Task 1 tracer 全程;Task 2 自动门禁完成、human-check 返回 checkpoint 待作者)
- **Files modified:** 1(+29/-84)

## Accomplishments

- **json-formatter 迁移(tracer)**:格式化/压缩两按钮换 `<Button variant="outline" :disabled="!hasResult">`——hover accent/disabled 语义组件内建,py-1.5 存量(02-06 deferred 既定迁移面)随迁归一为 min-h-11 44px(D-21);错误卡容器边框与行号文案 `--color-neon-magenta` → `--color-danger`(D-10/UI-SPEC Destructive 行:校验失败属 Destructive 语义),role="alert" 与 line/column/message 结构零改动
- **结果卡收口**:格式化文本卡/树形卡外层容器换 `<Card :padding="false" class="flex flex-col gap-2 p-3">`(02-06 deferred 授权形态);格式化文本卡复制按钮+pre 合并为 `<CopyableText :text="parsed.formatted" label="复制格式化文本">`(默认展示区即限高滚动 pre);树形卡换 `<CopyableText :text="parsed.minified" label="复制压缩结果">` 默认插槽放 JsonTree——展示区=树、复制 payload=minified 全文(复制与展示解耦但同源,原 aria-label 语义由 label 承接)
- **script 收口(D-17/D-18)**:删除 useCopy/lastCopiedKey/copyValue/isCopied 页面级组合(复制逻辑收进 CopyableText);imports 显式 import Button/CopyableText/Card(无 barrel);useCopy import 移除;服务层与数据纪律零改动,文件头渲染纪律注释(ARCH-04)保留
- **tracer 反馈门**:Task 1 提交后重跑 verify 端到端(172 测试 + type-check + lint)通过,⚡ Tracer verified end-to-end — expanding
- **阶段终局门禁五项全绿**:全量 172 测试(18 文件)0 failed、type-check 退出码 0、lint "Found 0 warnings and 0 errors"、vite-ssg build 3 页预渲染成功(json-formatter chunk 独立 35.15 kB/gzip 10.44 kB)、check:chunks "OK: chunk budget pass" 零 VIOLATION(CM 仅在 json-formatter chunk、首包零 CM)
- **D-23 人工验收环境就绪**:preview server 已启动并探活——http://localhost:4174/(200)与真机 Network URL,产物 HTML 含预渲染 `class="dark"`(D-05 预渲染默认暗色实证),四项人工清单见下节

## Task Commits

Each task was committed atomically:

1. **Task 1: json-formatter 迁移 — Button/CopyableText/Card + danger 错误卡** - `074e810` (feat) — tracer 任务,提交后反馈门重跑 verify 端到端通过(⚡ Tracer verified end-to-end — expanding)
2. **Task 2: 阶段终局门禁 + D-23 手动验收(human-check)** - 自动门禁部分全部执行通过(无代码产出,五项门禁记录见 Accomplishments);human-check 部分按计划设计返回 checkpoint 待作者逐项确认

**Plan metadata:** docs commit(见 git log `docs(02-07)`)

_Note: 本计划无 TDD 任务(MVP+TDD gate 未激活);Task 1 单 commit 完成,Task 2 自动部分无文件变更、人工部分为 checkpoint 停点(计划设计内流程)。_

## D-23 Manual Acceptance(human-check —— 待作者逐项确认)

> 计划 Task 2 第二步锁定路径:浏览器设备模拟(375px)或真机 iOS 均可;任一不符即描述问题并停止。
> **验收环境(已就绪):** preview 构建产物——本地 `http://localhost:4174/`;真机(同一 Wi-Fi)`http://172.20.10.7:4174/`。
> 状态:**待作者确认**(执行器自动化部分完成,四项人工抽验结果记录后本节即为验收记录)。

| # | 清单项(ROADMAP/VALIDATION 依据) | 操作 | 预期 |
|---|----------------------------------|------|------|
| 1 | iOS 真机或设备模拟(375px)完整走 JSON 工具「输入→格式化→复制」(SC-2;VALIDATION 手动第 1 项) | 设备模拟访问 /json-formatter,粘贴 JSON → 点格式化 → 复制格式化文本/复制压缩结果 | 输入框聚焦页面不自动放大(16px 生效);格式化/压缩/复制按钮可准确点按(44px 触控);「已复制」反馈可见且剪贴板内容正确 |
| 2 | OS 开启「减少动态效果」后刷新站点(SC-3;VALIDATION 手动第 2 项) | 系统设置开启 Reduce Motion → 刷新 → hover 按钮/观察卡片过渡 | hover/过渡为瞬时(无渐变动画,base.css reduced-motion 全局中和) |
| 3 | 「跟随系统」态下切换 OS 深浅色(VALIDATION 手动第 3 项;D-04) | ThemeToggle 置跟随系统 → 切换 OS 外观 | 页面主题立即联动变化(瞬切,无过渡动画) |
| 4 | preview 打开预渲染产物(暗色系统)直开(D-05 验收口径) | 访问 http://localhost:4174/(暗色系统下新开标签) | 无白闪、无主题跳变(产物含预渲染 class="dark") |

## Files Created/Modified

- `src/tools/json-formatter/json-formatter.vue` (modified) — 六件套迁移收口:Button ×2(格式化/压缩)、CopyableText ×2(格式化文本/树形卡)、Card ×2(:padding=false + p-3)、错误卡 danger 语义色;script 删页面级复制组合;注释留痕 D-15/D-10/D-17/D-21

## Decisions Made

- **格式化文本卡用 CopyableText 默认展示区**:计划明示「默认展示区即限高滚动 pre」,消费组件内建语言(text-sm),不复刻页面原 pre 的 text-xs/leading-5 定制——组件契约优先,调用方零重写(D-14)
- **树形卡解耦形态**:展示区=树(默认插槽 JsonTree)、复制 payload=minified 全文,同源于 parsed 一次解析结果(D-02 数据纪律不变);原「复制压缩」按钮可见文案由 aria-label「复制压缩结果」承接
- **requirements 不重复标记**:frontmatter requirements=[SITE-05] 按模板复制进 requirements-completed,但 REQUIREMENTS.md 中 SITE-05 已 Complete(前置计划 02-03 标记)——跳过 requirements mark-complete 调用(02-04 先例)
- **preview 端口避让**:4173 被遗留进程占用且返回 404,改 4174(strictPort)启动并 curl 探活 200;未触碰未知进程,验收环境按 checkpoint 协议先行就绪(Rule 3)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] preview 端口 4173 被遗留进程占用**
- **Found during:** Task 2(human-check 前置环境准备,checkpoint 协议要求验收环境就绪)
- **Issue:** 计划 Task 2 第二步人工验收授权「dev server 或 corepack pnpm preview」但未含 server 启动步骤;启动 preview 于默认端口 4173 报 "Port 4173 is already in use",占用进程对 / 返回 404(遗留会话进程,非本项目当前产物)
- **Fix:** 改端口 4174(--strictPort)启动 preview,curl 探活 200 + 产物含 class="dark" 验证;未触碰占用 4173 的未知进程(零风险避让)
- **Files modified:** 无(仅运行环境,无代码变更)
- **Verification:** GET http://localhost:4174/ → 200;GET /json-formatter → 200;产物 HTML 含 `class="dark"`
- **Committed in:** 不适用(无文件变更)

---

**Total deviations:** 1 auto-fixed(Rule 3 blocking,环境面零代码)
**Impact on plan:** 交付物语义与验收标准完全一致;preview 环境属计划授权验收环境(二选一)的实例化。无范围蔓延。

## Issues Encountered

- 执行器环境命令链输出偶发截断(vitest 汇总行/退出码 echo 被吞,02-01..02-06 已知怪癖),改用落盘日志(/tmp/02-07-*.log)+ 单独重跑逐项确认,无实际影响
- 4173 端口占用为历史遗留(非本项目当前产物),按零风险原则避让至 4174(见 Deviations)

## User Setup Required

None - no external service configuration required(preview server 已由执行器启动于 http://localhost:4174/,仅供本次人工验收使用)。

## Next Phase Readiness

- **Phase 2 七计划全部执行完毕**:令牌体系(02-01)→ 主题(02-02)→ 六件套(02-03/02-04)→ CM 双主题(02-05)→ 存量迁移两批(02-06/02-07)——D-15 迁移面全部收口,新旧组件零并存
- **ROADMAP SC-1..SC-5 证据状态**:SC-1(对比度,D-20 单测)/SC-4(令牌同步断言)自动化已绿;SC-2(iOS 流程)/SC-3(reduced-motion)/暗色直开无闪烁(D-05)待 D-23 四项人工抽验(本 SUMMARY 清单即验收载体)——human-check 结果回填后 Phase 2 可进入 verify-work/audit
- **Phase 5 批量工具消费面完备**:七工具「加目录+注册表一行」+ 六件套拿来即用;本页「Button outline + CopyableText 双形态 + Card p-3 + danger 错误态」为输出类工具直接复制的样板
- 无阻塞项;timestamp-converter 的 py-3 存量归 deferred-items.md(Phase 5 工具迁移面),不阻塞本阶段收口

## Known Stubs

None - 本计划交付物无 stub(单文件原地迁移,无占位数据/未接线逻辑;CopyableText 默认插槽形态为计划授权设计而非 stub)。

## Self-Check: PASSED

- FOUND: src/tools/json-formatter/json-formatter.vue(1/1 modified)
- FOUND: .planning/phases/02-design-system-a11y-baseline/02-07-SUMMARY.md
- FOUND: commit 074e810(Task 1)

---
*Phase: 02-design-system-a11y-baseline*
*Completed: 2026-09-08*
