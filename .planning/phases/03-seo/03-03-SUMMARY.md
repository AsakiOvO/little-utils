---
phase: 03-seo
plan: 03
subsystem: deploy-pipeline
tags: [deploy, cloudflare-pages, github, site-url, seo, acceptance]
requires: [check:all 门禁链 (03-02 package.json), SITE_URL 单源 (src/config/site.ts), sitemap/robots 构建期生成 (03-02 vite.config.ts onFinished)]
provides:
  - GitHub 公开仓 AsakiOvO/little-utils + remote origin（git push main 触发自动构建部署）
  - Cloudflare Pages 生产站点 https://little-utils.pages.dev（构建命令 pnpm check:all 全门禁链，输出 dist）
  - SITE_URL 终态域名闭环——canonical / og:url / sitemap / robots 四消费方线上同步验证
affects: [Phase 4+（新工具 push 即自动上线）, D-20 大陆实测（待自定义域名绑定）]
tech-stack:
  added: [] # 零新增 npm 依赖（T-03-SC 纪律保持）
  patterns:
    - SITE_URL 单源换源机制首次真实验证（一处常量 + 重部署，四消费方同步）
    - 平台构建命令 = check:all 聚合门禁链（SC-4：线上产物永远过门）
key-files:
  created: [] # 无新代码文件；本 plan 产出为平台配置 + 既有文件修正
  modified:
    - src/config/site.ts
    - package.json
decisions:
  - "部署平台由 EdgeOne Pages 换为 Cloudflare Pages（Rule 4 用户决策）：腾讯国际版 EdgeOne 实名认证不可行，用户选 Cloudflare Pages"
  - "SITE_URL 单源修正为 https://little-utils.pages.dev，canonical/og:url/sitemap/robots 四消费方线上 curl 验证同步"
  - "check:all 链序修正：check:chunks/check:dist 移至 build-only 之后（CI 无存量 dist 的 clean-env 正确性）"
metrics:
  duration: 90min # 含两轮人工 checkpoint（建仓/控制台配置 + 终局验收决策）
  completed: 2026-09-09
status: complete
actuals:
  tokens: 250    # chars/4 over realized code diff（site.ts 4 行 + package.json 1 行）
  tasks: 3
  commits: 2
---

# Phase 3 Plan 03: 部署管线与公网验收——GitHub/Cloudflare Pages 上线 + SITE_URL 闭环 Summary

**One-liner:** check:all 门禁链接上 GitHub + Cloudflare Pages 实现推 main 即部署（SC-5），SITE_URL 单源修正为生产域名 little-utils.pages.dev 并经公网 curl 验证 canonical/og:url/sitemap/robots 四消费方闭环——零代码新增，仅一处常量换源即完成全球可达上线。

## What Was Done

- **Task 1（human-verify checkpoint）**：GitHub 新建公开仓 `AsakiOvO/little-utils`；部署平台控制台配置（平台见 Deviation 1——最终为 Cloudflare Pages：构建命令 `pnpm check:all`、输出目录 `dist`、环境变量 NODE_VERSION/PNPM_VERSION 显式指定替代 EdgeOne 的 Node 版本选择器，Pitfall 6 防线等效落地）。回填仓库 URL 与分配域名 `little-utils.pages.dev`。
- **Task 2（auto）**：
  - `src/config/site.ts` SITE_URL 由占位值修正为 `https://little-utils.pages.dev`（D-11 单源换源，commit 7ae5b53）。
  - 本地预检 `build-only && check:dist` 过门后配置 remote origin 并推送 main，触发平台自动构建部署（SC-5）。
  - 公网 curl 三连验收全绿：工具页 `<title>JSON 格式化 - little-utils</title>` 计数 1（SC-1）；sitemap.xml `<loc>` 计数 3（/ + 两工具路由，SC-2）；robots.txt `Sitemap: https://little-utils.pages.dev/sitemap.xml` 行计数 1。
  - prohibitions 核查：`test ! -f .nvmrc` ✓；`git ls-files dist` 为空 ✓（仓库不存产物，T-03-04）。
- **Task 3（human-verify checkpoint）**：用户终局决策 **SKIP** Google Search Console / 百度站长平台 sitemap 提交（D-04）——登记为 deferred item（见下），站点已上线且 sitemap.xml/robots.txt 公网有效，后续随时可执行提交。SC-5 已由 Task 2 push → 自动构建部署日志实证。

## Deviations from Plan

### [Rule 4 - Architectural] 部署平台 EdgeOne Pages → Cloudflare Pages

- **Found during:** Task 1 人工 checkpoint
- **Issue:** 腾讯国际版 EdgeOne（EdgeOne Makers）账号实名认证流程对当前用户不可行，无法完成项目创建。
- **Resolution:** 向用户呈现选项后，用户选定 **Option A：换用 Cloudflare Pages**。D-14/D-15 控制台步骤重新映射到 Cloudflare：构建命令 `pnpm check:all`（全门禁链不变，T-03-04 缓解等效）、输出目录 `dist`、以 `NODE_VERSION` / `PNPM_VERSION` 环境变量替代 EdgeOne 的 Node 版本选择器（T-03-07 缓解等效）。
- **不变项:** SITE_URL 单源机制（D-11/D-12）完全未受影响——换源仅 `src/config/site.ts` 一处常量 + 重部署，四消费方（canonical/og:url/sitemap/robots）线上 curl 验证同步为真实域名，D-12 换源机制首次真实验证通过。
- **Files modified:** src/config/site.ts（域名值）、无代码架构改动
- **Commit:** 7ae5b53

### Auto-fixed Issues

**[Rule 3 - Blocking] check:all 链序修正——产物校验移至 build-only 之后**

- **Found during:** Task 2 推送前 CI clean-env 验证
- **Issue:** 原 `check:chunks → build-only → check:dist` 链序在 CI 无存量 dist 的干净环境中，check:chunks 在 build-only 之前执行会因 dist 不存在而失败——本地手头有 dist 时不可复现的顺序缺陷。
- **Fix:** check:all 重排为 `test:unit:run → type-check → lint → build-only → check:chunks → check:dist`（8f8a17d）。
- **Files modified:** package.json
- **Commit:** 8f8a17d

### User Decisions

**[Deferred] D-04 sitemap 搜索引擎提交——用户决定 SKIP**

- Google Search Console 与百度站长平台的 sitemap 提交由用户明确决定跳过。
- 已登记 deferred-items.md：提交动作随时可重做（前置条件已满足——SITE_URL 为终态生产域名，占位域名计数 = 0，sitemap.xml/robots.txt 公网可达）。非 abort：站点上线与全部自动化验收均为绿。
- 与计划 prohibition 第 1 条一致：占位值状态下禁止提交；现在跳过提交同样不产生 Pitfall 2 的收录污染。

## Deferred Items

| Item | Reason | Condition to Execute |
|------|--------|---------------------|
| D-04 sitemap 提交（Google Search Console + 百度站长平台） | 用户决定 SKIP（本 plan Task 3 checkpoint） | 随时可执行；URL = https://little-utils.pages.dev/sitemap.xml |
| D-20 大陆无代理实测 | 按计划 D-20 拆分口径显式挂起，不阻塞本阶段 | 自定义域名绑定后执行（大陆网络无代理打开首页与任一工具页，D-19） |

两项已同步登记至 `.planning/phases/03-seo/deferred-items.md`。

## Verification Evidence

- 公网 curl 三连（self-check 复跑）：SC-1 title 计数 1 ✓、SC-2 `<loc>` 计数 3 ✓、robots Sitemap 行计数 1 ✓
- `curl -sS https://little-utils.pages.dev/` 返回真实预渲染 HTML（`lang="en" class="dark"` + FOUC 阻塞脚本，D-05 保持）✓
- `git remote -v` = `git@github.com:AsakiOvO/little-utils.git` ✓
- `test ! -f .nvmrc` ✓；`git ls-files dist` 为空 ✓
- SC-5：push main → Cloudflare Pages 自动构建部署成功（Task 2 实证）✓
- 零新增 npm 依赖（T-03-SC）✓

## Known Stubs

无。

## Threat Flags

无新增信任面。T-03-04（构建链不被绕过：平台构建命令 = check:all 全链 + 仓库零 dist）、T-03-07（版本错配：NODE_VERSION/PNPM_VERSION 显式环境变量 + 无 .nvmrc）、T-03-SC（零新增包）均按 threat_model disposition 落地。T-03-06（占位域名进搜索引擎）因 D-04 SKIP 而天然规避。

## Self-Check: PASSED

- 提交存在：7ae5b53（SITE_URL 修正）、8f8a17d（check:all 链序修正）均在 main ✓
- 03-03-SUMMARY.md 已创建于 phase 目录 ✓
- 线上可达：curl 三连全绿（见 Verification Evidence）✓
