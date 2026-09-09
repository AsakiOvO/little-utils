---
phase: 03-seo
plan: 02
subsystem: seo-build-gates
tags: [seo, sitemap, robots, vite-ssg, build-gates, dist-assertions]
requires: [SITE_URL 单源 (03-01 src/config/site.ts), 工具注册表 (src/tools/index.ts), vite-ssg onFinished 接缝, check-chunks.mjs BFS 先例]
provides:
  - src/seo 纯函数生成器（buildSitemapXml / buildRobotsTxt，Node 安全可单测）
  - 构建自动产出 dist/sitemap.xml（/ + 工具路由，无 /404）与 dist/robots.txt
  - scripts/check-dist.mjs 四类产物断言（meta/sitemap/ext-link/gzip）
  - package.json check:dist 与 check:all 门禁链（EdgeOne 构建命令唯一入口）
affects: [03-03 (EdgeOne 部署，构建命令填 check:all 单条), Phase 5 (新工具注册表一行自动获 meta+sitemap 断言覆盖)]
tech-stack:
  added: [] # 零新增 npm 依赖（T-03-SC 纪律保持）
  patterns:
    - jiti 实载注册表双源消除（onFinished + check-dist 两处，零手写路由清单）
    - sitemaps.org 协议最小集 + & → &amp; 实体转义（T-03-02）
    - violations 数组 + 类别标签 + exit 1 门禁模式（照 check-chunks 先例加 [meta]/[sitemap]/[ext-link]/[gzip] 定位）
    - 资源加载向量级外链扫描（属性级提取天然排除 xmlns*，Pitfall 3）
key-files:
  created:
    - src/seo/index.ts
    - src/seo/index.test.ts
    - scripts/check-dist.mjs
  modified:
    - vite.config.ts
    - package.json
    - tsconfig.node.json
decisions:
  - "onFinished 注册表类型用局部结构断言而非 typeof import()——类型层模块图引用会把全组件图拉进 tsconfig.node 程序产生幽灵报错"
  - "check:all 用 test:unit:run（vitest run）替代 watch 态 test:unit——非 CI TTY / EdgeOne 构建环境 vitest watch 挂起"
  - "vite.config src 导入加 .ts 扩展 + allowImportingTsExtensions——消除 Vite 8 native configLoader 未来默认值警告"
metrics:
  duration: 45min
  completed: 2026-09-09
status: complete
actuals:
  tokens: 5000    # chars/4 over realized diff（19973 字节）
  tasks: 3
  commits: 6
---

# Phase 3 Plan 02: 构建期生成 + 产物断言门禁——sitemap/robots 与 check-dist Summary

**One-liner:** vite-ssg onFinished 从注册表 + SITE_URL 单源构建期生成 sitemap.xml/robots.txt（jiti 双源消除、零硬编码域名），check-dist.mjs 四类断言（meta 非空 / sitemap↔注册表双向一致 / 零第三方外链 / 200KB gzip 预算）经 check:all 线性链成为机器门禁——Phase 5 新工具「注册表一行」自动获得收录与断言覆盖。

## What Was Done

- **Task 1（TDD）**：RED 提交 `src/seo/index.test.ts`（4 用例：协议最小集形态 / `&`→`&amp;` 实体转义 / 最小集负断言 / robots 行格式），vitest 先红（模块不存在）；GREEN 提交 `src/seo/index.ts` 纯函数生成器（零 import 零浏览器 API，Node 安全），4/4 绿 + type-check 过。
- **Task 2**：vite.config.ts `ssgOptions.onFinished`——jiti 实载注册表取 `tools[].path`（零工具路由字面量），`buildSitemapXml(['/', ...toolPaths], SITE_URL)` 与 `buildRobotsTxt(SITE_URL)` 写入 dist；robots.txt 不放 public/（D-12 单源）；/404 不进 sitemap（D-08）。验证：3 loc 恰好（/ + 两工具路由）、零 404、Sitemap 行 = SITE_URL 派生。
- **Task 3**：`scripts/check-dist.mjs` 四类断言（a meta 非空+D-06 title 格式+D-09 description 单源一致+404 noindex 特例；b sitemap↔注册表双向集合相等+robots Sitemap 行单源；c 资源加载向量级零外链扫描（SITE_URL 前缀白名单，xmlns*/data:/#/mailto 放行）；d 入口页可达闭包（含 CSS）gzipSync 求和 ≤ 200*1024）；package.json 新增 `check:dist` 与 `check:all`（run-s 线性链，check:dist 殿后 build-only）。

## Deviations from Plan

### Auto-fixed Issues

**[Rule 1 - Bug] onFinished 注册表类型注解拉入组件图导致 type-check 回归**
- **Found during:** Task 3 整体验证（check:all 的 type-check 步骤）
- **Issue:** `jiti.import<typeof import('./src/tools/index')>` 的类型层模块图引用把整个组件图（useThemeMode/CodeMirrorJson 等）拉进 tsconfig.node 程序（无 DOM lib、无 `@` 别名）→ 12 例幽灵 TS2584/TS2307/TS2339。Task 2 当轮仅跑了 build-only 未跑 type-check，故带病提交。
- **Fix:** 改局部结构断言 `{ tools: Array<{ path: string }> }`，类型层零模块图引用。
- **Files modified:** vite.config.ts
- **Commit:** 14bb946

**[Rule 3 - Blocking] check:all 用 test:unit:run 替代 watch 态 test:unit**
- **Found during:** Task 3 package.json 接线
- **Issue:** 计划原文 `"check:all": "run-s test:unit ..."`——test:unit = `vitest`（watch 态），非 CI TTY 终端会挂起不退出，EdgeOne 构建环境 CI 变量不可依赖，门禁链存在挂死风险。
- **Fix:** 新增 `"test:unit:run": "vitest run"` 并入链；test:unit watch 语义保留给开发者。
- **Files modified:** package.json
- **Commit:** 60113bf

**[chore - 加固] vite.config src 导入加 .ts 扩展 + allowImportingTsExtensions**
- **Found during:** Task 3 验证输出（Vite 8 native configLoader 警告）
- **Issue:** 目录索引/无扩展导入是 native loader 计划默认值下的不兼容形态（警告明示 future major 默认）。
- **Fix:** `'./src/seo/index.ts'`、`'./src/config/site.ts'` + tsconfig.node.json `allowImportingTsExtensions: true`（noEmit 已开启）。
- **Files modified:** vite.config.ts、tsconfig.node.json
- **Commit:** b5c97c4

## Verification Evidence

- `corepack pnpm vitest run src/seo/index.test.ts` 4/4 绿；全量套件经 check:all 的 test:unit:run 零回归
- `corepack pnpm check:all` 全链绿（test→type-check→lint→check:chunks→build-only→check:dist），EXIT=0
- dist/sitemap.xml 恰 3 loc（SITE_URL + `/`、`/timestamp-converter`、`/json-formatter`）、零 404；robots.txt Sitemap 行 = `https://little-utils.edgeone.app/sitemap.xml`（SITE_URL 派生）
- check:dist fail-first 探针：dist 移走 → 3 条 VIOLATION + exit 1，复原后 OK 行 + exit 0
- 零 w3.org 误报（Pitfall 3 属性级扫描器正确）
- 暗色基线：dist/index.html `class="dark"` ≥ 1 保持
- prohibitions 核查：scripts/ 与 public/ 零 edgeone.app 字面量（SITE_URL 唯一定义点保持）；check-dist.mjs 与 vite.config.ts 零工具路由字面量（jiti 双源消除）；零新增 npm 依赖
- grep dist 全部 HTML 零 JSON-LD（D-07 持续保持，由 check:all 内既有测试覆盖）

## TDD Gate Compliance

Task 1 按计划 RED→GREEN 双提交闭环（92097cb test 先红 → 72b4b82 feat 转绿），无 REFACTOR 必要（拼接逻辑 8 行无重复）。Task 2/3 非行为型 TDD 任务，走产物断言验证。

## Known Stubs

无。

## Threat Flags

无新增信任面——T-03-02（XML 实体转义，单测锁定）、T-03-03（零外链断言进 check:all 门禁链）、T-03-05（dist 缺失 fail-fast exit 1 实证）、T-03-SC（零新增 npm 包）全部按 threat_model disposition 落实。

## Self-Check: PASSED

- 6 个提交均在 main：92097cb / 72b4b82 / fdad228 / 14bb946 / 60113bf / b5c97c4 ✓
- 关键产物文件存在：src/seo/index.ts、src/seo/index.test.ts、scripts/check-dist.mjs、dist/sitemap.xml、dist/robots.txt ✓
