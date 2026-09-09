---
phase: 03-seo
verified: 2026-09-09T17:49:39+08:00
status: passed
score: 9/9 must-haves verified
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "站点通过自定义域名在 EdgeOne Pages 公网可访问；无代理的大陆网络实测可打开（ROADMAP SC-3 原文）"
    reason: "Rule 4 用户决策（文档化偏离）：部署平台 EdgeOne Pages → Cloudflare Pages（腾讯国际版 EdgeOne 实名认证不可行，用户选定 Cloudflare Pages）；大陆无代理实测按 CONTEXT D-20 拆分口径显式挂起（执行条件 = 自定义域名绑定后，登记于 deferred-items.md，不阻塞本阶段）。全球可达性已由 https://little-utils.pages.dev 公网 curl 实证。"
    accepted_by: "user (Rule 4 + D-20, recorded in 03-03-SUMMARY & deferred-items.md)"
    accepted_at: "2026-09-09"
gaps: []
deferred:
  - truth: "D-04 sitemap 提交（Google Search Console + 百度站长平台）"
    addressed_in: "用户决策 SKIP，随时可执行"
    evidence: "deferred-items.md 登记：前置条件已满足（SITE_URL = 终态域名，sitemap.xml/robots.txt 公网可达），提交 URL = https://little-utils.pages.dev/sitemap.xml"
  - truth: "D-20 大陆无代理实测（ROADMAP SC-3 拆分项）"
    addressed_in: "自定义域名绑定后（Deferred Ideas）"
    evidence: "deferred-items.md 登记：大陆网络无代理打开首页与任一工具页（D-19），显式挂起非静默丢弃"
human_verification: []
coincidental_reliance_items: []
automated_checks:
  - check: "dist 本地产物 meta 断言（title/canonical/og:title/og:url 各恰好 1、description 非空）"
    result: PASS
  - check: "node scripts/check-dist.mjs（四类断言门禁）"
    result: "PASS — OK: dist checks pass (meta/sitemap/ext-link/gzip), exit 0"
  - check: "corepack pnpm run test:unit:run（全量单测，单次）"
    result: "PASS — 19 files / 194 tests passed（含 src/seo 4 个新用例）"
  - check: "corepack pnpm run type-check（vue-tsc --build）"
    result: "PASS — exit 0"
  - check: "公网 curl https://little-utils.pages.dev/json-formatter（SC-1）"
    result: "PASS — title/description/canonical/og:url 各 1，值 = SITE_URL 派生"
  - check: "公网 curl /timestamp-converter title"
    result: "PASS — 计数 1"
  - check: "公网 curl /sitemap.xml（SC-2）"
    result: "PASS — 3 loc（/ + 双工具路由），零 404，域名 = little-utils.pages.dev"
  - check: "公网 curl /robots.txt"
    result: "PASS — Sitemap: https://little-utils.pages.dev/sitemap.xml"
  - check: "公网 curl 任意不存在路径 404 页"
    result: "PASS — noindex 计数 1"
  - check: "D-12 单源：grep edgeone 于 src/ scripts/ public/"
    result: "PASS — 零残留；SITE_URL = https://little-utils.pages.dev（src/config/site.ts 唯一定义点）"
  - check: "D-07 负向：dist 全部 HTML 零 application/ld+json"
    result: "PASS — 4 页计数全 0"
  - check: "手写路由字面量禁令：grep 工具路由于 check-dist.mjs / vite.config.ts"
    result: "PASS — 零命中（check-chunks.mjs:10 为文档注释非路由清单）"
  - check: "仓库纪律：test ! -f .nvmrc；git ls-files dist 为空"
    result: "PASS"
  - check: "债务标记：grep TBD/FIXME/XXX/HACK/PLACEHOLDER 于阶段修改文件"
    result: "PASS — 零命中"
---

# Phase 3: 预渲染 SEO 与部署管线 验证报告

**Phase Goal:** 全球用户可通过搜索引擎或直达链接访问每个工具页——每条路由是含 SEO meta 的真实静态 HTML，站点部署于公网并可持续自动交付
**Verified:** 2026-09-09T17:49:39+08:00
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths（Roadmap SC + 三份 PLAN must_haves 合并去重）

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 每个工具页预渲染 HTML head 含「工具名 - little-utils」title、非空 description（=== 注册表 ToolMeta.description）、canonical、og:title/og:description/og:url（SC-1，D-05/D-06/D-09） | ✓ VERIFIED | 本地 dist/json-formatter.html 与 dist/timestamp-converter.html：title/canonical/og:title/og:url 各恰好 1 处，值 = `https://little-utils.pages.dev/<slug>`；check-dist [meta] 类断言（description 单源比对）OK；**公网 curl 双工具页复验同绿**（SC-1 线上实证） |
| 2 | 首页预渲染 title 保持全角「little-utils — 开发者 & 办公工具箱」且无半角双后缀（D-06）+ D-10 description | ✓ VERIFIED | dist/index.html `<title>little-utils — 开发者 &amp; 办公工具箱</title>`；`办公工具箱 - little-utils` 计数 0；home.vue useHead 显式 titleTemplate: null discharge（src/pages/home.vue:52-56） |
| 3 | dist/404.html 预渲染存在 + robots noindex；`class="dark"` 暗色基线不破坏（D-08 + Phase 2 基线） | ✓ VERIFIED | dist/404.html noindex 计数 1、title「页面不存在 - little-utils」；**公网任意不存在路径 noindex 计数 1**；dist/index.html class="dark" 计数 1；vite.config.ts onBeforePageRender 与 Phase 2 版本逐字一致（:35-38 幂等注入） |
| 4 | canonical/og:url/sitemap 全部 URL/robots.txt Sitemap 行四消费方全部从 SITE_URL 单源派生，源码零散落硬编码域名（D-12） | ✓ VERIFIED | src/config/site.ts 唯一定义点（SITE_URL = https://little-utils.pages.dev，含 Rule 4 平台偏离注释）；useToolSeo.ts:25,28 与 vite.config.ts:51-52 均 import 派生；grep 'edgeone' 于 src/ scripts/ public/ 零残留；线上四消费方实测值同步 |
| 5 | dist/sitemap.xml 与 dist/robots.txt 由构建自动生成，路由清单 jiti 实载注册表，与注册表双向一致，/404 不收录（SC-2，D-03/D-08） | ✓ VERIFIED | vite.config.ts onFinished（:43-53）jiti.import 注册表取 tools[].path，零手写路由字面量；本地 sitemap 恰 3 loc、零 404；**公网 sitemap 3 loc、robots Sitemap 行 = 真实域名**（SC-2 线上实证）；check-dist [sitemap] 双向集合断言 OK |
| 6 | check:dist 四类断言（meta/sitemap↔注册表/零外链/gzip ≤ 200KB）任一失败 exit 1，并挂进 check:all 聚合门禁链（SC-4，D-17/D-18） | ✓ VERIFIED | scripts/check-dist.mjs 实质实现四类断言（violations 数组 + `FAIL: N` + process.exit(1)，:299-303；dist 缺失 fail-fast :74-75）；实测 exit 0 输出 OK 行；package.json:16 `check:all = run-s test:unit:run type-check lint build-only check:chunks check:dist`（check:dist 殿后 build-only ✓，链序修正已落地）；外链扫描为资源加载向量级（:164-175），零 w3.org 误报；exit-1 失败路径由 03-02 SUMMARY fail-first 探针记录（dist 移走 → 3 VIOLATION + exit 1）佐证 |
| 7 | 预渲染页面零 JSON-LD（D-07 负向）；字体系统栈零 webfont 零外链（D-16） | ✓ VERIFIED | dist 4 页 application/ld+json 计数全 0；check-dist [ext-link] OK（零第三方资源 URL） |
| 8 | 推 main 触发自动构建部署，构建门禁链任一失败不部署（SC-5，D-15） | ✓ VERIFIED | 线上 https://little-utils.pages.dev 服务的产物 = SITE_URL 修正后（commit 7ae5b53）的构建结果（canonical/sitemap/robots 均为 pages.dev 域名）——部署行为直接可观察证据；平台构建命令 = check:all 全门禁链（Task 1 human checkpoint 回填记录于 03-03-SUMMARY） |
| 9 | ROADMAP SC-3：站点经自定义域名在 EdgeOne Pages 公网可访问；无代理大陆网络实测可打开 | PASSED (override) | 平台偏离为 Rule 4 用户决策（EdgeOne 实名认证不可行 → Cloudflare Pages，全球可达已实证）；大陆实测按 D-20 拆分口径显式挂起（用户决策，登记 deferred-items.md，不阻塞本阶段）——见 overrides 与 deferred |

**Score:** 9/9 truths verified（1 项为文档化 override；0 present-behavior-unverified）

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | D-04 sitemap 提交（GSC + 百度站长） | 用户决策 SKIP，随时可重做 | deferred-items.md；前置条件已满足（终态域名 + 占位域名计数 0 + sitemap 公网可达），跳过本身不产生 Pitfall 2 收录污染 |
| 2 | D-20 大陆无代理实测 | 自定义域名绑定后执行 | deferred-items.md；D-19 执行方式成文，显式挂起非静默丢弃 |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/config/site.ts` | SITE_URL 唯一定义点（纯常量，Node 安全） | ✓ VERIFIED | 7 行纯常量，零 import 零浏览器 API，D-11/D-12 注释 + Rule 4 平台偏离记录 |
| `src/composables/useToolSeo.ts` | 工具页标准 meta 集归拢层（D-05） | ✓ VERIFIED | 五键 useSeoMeta（ogTitle 显式赋值，Pitfall 5）+ canonical useHead + 双守卫（!route/!tool）+ SITE_URL import；双工具页单句接入（json-formatter.vue:101 / timestamp-converter.vue:190） |
| `src/App.vue` / `src/pages/home.vue` / `src/pages/not-found.vue` | titleTemplate / 首页 meta+discharge / 404 noindex | ✓ VERIFIED | App.vue:21 半角模板；home.vue:54-56 全角 title + null discharge + D-10 description；not-found.vue:23 `useSeoMeta({ robots: 'noindex, nofollow', title: '页面不存在' })` |
| `src/seo/index.ts` + `src/seo/index.test.ts` | 纯函数生成器 + 单测 | ✓ VERIFIED | buildSitemapXml（&→&amp; 实体转义、sitemaps.org 最小集）/ buildRobotsTxt；vitest 4/4 绿（本次全量运行实证）；零浏览器 API 零 import |
| `scripts/check-dist.mjs` | 四类断言脚本（violations + exit 1） | ✓ VERIFIED | 306 行实质实现；a/b/c/d 类别标签可定位；jiti 载注册表与 SITE_URL（本脚本零硬编码域名） |
| `vite.config.ts` | includedRoutes '/404' + onFinished sitemap/robots | ✓ VERIFIED | :30 追加 '/404'；:43-53 onFinished；onBeforePageRender 未动 |
| `package.json` | check:dist + check:all | ✓ VERIFIED | :14-16；check:dist 位于 build-only 之后；零新增 npm 依赖（@unhead/vue ^2.1.2 为版本对齐非新增） |
| dist 产物（含 meta 的 HTML + sitemap.xml + robots.txt） | 预渲染落盘 | ✓ VERIFIED | 5 个 html + sitemap + robots 全在位，断言全过 |
| GitHub 公开仓 + remote origin | git@github.com:AsakiOvO/little-utils.git | ✓ VERIFIED | git remote -v 实证；git ls-files dist 为空 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| routes.ts meta.tool | useToolSeo | useRoute().meta.tool → useSeoMeta/useHead | ✓ WIRED | A4 垂直切片实证：注册表 name/description 落进静态 HTML head（本地产物 + 公网双实证） |
| src/config/site.ts SITE_URL | canonical/og:url | useToolSeo import 派生 | ✓ WIRED | 线上值 = pages.dev 派生 |
| src/config/site.ts SITE_URL | onFinished sitemap/robots | vite.config import | ✓ WIRED | 本地 + 公网产物同步 |
| src/config/site.ts SITE_URL | check-dist 外链白名单 + robots 断言 | jiti 载入 | ✓ WIRED | 脚本零硬编码域名 |
| jiti 载注册表 | onFinished 路由清单 + check-dist 一致性 | 双源消除 | ✓ WIRED | 零工具路由字面量（grep 实证） |
| package.json check:all | 部署平台构建命令 | 控制台配置（human checkpoint 回填） | ✓ WIRED | 03-03-SUMMARY Task 1 记录；线上产物 = 过门产物（间接实证） |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| 工具页 title/description | route.meta.tool | 注册表 ToolMeta（单一真相） | ✓ | FLOWING |
| canonical/og:url | SITE_URL | src/config/site.ts | ✓ | FLOWING |
| sitemap loc 集合 | tools[].path | 注册表（jiti 实载） | ✓ | FLOWING |
| robots Sitemap 行 | SITE_URL | src/config/site.ts | ✓ | FLOWING |
| check-dist 期望值 | 注册表 + SITE_URL | 同上双源 | ✓ | FLOWING（无 mock/静态回退） |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 全量单测 | `corepack pnpm run test:unit:run` | 19 files / 194 tests passed | ✓ PASS |
| 产物门禁 | `node scripts/check-dist.mjs` | OK: dist checks pass (meta/sitemap/ext-link/gzip), exit 0 | ✓ PASS |
| 类型检查 | `corepack pnpm run type-check` | exit 0 | ✓ PASS |
| SC-1 公网 | curl /json-formatter + /timestamp-converter | title/description/canonical/og 各 1 | ✓ PASS |
| SC-2 公网 | curl /sitemap.xml + /robots.txt | 3 loc；Sitemap 行真实域名 | ✓ PASS |
| 404 公网 | curl 任意不存在路径 | noindex 计数 1 | ✓ PASS |

### Probe Execution

本阶段无 `scripts/*/tests/probe-*.sh` 声明。probe 等价物 = check:all 门禁链，本次独立复跑其中三项（全量单测 / type-check / check-dist）全绿；check-dist 的 fail-first（exit 1）失败路径由 03-02 SUMMARY 探针记录（dist 移走 → 3 VIOLATION + exit 1 → 复原 OK）佐证，本次以源码审查确认 exit-1 出口存在（:299-303）。PASS。

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ARCH-03 | 03-01, 03-02 | 构建期 SSG 预渲染每条工具路由为含 SEO meta 的静态 HTML，生成 sitemap.xml 与 robots.txt | ✓ SATISFIED | Truths 1/3/4/5；公网 curl 实证（SC-1/SC-2） |
| ARCH-05 | 03-02, 03-03 | 部署管线（部署平台 + 构建产物零第三方外链 + bundle 体积预算检查） | ✓ SATISFIED | Truths 6/8/9；平台偏离 EdgeOne → Cloudflare Pages 为 Rule 4 用户决策（文档化）；「自定义域名」按 D-01 本就排于默认域名上线之后，非本阶段交付物 |

REQUIREMENTS.md Traceability 表中 ARCH-05 已标 Complete；**ARCH-03 状态行为陈旧快照**（"In Progress … sitemap/robots 待 03-02"，实际已全部交付）——建议 orchestrator 提交时同步更新为 Complete（docs 级，非代码缺口）。无孤儿需求（Phase 3 计划声明的 requirement IDs = {ARCH-03, ARCH-05}，与 REQUIREMENTS.md Phase 3 映射完全一致）。

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| scripts/check-chunks.mjs | 10 | 注释中出现 "json-formatter" | ℹ️ Info | 误报——文档注释示例（chunk 依赖说明），非路由清单字面量，不违反禁令 |

阶段修改文件零 TBD/FIXME/XXX/HACK/PLACEHOLDER；零 stub；零 JSON-LD；零 edgeone 残留。

### Human Verification Required

无未决阻塞项。两项用户决策挂起已登记 deferred-items.md（D-04 sitemap 提交随时可重做；D-20 大陆实测待自定义域名绑定），均按计划口径显式挂起、不阻塞本阶段完成。

**移交备注（judgment-tier，非阻塞）：**
1. Cloudflare Pages 控制台构建命令 = `pnpm check:all` 与 NODE_VERSION/PNPM_VERSION 环境变量为控制台配置（git 无记录），依据 03-03-SUMMARY Task 1 human checkpoint 回填记录采信；「线上产物 = 过门产物」已由公网产物与本地 check-dist 通过的构建一致这一间接证据支撑。
2. REQUIREMENTS.md ARCH-03 状态行建议更新为 Complete（docs 清账）。

### Gaps Summary

无阻塞缺口。五条 Roadmap 成功准则中四条（SC-1/SC-2/SC-4/SC-5）以本地产物断言 + 公网 curl + 门禁链复跑三重实证；SC-3 经 Rule 4 用户决策（平台换 Cloudflare Pages）与 D-20 拆分口径（大陆实测显式挂起）文档化调整，全球可达性已由 https://little-utils.pages.dev 实证。三份 PLAN 的 must_haves（truths/artifacts/key_links/prohibitions）逐项核对全部满足：双工具页五键 meta 落盘、首页全角 title 无双后缀、404 noindex + 暗色基线保持、SITE_URL 四消费方单源零硬编码、零 JSON-LD、sitemap↔注册表双向一致、check:all 门禁链链序正确、零新增 npm 依赖、仓库零 dist 无 .nvmrc。Phase 目标达成，可进入下一阶段。

---

_Verified: 2026-09-09T17:49:39+08:00_
_Verifier: Claude (gsd-verifier)_
