---
phase: 01-app-skeleton-tool-registry
plan: 05
subsystem: timestamp-tool, test-infra, build-gate
tags: [tdd, dayjs, intl, timezone, tsconfig, eslint, vitest, jiti, registry, gap-closure, vue3]

# Dependency graph
requires:
  - phase: 01-02
    provides: timestamp-converter 工具目录（service/vue/13 条既有用例）、useCopy legacy 语义、错误卡 role=alert UI
  - phase: 01-04
    provides: scripts/check-chunks.mjs 分包卡口（断言 a-d 语义）、check:chunks 脚本接线
provides:
  - timestamp-converter.service 非法时区守卫（isValidTimeZone + fromTimestamp/toTimestamp ok:false 结构化错误分支）——V7「不裸抛」契约恢复，CR-01 白屏路径消除
  - detectUnit 单一 trim 变量形态（WR-01 闭合）——Phase 5/8 批量工具复用的公共 API 防线恢复
  - 组件级渲染期回归测试文件 timestamp-converter.component.test.ts（CR-01 自动化代理，防渲染期异常类回归）
  - 测试基建全量接线：全部 *.test.ts 纳入 tsconfig.vitest.json type-check（WR-02）+ vitest 可靠性 lint 规则（WR-03）
  - check-chunks 工具路由注册表派生（jiti 实载 src/tools/index.ts）——ARCH-01 构建脚本侧不变量恢复（WR-04）
affects: [Phase 5/8 批量工具复用（detectUnit/isValidTimeZone 公共防线 + check-chunks 零同步接入）, 阶段末 verify-work（CR-01 白屏回归走查收口）]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
actuals:
  tokens: 1650   # chars/4 over realized diff (~6600 chars, 6 files, ~165 insertions / ~10 deletions)
  tasks: 3
  commits: 5

# Tech tracking
tech-stack:
  added: []   # 零新增 npm 安装——jiti ^2.7.0 为既有 devDependency（供应链闸门未触发，T-01G-02 accept）
  patterns: [Intl.DateTimeFormat try/catch 时区合法性收敛, 服务层结构化错误宽接口（ok:false + 全 null 字段）, 测试文件就近 *.test.ts 双配置接线, 构建脚本经 jiti 消费 TS 注册表模块]

key-files:
  created:
    - src/tools/timestamp-converter/timestamp-converter.component.test.ts
  modified:
    - src/tools/timestamp-converter/timestamp-converter.service.ts
    - src/tools/timestamp-converter/timestamp-converter.service.test.ts
    - tsconfig.vitest.json
    - eslint.config.ts
    - scripts/check-chunks.mjs

key-decisions:
  - "isValidTimeZone 不导出且 Intl 调用仅在函数体内（Pitfall 3：vite-ssg 预渲染 Node 环境安全）；守卫校验顺序先单位后时区，非法时区绝不到达 dayjs.tz"
  - "错误文案仅内插 tz 参数本身（T-01G-04 mitigate：不做长度截断以保留可读性，复用 01-02 V7 限流口径），沿用既有全角标点文案风格"
  - "tsconfig.vitest.json 删除空 lib 覆盖恢复继承 DOM lib（与测试当前在 app project 下通过的 lib 完全一致）；tsconfig.app.json 零改动（WR-02 ground truth）"
  - "check-chunks 路由清单唯一来源 = 注册表模块（jiti 以脚本 URL 为基准加载）；断言 a-d 函数体/正则/退出码语义零改动，IN-05 明确排除不扩 scope"

requirements-completed: [TOOL-02, ARCH-01, ARCH-02]

coverage:
  - id: G1
    description: "CR-01 闭合：非法时区（UTC+8/Foo/Bar）正反向在 service 层收敛为 ok:false 结构化错误，渲染期 RangeError 白屏路径消除"
    requirement: TOOL-02
    verification:
      - kind: unit
        ref: "tests/src/tools/timestamp-converter/timestamp-converter.service.test.ts#非法时区结构化错误（CR-01）3 条"
        status: pass
      - kind: unit
        ref: "tests/src/tools/timestamp-converter/timestamp-converter.component.test.ts#手填非法时区渲染期回归 3 条（role=alert 错误卡而非崩溃）"
        status: pass
    human_judgment: false
  - id: G2
    description: "WR-01 闭合：detectUnit 空白输入识别正确（' 1735689600 '→'s'、'\\t1735689600000\\n'→'ms'），1000 倍错判防线恢复"
    requirement: TOOL-02
    verification:
      - kind: unit
        ref: "tests/src/tools/timestamp-converter/timestamp-converter.service.test.ts#带空白识别（WR-01）2 条"
        status: pass
    human_judgment: false
  - id: G3
    description: "WR-02 闭合：全部 *.test.ts（9 个）纳入 tsconfig.vitest.json 并通过 type-check；tsconfig.app.json 零改动"
    requirement: ARCH-01
    verification:
      - kind: integration
        ref: "command:tsc -p tsconfig.vitest.json --listFilesOnly | grep -c .test.ts = 9 === find src 实际数 9"
        status: pass
      - kind: integration
        ref: "command:corepack pnpm type-check → exit 0"
        status: pass
    human_judgment: false
  - id: G4
    description: "WR-03 闭合：vitest 可靠性规则对 *.test.ts 真实生效（oxlint 未覆盖项激活，重叠项维持 oxlint 委托，双段 lint 0 错）"
    requirement: ARCH-01
    verification:
      - kind: integration
        ref: "command:探针——同名 it('dup') 文件 eslint exit 1 且输出含 no-identical-title，探针删除后无残留"
        status: pass
      - kind: integration
        ref: "command:corepack pnpm lint → oxlint 0 + eslint 0"
        status: pass
    human_judgment: false
  - id: G5
    description: "WR-04 闭合：check-chunks 工具路由清单唯一来源为注册表模块（jiti 实载），硬编码消失，既有断言语义零回归"
    requirement: ARCH-02
    verification:
      - kind: integration
        ref: "command:corepack pnpm build && corepack pnpm check:chunks → OK: chunk budget pass (exit 0)"
        status: pass
      - kind: integration
        ref: "command:失败方向探针——移走 dist/timestamp-converter.html → exit 1 且 VIOLATION 提及该路由；恢复后 exit 0"
        status: pass
      - kind: integration
        ref: "command:node 一行脚本 jiti 派生输出 /timestamp-converter,/json-formatter 对齐"
        status: pass
    human_judgment: false
  - id: G6
    description: "浏览器端白屏回归走查：/timestamp-converter 正反向手填 UTC+8 与拼错地名 → 错误卡且页面其余可用、绝不白屏"
    verification: []
    human_judgment: true
    rationale: "Vue 渲染期异常导致的组件树卸载只有真实浏览器可见；组件测试已实证渲染期不抛异常（自动化代理），浏览器端人工走查登记于 01-VERIFICATION.md human_verification 第 2 项，阶段末 verify-work 收口（不新增 checkpoint）"

# Metrics
duration: 13 min
completed: 2026-09-07
status: complete
---

# Phase 1 Plan 05: 验证缺口闭合（CR-01/WR-01-04）Summary

**时间戳工具 service 层非法时区守卫（Intl 校验收敛为 ok:false 结构化错误，渲染期白屏路径消除）+ detectUnit trim 收窄 + 测试基建全量接线（9 个 *.test.ts 纳入 type-check 与 vitest lint）+ check-chunks 路由清单注册表派生（jiti 实载，ARCH-01 构建脚本侧不变量恢复）**

## Performance

- **Duration:** 13 min
- **Started:** 2026-09-07T06:39:01Z
- **Completed:** 2026-09-07T06:52:28Z
- **Tasks:** 3
- **Files modified:** 6（1 service + 2 测试 + 2 配置 + 1 构建脚本）

## Accomplishments

- CR-01 闭合：新增模块级私有 isValidTimeZone（Intl.DateTimeFormat try/catch，Intl 调用仅在函数体内），fromTimestamp/toTimestamp 在 dayjs 调用前插入 tz 守卫（先单位后时区），非法时区返回宽接口结构化错误（ok:false + error「未知时区：「${tz}」，请输入 IANA 时区名（如 Asia/Shanghai）。」+ 全 null 字段），绝不让非法 tz 到达 dayjs.tz——渲染期 RangeError 白屏路径消除
- WR-01 闭合：detectUnit 收窄为单一 trim 后变量 s（合法性正则与位数判定同源），' 1735689600 ' 恢复识别为 's'，全站公共 API 的 1000 倍错判防线恢复
- 测试盲区补齐：service 测试 13→18 用例（非法时区 ×3 + 带空白识别 ×2），新建组件级渲染期回归 3 条（手填 UTC+8/Foo/Bar → role=alert 错误卡而非崩溃 + 有效路径健全性），全部 TDD RED→GREEN 流程实证
- WR-02/WR-03 闭合：tsconfig.vitest.json include 扩为 src/**/*.test.ts + __tests__ 约定 + env.d.ts 并删除空 lib 覆盖（恢复继承 DOM lib）；eslint.config.ts vitest 规则块 files 两模式（重叠规则维持 oxlint 委托）；9/9 测试文件纳入 type-check，no-identical-title 探针实证拦截
- WR-04 闭合：check-chunks.mjs 的 TOOL_ROUTES 改由 jiti 加载 src/tools/index.ts 派生（tools[].path 去前导斜杠），硬编码数组删除，断言 a-d 语义零改动，失败方向探针实证派生清单真实驱动预渲染页存在性断言
- 计划级全量门 1-5 全绿：vitest 9 files / 86 tests passed（基线 78 + 新增 8，0 unhandled）/ type-check exit 0 / lint 双段 0 错 / build + check-chunks OK / 探针无残留

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: 非法时区 + 带空白识别失败测试** - `947011c` (test)
2. **Task 1 GREEN: isValidTimeZone 守卫 + detectUnit trim 修复** - `d2ece55` (feat)
3. **Task 1 组件回归: 渲染期错误卡测试（新文件）** - `2f624d5` (test)
4. **Task 2: 测试基建路径错位修复（WR-02/WR-03）** - `128e31e` (fix)
5. **Task 3: check-chunks 路由注册表派生（WR-04）** - `35daf25` (fix)

**Plan metadata:** 见最终 docs commit（SUMMARY + STATE + ROADMAP + REQUIREMENTS 同批）

## Files Created/Modified

- `src/tools/timestamp-converter/timestamp-converter.service.ts` - isValidTimeZone 私有函数 + fromTimestamp/toTimestamp 非法时区结构化错误分支 + detectUnit 单变量 trim
- `src/tools/timestamp-converter/timestamp-converter.service.test.ts` - 13→18 用例（非法时区 ×3 + 带空白 ×2，新 describe「非法时区结构化错误（CR-01）/带空白识别（WR-01）」）
- `src/tools/timestamp-converter/timestamp-converter.component.test.ts` - 新建：3 条渲染期回归（aria-label 属性选择器，不依赖 DOM 顺序）
- `tsconfig.vitest.json` - include 三模式 + 删除空 lib 覆盖 + 注释说明就近布局
- `eslint.config.ts` - vitest 块 files 两模式 + oxlint 委托关系注释
- `scripts/check-chunks.mjs` - TOOL_ROUTES ← jiti 注册表派生，头部注释修正，断言语义零改动

## Decisions Made

- **isValidTimeZone 保持私有且不导出**：服务层校验是 V7 契约位置（UI 只消费 ok:false），Intl 调用收敛在函数体内维持 Pitfall 3 预渲染纪律
- **错误文案仅内插 tz 参数本身**：不做长度截断以保留可读性（tz 为短自由文本），沿用既有全角标点风格；不回显时间戳原文于时区错误分支（T-01G-04）
- **tsconfig.vitest.json 删除空 lib 覆盖而非补 DOM lib**：include 扩大后测试文件落入 vitest project，恢复继承 @vue/tsconfig/tsconfig.dom.json（ESNext+DOM+DOM.Iterable）与测试当前在 app project 下通过的 lib 完全一致——type-check 一次通过零修复实证该选择
- **jiti 加载注册表为 check-chunks 清单来源**：采用 REVIEW 认可的「更严格做法」（构建步骤导出 JSON 的替代形态），彻底消除双源；注册表顶层 Node 安全纪律写入脚本注释（违纪 fail-fast）

## Deviations from Plan

None - plan executed exactly as written.

（注：执行中曾自查发现 tsconfig.vitest.json 注释文本含 `"lib": []` 字面量会误触发验收 grep，已在提交前改写注释措辞——该中间状态未提交，不计为偏差。）

## Issues Encountered

- 评审预测的 type-check 错误点位（ToolCard.test.ts / registry.test.ts）在 lib 恢复继承后未出现——与计划预判一致（「多数预测错误不会出现」），测试代码零类型修复需求
- 无其他阻塞；WR-03/WR-04 失败方向探针均一次通过

## TDD Gate Compliance

- RED：`947011c`（3 条 RangeError 失败形态 + 2 条断言失败形态，与计划预期完全一致）
- GREEN：`d2ece55`（18/18 service 用例全绿）
- 组件回归：`2f624d5`（3 条用例 + 全量 9 文件 86 tests 全绿）
- Gate sequence 完整：test → feat → test 三提交均存在

## Known Stubs

None - 全部实现为生产质量，无占位/硬编码空值/未接线数据源。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 验证报告 2 个结构化缺口（CR-01 BLOCKER、WR-01）与 3 个同域评审警告（WR-02/03/04）全部闭合；01-02 must_haves truth #4 恢复，TOOL-02 的 transparency 禁令与 V7 服务契约恢复
- 剩余人工走查（不新增 checkpoint）：CR-01 白屏回归走查已登记于 01-VERIFICATION.md human_verification 第 2 项，阶段末 verify-work 收口
- Phase 5/8 批量工具接入时：check-chunks 零同步（注册表派生）、detectUnit/isValidTimeZone 公共防线就位、测试文件就近布局的 type-check/lint 全量接线成为新工具默认保障

---
*Phase: 01-app-skeleton-tool-registry*
*Completed: 2026-09-07*

## Self-Check: PASSED

- 1 个 created 文件 + 5 个 modified 文件 + SUMMARY.md 全部存在（[ -f ] 逐项验证）
- 5 个任务提交（947011c / d2ece55 / 2f624d5 / 128e31e / 35daf25）均在 git log 中
- 计划级全量门复跑记录：vitest 9 files / 86 tests passed（0 unhandled）；type-check exit 0（vitest project 覆盖 9 = 实际 9）；lint exit 0（oxlint 0 + eslint 0）；build + check:chunks → OK: chunk budget pass；WR-03 探针（no-identical-title exit 1）与 WR-04 失败探针（VIOLATION exit 1 → 恢复 exit 0）均通过且无残留
