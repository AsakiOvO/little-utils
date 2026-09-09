---
phase: "3"
slug: "seo"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-09"
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.10 + happy-dom（Phase 1 既有基建，172 测试） |
| **Config file** | vitest.config.ts |
| **Quick run command** | `corepack pnpm vitest run <changed *.test.ts> && corepack pnpm type-check` |
| **Full suite command** | `corepack pnpm vitest run && corepack pnpm type-check && corepack pnpm lint && corepack pnpm build && corepack pnpm check:chunks` |
| **Estimated runtime** | ~60–120 seconds（unit ~15s + build 预渲染 3 页 + 产物断言） |

---

## Sampling Rate

- **After every task commit:** Run `corepack pnpm vitest run <changed *.test.ts> && corepack pnpm type-check`
- **After every plan wave:** Run full suite（含 build + 产物层断言脚本）
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | ARCH-03 | T-03-01/T-03-SC | meta 注入经 unhead 白名单字段，无用户输入内插（A4 fail-first tracer） | 产物断言 | `corepack pnpm build-only && test "$(grep -c '<title>JSON 格式化 - little-utils</title>' dist/json-formatter.html)" = "1" && test "$(grep -c 'property="og:title"' dist/json-formatter.html)" = "1" && corepack pnpm type-check` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | ARCH-03 | T-03-01 | 首页全角 title 防双后缀 + D-10 description；timestamp-converter 接入 | 产物断言 | `corepack pnpm build-only && test "$(grep -c '<title>little-utils — 开发者 &' dist/index.html)" = "1" && test "$(grep -c '办公工具箱 - little-utils' dist/index.html)" = "0" && corepack pnpm type-check` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | ARCH-03 | T-03-05 | 404 预渲染 noindex + 暗色基线不破坏 | 产物断言 | `corepack pnpm build-only && test -f dist/404.html && test "$(grep -c 'noindex' dist/404.html)" -ge 1 && test "$(grep -c 'class="dark"' dist/index.html)" -ge 1` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | ARCH-03 | T-03-02 | sitemap/robots 生成器实体转义 + 协议最小集（TDD） | 纯函数单测 | `corepack pnpm vitest run src/seo/index.test.ts && corepack pnpm type-check` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | ARCH-03 | T-03-02 | onFinished 产物落盘：3 loc 无 404、robots Sitemap 行 = SITE_URL 派生 | 产物断言 | `corepack pnpm build-only && test "$(grep -c '<loc>' dist/sitemap.xml)" = "3" && grep -q '^Sitemap: https://little-utils.edgeone.app/sitemap.xml$' dist/robots.txt` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 2 | ARCH-03+05 | T-03-03/T-03-04 | check-dist 四类断言（meta/sitemap 一致/零外链/gzip 200KB）进门禁链 | 产物断言脚本 | `corepack pnpm build-only && corepack pnpm check:dist`（fails_when: VIOLATION/FAIL:/exit 1） | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 3 | ARCH-05 | T-03-04/T-03-07 | 建仓 + 控制台全门禁链配置（check:all/Node 24.18.0/dist） | human-check（blocking checkpoint） | —（Task 1 resume-signal: "done" + 仓库 URL/域名回填） | — | ⬜ pending |
| 03-03-02 | 03 | 3 | ARCH-05 | T-03-06 | SITE_URL 修正 + 推 main 自动部署 + 公网 curl 验收（SC-1/SC-2/SC-3a） | 部署后 curl | `curl -fsS https://<DEPLOY_DOMAIN>/json-formatter \| grep -c '<title>JSON 格式化 - little-utils</title>'` 等（Task 1 域名回填后执行，fails_when: 401 须先排除大陆误测） | ❌ W0 | ⬜ pending |
| 03-03-03 | 03 | 3 | ARCH-05 | T-03-06 | D-04 sitemap 提交（排 SITE_URL 修正后）+ D-20 大陆实测挂起登记 | human-check（终局 checkpoint） | —（Task 3 resume-signal: "done"） | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

> planner 回填 2026-09-09：9 任务全覆盖（Wave 1/2/3）；产物层断言按 RESEARCH §Validation Architecture 落位 check-dist（03-02-03）；「组件单测（useToolSeo/home meta）」落点调整为产物层断言（mock unhead 无增量防护，见 03-02-PLAN flagged_assumptions）；manual-only 项（大陆实测/sitemap 提交/控制台配置）集中于 plan 03 两个 checkpoint。

---

## Wave 0 Requirements

- [ ] `scripts/` 产物断言脚本（若走独立脚本而非 vitest 产物测试）— stubs + 失败方向（`<fails_when>`）
- [ ] `corepack pnpm build` 产物可用性（vitest 产物层测试依赖 dist 存在——沿用 Phase 2 02-02 build+grep 先例）

*Existing infrastructure covers framework needs（vitest/happy-dom/测试就近布局已就绪）。*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 大陆无代理网络实测打开站点 | ARCH-05 (SC-3) | 实测环境只有作者具备；且默认域名大陆不可达（research Pitfall 1）——D-20 拆分验收：**挂起至自定义域名绑定后**，不阻塞本阶段 | 自定义域名绑定后在大陆网络（无代理）打开首页与工具页（CONTEXT.md D-19/D-20） |
| 站长平台提交 sitemap | ARCH-05 (SC-2 收录动作) | 需作者账号操作 | 部署成功后人工向 Google Search Console / 百度站长平台提交 sitemap（CONTEXT.md D-04） |
| EdgeOne 控制台配置 | ARCH-05 | 平台控制台操作，无法代码化 | 绑定 GitHub 仓、配置构建命令链、确认产物目录 dist（CONTEXT.md D-13/D-14/D-15） |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
