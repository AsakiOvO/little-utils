---
phase: 03-seo
plan: 01
subsystem: seo-meta
tags: [seo, ssg, unhead, vite-ssg, meta]
requires: [tool-registry (Phase 1), vite-ssg prerender pipeline (Phase 1), RouteMeta augmentation (src/router/index.d.ts)]
provides:
  - src/config/site.ts SITE_URL 单源常量
  - src/composables/useToolSeo.ts 工具页标准 meta 集归拢层
  - 预渲染产物 meta 落盘（json-formatter/timestamp-converter/index/404 四页）
affects: [03-02 (sitemap/robots/check-dist 消费 SITE_URL 与含 meta 产物), 03-03 (部署后 curl 验收)]
tech-stack:
  added: [] # 零新增 npm 依赖（@unhead/vue 版本对齐 3.4.0 → ^2.1.2，非新增）
  patterns:
    - useSeoMeta 五键标准集归拢（D-05，og 三件套显式赋值）
    - titleTemplate App 级半角模板 + 页级 null discharge（D-06）
    - includedRoutes 追加 '/404' 预渲染 catch-all（D-08）
key-files:
  created:
    - src/config/site.ts
    - src/composables/useToolSeo.ts
  modified:
    - src/main.ts
    - src/App.vue
    - src/pages/home.vue
    - src/pages/not-found.vue
    - src/tools/json-formatter/json-formatter.vue
    - src/tools/timestamp-converter/timestamp-converter.vue
    - vite.config.ts
    - package.json
    - pnpm-lock.yaml
    - tsconfig.vitest.json
decisions:
  - "@unhead/vue 对齐 vite-ssg 28 内置集成版本 ^2.1.2（消除双实例 headSymbol 失配）"
  - "main.ts 不再自装 head，完全交由 ViteSSG 内置集成管理"
  - "首页 titleTemplate: null discharge App 级模板（unhead v2 语义验证生效）"
metrics:
  duration: 40min
  completed: 2026-09-09
status: complete
actuals:
  tokens: 9000
  tasks: 3
  commits: 4
---

# Phase 3 Plan 01: meta 注入层 tracer——SITE_URL 单源 + useToolSeo 端到端落盘实证 Summary

**One-liner:** 打通「注册表 ToolMeta → useSeoMeta → unhead → 预渲染 HTML head」垂直切片：SITE_URL 单源常量 + useToolSeo 归拢层 + 四页 meta 落盘 + 404 noindex 预渲染，A4 假设由红转绿实证。

## What Was Done

- **Task 1（tracer，A4 fail-first）**：RED 实证当前产物零工具页 meta → 实现 `src/config/site.ts`（SITE_URL 唯一定义点，D-11/D-12）与 `src/composables/useToolSeo.ts`（D-05 五键标准集 + meta.tool 双守卫 + canonical）→ App.vue titleTemplate（D-06）→ json-formatter.vue 单句接入 → GREEN：`dist/json-formatter.html` 落盘 title/description/canonical/og:title/og:url 各恰好 1 处。
- **Task 2**：timestamp-converter.vue 同型接入；home.vue useHead 保留 D-06 全角 title + D-10 description（含「数据不出浏览器」价值点）+ `titleTemplate: null` discharge（双后缀负断言计数 0）。
- **Task 3**：not-found.vue `useSeoMeta({ robots: 'noindex, nofollow', title: '页面不存在' })`；vite.config.ts includedRoutes 追加 `'/404'`（产物 `dist/404.html` 就位）；onBeforePageRender 暗色注入逐字未动，`class="dark"` 基线保持。

## Deviations from Plan

### [Rule 3 - Blocking] @unhead/vue 3.4.0 → ^2.1.2 版本对齐 + main.ts 移除自装 head

- **Found during:** Task 1（A4 fail-first 的初判为假）
- **Issue:** vite-ssg 28.3.0 硬依赖内置 `@unhead/vue@2.1.17`（SSR 期自动创建 server head 并 renderDOMHead 落盘），项目却装有 `@unhead/vue@3.4.0`——两份实例 provide/inject 的 `headSymbol` 不同，组件 useHead/useSeoMeta 全部写入 client 副本，SSG 渲染读 vite-ssg 的 v2 实例 → meta 零落盘。修复 main.ts 单点不足以统一实例，必须版本对齐。
- **Fix:** ① package.json `@unhead/vue` 改 `^2.1.2`（vite-ssg README 明言 integrates `@unhead/vue v2` out-of-the-box）；② main.ts 移除 `app.use(createHead())`（改由 ViteSSG 内置集成管理，SSR 期 server head、浏览器期 client head）；③ 组件层 useHead/useSeoMeta API 在 v2 完全兼容，零改动。
- **Commit:** d1045ad

### [Rule 3 - Blocking] tsconfig.vitest.json include 补 `src/**/*.d.ts`

- **Found during:** Task 1 type-check
- **Issue:** vitest 项目经 routes.test.ts → routes.ts → 注册表**动态 import** 链可达 useToolSeo.ts，但其 include 只有测试文件，`src/router/index.d.ts`（RouteMeta 增强）不在程序内 → `route.meta.tool` 退化为 unknown，type-check 报 6 例 TS2339。
- **Fix:** vitest 项目 include 追加 `src/**/*.d.ts`（增强文件必须进入程序才能全局 interface merge）。
- **Commit:** d1045ad

### Auto-fixed Issues

**[Rule 1 - Bug] useToolSeo 补无路由上下文守卫**
- **Found during:** 整体验证（timestamp-converter.component.test.ts 3 例回归）
- **Issue:** 组件测试直接挂载工具页无 router，`useRoute()` 返回 undefined，`route.meta` 抛 TypeError
- **Fix:** 守卫 1（`if (!route) return`）+ 守卫 2（`if (!tool) return`）双层跳过
- **Files modified:** src/composables/useToolSeo.ts
- **Commit:** 708b3de

## Auth Gates

无。

## Verification Evidence

- Task 1 verify（构建 + 5 项产物断言 + type-check）全绿；title='JSON 格式化 - little-utils'、description === 注册表原文、canonical/og:url 均以 SITE_URL 开头
- Task 2 verify 全绿：首页全角 title 1 处、半角双后缀 0 处、D-10 description 落盘、timestamp-converter title 1 处
- Task 3 verify 全绿：dist/404.html 存在 + noindex, nofollow + 暗色基线 class="dark" ≥ 1
- 整体验证：vitest 190/190 通过（零回归）、type-check 通过、lint 0 errors
- D-07 负向断言：dist 全部 HTML 零 JSON-LD script ✓
- D-12 单源断言：src/ 内 edgeone.app 字面量仅在 src/config/site.ts ✓

## TDD Gate Compliance

计划 type 非 tdd，未走 RED/GREEN/REFACTOR 门禁序列；Task 1 按计划内建 fail-first 实证（RED：产物零 meta → GREEN：五键落盘），精神等价。

## Known Stubs

无。

## Threat Flags

无新增信任面——meta 值全部来自代码内注册表/计划内字面量（T-03-01 disposition 落实），零外链（T-03-03），零新增 npm 包（T-03-SC；版本对齐非新增）。

## Self-Check: PASSED

- 4 个提交均在 main：d1045ad / c4b6661 / bc742ea / 708b3de ✓
- 关键产物文件存在：src/config/site.ts、src/composables/useToolSeo.ts、dist/404.html ✓
