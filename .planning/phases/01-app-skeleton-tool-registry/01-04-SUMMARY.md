---
phase: 01-app-skeleton-tool-registry
plan: 04
subsystem: tooling
tags: [codemirror, json, tokenizer, code-splitting, vite-ssg, bundle-gate, vue3]

# Dependency graph
requires:
  - phase: 01-01
    provides: 注册表契约 defineTool/ToolMeta、双 layout、路由派生、vite-ssg build 管线
  - phase: 01-02
    provides: useCopy composable、『加目录 + 注册表一行』工具接入样板、@lucide/vue 图标方案
  - phase: 01-03
    provides: XSS 消毒渲染管线（vnode 优先 + SafeHtml 唯一出口 + ESLint no-v-html 卡口）
provides:
  - json-formatter 工具目录：formatJson/minifyJson/validateJson/buildTree 纯文本 tokenizer（2^53 数字逐字保留、键序保持、行列错误定位、BOM 容错）
  - CodeMirror 6 输入区封装 CodeMirrorJson.vue（onMounted 创建 / onBeforeUnmount 销毁 / watch 单向同步，Phase 5 正则测试器可复用）
  - 自研递归可折叠树 JsonTree.vue（raw 字符串数字节点、默认展开深度 2、数组计数徽标、2^53 精度提示）
  - 双栏工具页 json-formatter.vue（编辑器 | 格式化文本+树 共享同一份解析结果）
  - scripts/check-chunks.mjs 分包卡口 + package.json check:chunks 脚本（ARCH-02 Phase 1 轻量形态闭环）
affects: [Phase 3 ARCH-05 体积预算卡口（本卡口为其前置形态）, Phase 5 正则测试器（CodeMirror 封装复用）, Phase 5/8 批量工具样板]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
actuals:
  tokens: 13378   # chars/4 over realized diff (53510 chars, 9 files, 1243 insertions)
  tasks: 3
  commits: 4

# Tech tracking
tech-stack:
  added: [codemirror@6, @codemirror/lang-json, @codemirror/lint, @codemirror/theme-one-dark]
  patterns: [chunk 可达性 BFS 断言（html 直接引用 + import 链闭包）, 纯文本 tokenizer 四导出形态（后续工具 service analog）, 工具 chunk 内封装编辑器]

key-files:
  created:
    - src/tools/json-formatter/json-formatter.service.ts
    - src/tools/json-formatter/json-formatter.service.test.ts
    - src/tools/json-formatter/json-formatter.vue
    - src/tools/json-formatter/components/CodeMirrorJson.vue
    - src/tools/json-formatter/components/JsonTree.vue
    - src/tools/json-formatter/index.ts
    - scripts/check-chunks.mjs
  modified:
    - src/tools/index.ts
    - package.json

key-decisions:
  - "check-chunks 首包定义 = 入口页 dist/index.html 的 chunk 可达闭包（BFS 含 import{...}from/export-from/dynamic import 链）——vite-ssg 平铺产物下工具页 modulepreload 自己的工具 chunk 属期望懒加载行为，不属共享首屏"
  - "CM 泄漏断言按页分组：入口页可达集零 CM；工具页可达集的 CM chunk 文件名必须以该工具 slug 开头（堵住经 useCopy 类共享异步 chunk 中转的泄漏路径）"
  - "fail-first 验证采用产物层注入模拟（app chunk / useCopy chunk 注入 codemirror 字样）——src 层探针（副作用 import / void 绑定）因 CM 库 tree-shakeable 被消除，无法制造真实泄漏"

patterns-established:
  - "构建产物卡口模式：零第三方依赖 Node ESM 脚本 + package.json check:* 脚本接线 + fail-first 注入验证"
  - "CodeMirror 6 Vue 封装形态：onMounted 创建/onBeforeUnmount 销毁/watch 单向同步，仅工具 chunk 静态引用"
  - "树视图数据源纪律：数字节点一律 raw 字符串（永经 JS number 中转）"

requirements-completed: [TOOL-01, ARCH-02]

coverage:
  - id: D1
    description: "JSON tokenizer 服务四导出（formatJson/minifyJson/validateJson/buildTree）：2^53 长数字 ID 原文保留、往返无损、键序与重复键保持、错误行列定位、BOM 容错"
    requirement: TOOL-01
    verification:
      - kind: unit
        ref: "tests/src/tools/json-formatter/json-formatter.service.test.ts#六组保真/往返/定位用例"
        status: pass
    human_judgment: false
  - id: D2
    description: "CodeMirror 6 输入区 + 递归树 + 双栏视图 + 注册表接入（第二个工具零手写路由）"
    requirement: TOOL-01
    verification:
      - kind: unit
        ref: "tests/src/tools/registry.test.ts + src/router/routes.test.ts（含 json-formatter 注册项）"
        status: pass
      - kind: integration
        ref: "command:corepack pnpm type-check && corepack pnpm vitest run（8 files / 78 tests）"
        status: pass
    human_judgment: false
  - id: D3
    description: "双栏 UI 视觉与交互充分性（树折叠手感、计数徽标/精度提示观感、错误卡布局、复制按钮反馈）"
    verification: []
    human_judgment: true
    rationale: "组件结构与数据流已由类型检查与测试覆盖，但视觉/交互充分性无自动化断言——留待 /gsd-verify-work 浏览器走查"
  - id: D4
    description: "check-chunks 分包卡口（ARCH-02 Phase 1 轻量形态）：首包零 CM、工具独立 chunk、预渲染页存在，且经 fail-first 注入验证非恒真断言"
    requirement: ARCH-02
    verification:
      - kind: integration
        ref: "command:corepack pnpm build && node scripts/check-chunks.mjs → OK: chunk budget pass (exit 0)"
        status: pass
      - kind: integration
        ref: "command:CM 注入 app chunk → 3 VIOLATION exit 1；CM 注入 useCopy chunk（import 链中转）→ VIOLATION exit 1；json-formatter 自身 CM chunk 无误报"
        status: pass
    human_judgment: false

# Metrics
duration: 14 min
completed: 2026-09-07
status: complete
---

# Phase 1 Plan 04: JSON 格式化工具 + 分包预算卡口 Summary

**纯文本 tokenizer 驱动的 JSON 工具（2^53 长数字 ID 零精度丢失，CodeMirror 6 随工具 chunk 懒加载）+ check-chunks 可执行分包卡口（首包 CM 泄漏断言含 import 链可达性分析）**

## Performance

- **Duration:** 14 min（续作段：Task 3 + 计划级验证 + SUMMARY；Task 1-2b 由中断前任执行者完成）
- **Started:** 2026-09-07T09:39:52Z
- **Completed:** 2026-09-07T09:54:04Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- TOOL-01 完整交付：formatJson/minifyJson/validateJson/buildTree 四导出 tokenizer——2^53 长数字 ID（9052710354240385291）在格式化输出与树视图逐字保留，往返无损、键序与重复键保持原文、错误行列定位、首字符 BOM 忽略；78 个测试全绿（含 01-01/01-02/01-03 回归）
- D-01/D-02 落地：CodeMirror 6 输入区（行号/语法高亮/jsonParseLinter 错误定位）+ 自研递归可折叠树（默认展开深度 2、Array(n) 计数徽标、≥2^53 精度提示）+ 双栏共享同一份解析结果 + useCopy 一键复制；注册表第二个工具零手写路由接入
- ARCH-02 Phase 1 轻量形态闭环：scripts/check-chunks.mjs 零依赖卡口——首包（入口页 chunk 可达闭包，BFS 追踪 `import{...}from` 静态链与动态 import）零 codemirror 字样、工具页可达集的 CM chunk 必须以本工具 slug 命名、含 CM 的懒加载 chunk 真实存在（防 tree-shake 空断言）、双工具预渲染页存在；经产物层 fail-first 注入验证拦截有效
- 计划级 verification 全绿：vitest run（78 passed）/ type-check / lint（渲染出口卡口）/ vite-ssg build + check-chunks gate（OK: chunk budget pass）

## Task Commits

Each task was committed atomically:

1. **Task 1: JSON tokenizer 服务切片（RED）** - `d136659` (test)
2. **Task 1: JSON tokenizer 服务实现（GREEN）** - `61e0a37` (feat)
3. **Task 2: 双栏视图 + CodeMirror 输入区 + 递归树 + 注册表接入** - `0ea47d2` (feat)
4. **Task 3: 分包预算卡口 scripts/check-chunks.mjs + build gate** - `9632a69` (feat)

**Plan metadata:** 见最终 docs commit（SUMMARY + STATE + ROADMAP + REQUIREMENTS 同批）

## Files Created/Modified

- `src/tools/json-formatter/json-formatter.service.ts` - 纯文本 tokenizer 四导出（数字 raw 字符串永经 number 中转）
- `src/tools/json-formatter/json-formatter.service.test.ts` - 六组用例（2^53 保真/往返/键序/压缩/定位/BOM）
- `src/tools/json-formatter/components/CodeMirrorJson.vue` - CM6 封装（onMounted/watch/onBeforeUnmount 纪律）
- `src/tools/json-formatter/components/JsonTree.vue` - 递归可折叠树（深度 2/计数徽标/精度提示，全 vnode 渲染）
- `src/tools/json-formatter/json-formatter.vue` - 双栏视图（一份解析喂两个视图 + 错误卡 + useCopy）
- `src/tools/json-formatter/index.ts` - defineTool 注册（path: /json-formatter, icon: Braces, 懒加载组件）
- `src/tools/index.ts` - 注册表汇入 jsonFormatter
- `scripts/check-chunks.mjs` - 分包卡口（chunk 可达性 BFS + 首包 CM 断言 + slug 匹配 + 预渲染页存在性）
- `package.json` - 新增 4 个 CodeMirror 依赖 + `check:chunks` 脚本

## Decisions Made

- **首包定义修正为入口页可达闭包**：vite-ssg 平铺产物下每个工具页会 modulepreload 自己的工具 chunk（用户直达工具页时按需加载，符合 ARCH-02 意图），"所有预渲染页引用并集 = 首包"的定义在该产物形态下失效；"首屏 bundle"忠实定义为入口页（/ 路由）引用的 chunk 闭包
- **CM 断言按页分组 + slug 匹配**：入口页可达集零 CM（共享层红线）；工具页可达集的 CM chunk 文件名必须以工具 slug 开头（json-formatter 自身 CM chunk 白名单，防工具间混流误报）
- **fail-first 采用产物层注入**：src 层探针两种写法（副作用 `import 'codemirror'`、`void EditorView` 绑定）均被 rollup tree-shake 消除（CM 库无副作用声明），无法制造真实泄漏；产物层注入（app chunk / useCopy chunk 追加 codemirror 字样）确定性等价模拟真实打包结果，验证后重 build 还原

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] check-chunks.mjs 首包断言在平铺产物下误报，修正首包定义**
- **Found during:** Task 3（复跑卡口）
- **Issue:** 中断前遗留的脚本把"所有预渲染页引用的并集"当首包；实际产物中 json-formatter.html modulepreload 自身的 428KB 工具 chunk（含 CM），触发误报 VIOLATION
- **Fix:** 首包 = 入口页 dist/index.html 引用集（含 chunk import 链闭包）；工具页引用的非首包 chunk 走 slug 匹配断言
- **Files modified:** scripts/check-chunks.mjs
- **Verification:** 干净产物 → OK: chunk budget pass；app chunk 注入 → 3 VIOLATION exit 1
- **Committed in:** 9632a69

**2. [Rule 2 - Missing Critical] 补全 chunk import 链可达性分析（堵住共享异步 chunk 中转盲区）**
- **Found during:** Task 3（fail-first 验证）
- **Issue:** html 不直接引用 useCopy chunk（两工具 chunk 经 `import{t as g}from"./useCopy-*.js"` 静态依赖）；CM 若被真实使用带进 useCopy chunk，原"仅查 html 直接引用"断言拦不住；且原正则不匹配 `import{...}from` 命名导入形式
- **Fix:** reachableChunks() BFS——从每页直接引用沿产物 import 语句（import/import{...}from/export...from/dynamic import）求可达闭包，闭包内 CM chunk 按 slug 匹配
- **Files modified:** scripts/check-chunks.mjs
- **Verification:** useCopy chunk 注入 CM → 2 条 VIOLATION（两工具页可达集）exit 1；json-formatter 自身 CM chunk 无误报
- **Committed in:** 9632a69

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)——均为 Task 3 自身产物的断言语义修正，未扩计划范围。
**Impact on plan:** 卡口语义对齐 vite-ssg 真实产物形态与 ARCH-02 本意（重依赖不进共享首屏），检测能力强于计划原文（含 import 链中转）。

## Issues Encountered

- **src 层 fail-first 探针被 tree-shake 吞掉**：CM 依赖树声明无副作用，`import 'codemirror'`（副作用导入）与 `void EditorView`（绑定 void 使用）均在 rollup 层被消除——共享层"导入但不使用"的 CM 天然不会进产物（对 ARCH-02 是一层免费防护）；真实泄漏模拟改走产物层注入。三次构建迭代完成验证。
- **预渲染页形态适配**：计划验收标准原文写 `dist/json-formatter/index.html`（目录形态）；vite-ssg 默认产物为平铺 `dist/json-formatter.html`（01-02 SUMMARY 已裁定）。脚本两种形态均认可，断言意图（每工具路由被预渲染）不变。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 四个计划全部执行完毕：注册表契约（01-01）+ 时间戳工具/useCopy（01-02）+ XSS 消毒管线（01-03）+ JSON 工具/分包卡口（01-04）
- check-chunks 卡口已接线 `check:chunks`，后续计划 verify 可直接复用；Phase 3 ARCH-05 在此基础上加 gzip ≤ 200KB 正式体积预算
- CodeMirrorJson.vue 封装形态可被 Phase 5 正则测试器批量复制
- 遗留（登记假设）：TOOL-01 数字保真仅保证文本层显示与往返（不提供 BigInt 运算）；ARCH-02 正式体积预算归 Phase 3

---
*Phase: 01-app-skeleton-tool-registry*
*Completed: 2026-09-07*

## Self-Check: PASSED

- 7 个 created 文件 + SUMMARY.md 全部存在（[ -f ] 逐项验证）
- 4 个任务提交（d136659 / 61e0a37 / 0ea47d2 / 9632a69）均在 git log 中
- 计划级 verification 复跑记录：vitest 8 files / 78 tests passed；type-check exit 0；lint 0 errors；`corepack pnpm build && node scripts/check-chunks.mjs` → OK: chunk budget pass exit 0
