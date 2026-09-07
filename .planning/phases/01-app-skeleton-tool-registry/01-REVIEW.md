---
phase: 01-app-skeleton-tool-registry
reviewed: 2026-09-07T03:18:44Z
depth: standard
files_reviewed: 52
files_reviewed_list:
  - .editorconfig
  - .gitattributes
  - .gitignore
  - .oxlintrc.json
  - .prettierrc.json
  - README.md
  - env.d.ts
  - eslint.config.ts
  - index.html
  - package.json
  - public/favicon.ico
  - scripts/check-chunks.mjs
  - src/App.vue
  - src/components/ToolCard.test.ts
  - src/components/ToolCard.vue
  - src/composables/useCopy.test.ts
  - src/composables/useCopy.ts
  - src/layouts/home.layout.vue
  - src/layouts/tool.layout.vue
  - src/main.ts
  - src/pages/home.vue
  - src/pages/not-found.vue
  - src/router/index.d.ts
  - src/router/routes.test.ts
  - src/router/routes.ts
  - src/styles/base.css
  - src/styles/tokens.css
  - src/tools/index.ts
  - src/tools/json-formatter/components/CodeMirrorJson.vue
  - src/tools/json-formatter/components/JsonTree.vue
  - src/tools/json-formatter/index.ts
  - src/tools/json-formatter/json-formatter.service.test.ts
  - src/tools/json-formatter/json-formatter.service.ts
  - src/tools/json-formatter/json-formatter.vue
  - src/tools/registry.test.ts
  - src/tools/timestamp-converter/index.ts
  - src/tools/timestamp-converter/timestamp-converter.service.test.ts
  - src/tools/timestamp-converter/timestamp-converter.service.ts
  - src/tools/timestamp-converter/timestamp-converter.vue
  - src/tools/tool.ts
  - src/ui/safe-html.test.ts
  - src/ui/safe-html.vue
  - src/utils/sanitize.test.ts
  - src/utils/sanitize.ts
  - tsconfig.app.json
  - tsconfig.json
  - tsconfig.node.json
  - tsconfig.vitest.json
  - vite.config.ts
  - vitest.config.ts
findings:
  critical: 1
  warning: 4
  info: 5
  total: 10
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-09-07T03:18:44Z
**Depth:** standard
**Files Reviewed:** 52
**Status:** issues_found

## Summary

对 Phase 1 的全部 52 个文件做了标准深度审查:注册表契约与路由派生、XSS 消毒管线(sanitizeHtml + SafeHtml + ESLint 卡口)、双布局、时间戳/JSON 两个工具、chunk 预算脚本与测试基建。整体架构纪律执行良好:路由确实纯派生自注册表、全站无第二个 v-html/innerHTML 出口、JSON tokenizer 的数字保真设计(原文逐字拷贝、不经 number 中转)实现正确且有往返测试、SSG 纪律(环境 API 只在函数体内)总体到位。78 个现有单测全部通过,`vue-tsc --build` 零错误。

但发现 **1 个 BLOCKER**:时间戳工具的"手动输入 IANA 时区"入口会把任意用户文本直接传给 `dayjs.tz`,非法时区(含常见的 `UTC+8` 写法)抛出未捕获的 `RangeError`,在 computed 渲染期崩溃导致整页白屏 —— 直接违背服务层自己声明的 V7"非法输入返回结构化错误、不裸抛"契约(已用 node 实证复现)。另有 4 个 WARNING:`detectUnit` 对带空白输入的 1000 倍单位错判(同样已实证)、测试文件因 tsconfig/eslint 的 `__tests__` 路径约定错位而完全游离于类型检查与 lint 之外、check-chunks.mjs 硬编码工具路由列表违背注册表单一事实来源不变量。

关键验证手段:node 复现 dayjs.tz 抛错与 detectUnit 错判、`tsc --listFilesOnly` 证明 vitest project 不含任何测试文件、vitest run 确认基线干净(即测试盲区恰好掩盖上述两个服务层 bug)。

## Critical Issues

### CR-01: 非法时区输入抛 RangeError 打破"不裸抛"契约,手填时区导致整页白屏

**File:** `src/tools/timestamp-converter/timestamp-converter.service.ts:93`(reverse 路径 `dayjs.tz(input, tz)`)、`src/tools/timestamp-converter/timestamp-converter.service.ts:87`(forward 路径 `d.tz(tz)`)
**Issue:** 服务层注释明确承诺"非法输入返回 ok:false + error,不裸抛"(V7 契约,两个 Result 接口的头条注释),但 `tz` 参数未做任何校验。实测(Node 24 + dayjs 1.11.23):

```
dayjs.tz('2025-01-01 08:00:00', 'Foo/Bar')  → RangeError: Invalid time zone specified: Foo/Bar
dayjs('...').tz('Not/AZone')                 → RangeError
dayjs.tz('2025-01-01 08:00:00', 'UTC+8')     → RangeError   ← 常见的人类写法,必抛
```

而 UI 在 `timestamp-converter.vue:39-46`(正向)与 `:133-140`(反向)明确提供"手动输入 IANA 时区…"的自由文本输入框,`effectiveForwardTz`/`effectiveDtTz` 把原始文本原样传入 service。`fromTimestamp`/`toTimestamp` 在 `<computed>` 中被调用(`timestamp-converter.vue:244-246、292-296`),异常会从渲染期抛出 —— 该组件没有 `onErrorCaptured`,Vue 3 默认行为是卸载组件树,用户侧表现即整页白屏。错误输入一个 `UTC+8` 或拼错一个地名即可复现,且 placeholder 恰恰在引导用户手动输入,触发概率高。

**Fix:** 在 service 层用 Intl 特性校验 `tz`,非法时返回与现有形态一致的结构化错误:

```ts
// timestamp-converter.service.ts
function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export function fromTimestamp(ts: string, tz?: string): FromTimestampResult {
  const unit = detectUnit(ts)
  if (unit === 'invalid') {
    return { ok: false, error: `无法识别的时间戳:...`, /* 全 null 字段 */ }
  }
  if (tz !== undefined && !isValidTimeZone(tz)) {
    return {
      ok: false,
      error: `未知时区:「${tz}」,请输入 IANA 时区名(如 Asia/Shanghai)。`,
      detectedUnit: null, local: null, utc: null, offset: null, timeZone: null, target: null,
    }
  }
  // ... 原有逻辑
}
```

`toTimestamp` 在解析前加同样校验。UI 错误卡(`role="alert"` 渲染 `result.error`)已就绪,service 收敛后白屏即消失。可补一条测试:`fromTimestamp('0', 'UTC+8').ok === false`。

## Warnings

### WR-01: detectUnit 空白处理不一致 → 1000 倍单位错判

**File:** `src/tools/timestamp-converter/timestamp-converter.service.ts:51-52`
**Issue:** 合法性检测用 `ts.trim()`(line 51),但位数判定用未 trim 的原始 `ts`(line 52 `ts.replace('-', '').length`)。实证:`detectUnit(' 1735689600 ')` 返回 `'ms'`(10 位秒级时间戳被错判为毫秒),服务会给出 1970 年代的结果 —— 这正是 line 47 注释里明确要防的"1000 倍错判"。当前 UI 层(`timestamp-converter.vue:245`)先 trim 掩盖了该 bug,但 service 是全站公共 API,Phase 5/8 批量工具复用时极易踩中;现有测试也无带空白用例。
**Fix:** 收窄为单一变量:

```ts
export function detectUnit(ts: string): DetectedUnit {
  const s = ts.trim()
  if (!/^-?\d+$/.test(s)) return 'invalid'
  const len = s.replace('-', '').length
  if (len <= 11) return 's'
  if (len <= 14) return 'ms'
  return 'invalid'
}
```

补测试:`detectUnit(' 1735689600 ') === 's'`、`detectUnit('\t1735689600000\n') === 'ms'`。

### WR-02: 8 个测试文件完全游离于 vue-tsc 类型检查之外

**File:** `tsconfig.vitest.json:6`
**Issue:** `include: ["src/**/__tests__/*", "env.d.ts"]` 沿用脚手架的 `__tests__/` 目录约定,但本项目全部测试按 `*.test.ts` 就近放置(ToolCard.test.ts、routes.test.ts、registry.test.ts、useCopy.test.ts、两个 service.test.ts、sanitize.test.ts、safe-html.test.ts),仓库中不存在任何 `__tests__` 目录。已用 `tsc -p tsconfig.vitest.json --listFilesOnly` 实证:该 project 只包含 env.d.ts + node_modules 依赖类型,**0 个测试文件**。后果:`pnpm build` 的 type-check 环节对 780+ 行测试代码(含大量 `as never`、`as unknown as` 断言)零覆盖,测试中的类型腐化完全不可见。
**Fix:**

```json
"include": ["src/**/*.test.ts", "src/**/__tests__/*", "env.d.ts"]
```

改后跑一次 `pnpm type-check`,修复暴露出来的测试文件类型错误(预期集中在 ToolCard.test.ts:33 与 registry.test.ts:21 的 `as never` 断言处)。

### WR-03: ESLint vitest 插件规则未应用到任何测试文件

**File:** `eslint.config.ts:44`
**Issue:** `files: ['src/**/__tests__/*']` 与 WR-02 同源的路径错位:`@vitest/eslint-plugin` 的 recommended 规则集(`expect-expect`、`no-focused-tests`、`no-identical-title` 等)对仓库里实际存在的 8 个 `*.test.ts` 文件零生效。测试可靠性类 lint 完全空转。
**Fix:**

```ts
{
  ...pluginVitest.configs.recommended,
  files: ['src/**/__tests__/*', 'src/**/*.test.ts'],
}
```

### WR-04: check-chunks.mjs 硬编码工具路由列表,违背注册表单一事实来源不变量

**File:** `scripts/check-chunks.mjs:28`
**Issue:** `const TOOL_ROUTES = ['json-formatter', 'timestamp-converter']` 是 Phase 1 关键不变量"路由只能从 `src/tools/index.ts` 派生,禁止硬编码路由清单"的直接违例(构建脚本侧)。注释自称"与 src/tools 注册表一致",但一致性靠人肉维持:新增工具时若忘记同步此脚本,断言 d(预渲染页存在性检查)会静默漏检新工具页;若工具目录改名/删除,脚本则对幽灵路由持续误报或漏报。当前两个条目恰好与注册表一致,但漂移只是时间问题。
**Fix:** 从注册表派生该清单(脚本零依赖约束下的轻量做法 —— 约定 slug = 工具目录名):

```js
const TOOL_ROUTES = readdirSync(join(repoRoot, 'src/tools'), { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
```

更严格的做法:由构建步骤从注册表导出 JSON(或用 jiti 加载 `src/tools/index.ts`)供脚本消费,彻底消除双源。

## Info

### IN-01: registry.test.ts 注释与实际状态不符("当前注册表(空)")

**File:** `src/tools/registry.test.ts:48`
**Issue:** 测试名与注释写"当前注册表(空)通过",但注册表现在已收录 timestampConverter 与 jsonFormatter 两个工具(测试本身仍有效,断言的是默认参数注册表通过)。过时注释会误导后来者以为注册表仍为空。
**Fix:** 注释与用例名改为"当前注册表通过,不抛错",去掉"(空)"。

### IN-02: assertRegistryInvariants 未校验 createdAt 契约格式

**File:** `src/tools/index.ts:33-41`(对照 `src/tools/tool.ts:21-22` 的契约承诺)
**Issue:** `tool.ts` 承诺 `createdAt` 为 ISO `'YYYY-MM-DD'` 且 `isNew` 由其派生,但 invariants 只查 path/category/keywords 四项。`createdAt: 'abc'` 时 `new Date(...).getTime()` 得 NaN,`defineTool` 静默产出 `isNew: false`,工具永久不亮 NEW 徽标 —— 属于注册表层的静默失真,与其余四项 fail-fast 纪律不一致。
**Fix:** invariants 增加一项:

```ts
if (!/^\d{4}-\d{2}-\d{2}$/.test(t.createdAt) || Number.isNaN(new Date(t.createdAt).getTime())) {
  throw new Error(`bad createdAt: ${t.path}`)
}
```

### IN-03: README.md 仍是脚手架默认模板内容

**File:** `README.md:1`
**Issue:** 标题仍是 "scaffold-tmp",通篇为 create-vue 模板原文,没有项目自身的定位说明("little-utils — 开发者 & 办公工具箱"、注册表接入方式、`pnpm check:chunks` 门卡等 Phase 1 已落地的事实)。对 Phase 5/8 批量接入工具的贡献者,接入文档的最小落点缺失。
**Fix:** 用项目实际信息重写 README:项目定位、工具接入三步(加目录 → 注册表一行 → 构建即验)、脚本清单(`check:chunks` / `test:unit` / `build`)。

### IN-04: vitest.config.ts 无扩展名导入触发 Vite configLoader 警告

**File:** `vitest.config.ts:3`
**Issue:** `import viteConfig from './vite.config'` 缺扩展名,Vite 8 在运行测试时报 "unsupported by configLoader: 'native'" 警告(Vite 官方提示未来版本将成为默认行为)。
**Fix:** 改为 `import viteConfig from './vite.config.ts'`。

### IN-05: check-chunks.mjs 的 chunk import 提取正则不支持 `../` 相对引用

**File:** `scripts/check-chunks.mjs:77`
**Issue:** `extractChunkImports` 的正则只匹配 `"./x.js"` 与 `"/x.js"` 形态(`\/?\.\/`),不匹配 `import("../chunks/x.js")`。当前 Vite 平铺产物中 chunk 间引用均为 `./`,断言成立;但该脚本定位是长期分包卡口,若未来产物出现上级相对引用,BFS 会漏追依赖 → 可达闭包不完整 → CM 泄漏漏检(假阴性),且不会报错,属静默失效方向。
**Fix:** 正则放宽为 `["'](\.{1,2}\/[^"']+\.js)["']`,并对 `../` 引用以 chunk 所在目录为基准做 path 归一化后再入 BFS 队列。

---

_Reviewed: 2026-09-07T03:18:44Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
