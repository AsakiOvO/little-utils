---
phase: 03-seo
fixed_at: 2026-10-28T19:15:00+08:00
review_path: .planning/phases/03-seo/03-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 03: Code Review Fix Report

**Fixed at:** 2026-10-28T19:15:00+08:00
**Source review:** .planning/phases/03-seo/03-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 2 (fix_scope=critical_warning；6 个 Info 项不在本轮范围)
- Fixed: 2
- Skipped: 0

**Verification environment (#2825):** 所有验证均在隔离 worktree
（`.codebuddy/worktrees/rf-03-27661-*`，分支 `gsd-reviewfix/03-27661`）内运行：
worktree 内独立 `pnpm install --frozen-lockfile`、全新 `build-only` 产出 dist 后
运行修复版 `check:dist`，并跑完整测试套件与 type-check。数字可从该 worktree
状态复现（worktree 合并回 main 后即从 main 复现）。

## Fixed Issues

### WR-01: ext-link 断言的 SITE_URL 前缀判定可被子域绕过

**Files modified:** `scripts/check-dist.mjs`
**Commit:** 232a9fa
**Applied fix:**
- 新增 `SITE_ORIGIN`（`new URL(SITE_URL).origin`，模块顶层解析一次）与
  `isSiteUrl(v)` 辅助函数：`try { return new URL(v).origin === SITE_ORIGIN } catch { return false }`。
- `checkExternalValue` 中 `if (!v.startsWith(SITE_URL))` 替换为 `if (!isSiteUrl(v))`——
  子域仿冒（`https://little-utils.pages.dev.evil.com/track.js`）与明文 http 降级
  （`http://little-utils.pages.dev/...`）均被正确拒绝；同源 URL（含 `#fragment`）放行。
- 同步更新脚本头部 [ext-link] 说明注释。
- 修复属于审查建议的适配版：`new URL(SITE_URL)` 从函数内每次解析提升为模块顶层
  单次解析（SITE_URL 为常量），行为等价、避免重复解析。

### WR-02: check-dist [meta] 门禁未覆盖 canonical / og:url 的存在性

**Files modified:** `scripts/check-dist.mjs`
**Commit:** f07eeb1
**Applied fix:**
- 工具页循环内追加两条断言（期望值均为 `SITE_URL + tool.path`，D-12 单源）：
  - canonical：两种属性顺序都匹配（`rel` 在前 / `href` 在前），
    缺失或不等即 `VIOLATION [meta]`。
  - og:url：`<meta property="og:url" content="...">`，缺失或不等即 `VIOLATION [meta]`。
- 同步更新脚本头部 [meta] 说明注释。
- **范围说明：** finding 标题还提到 og:title / og:description，但审查 Fix 段仅给出
  canonical / og:url 两条断言——刻意回避了 IN-02 指出的实体转义不对称问题
  （og:title/og:description 与 `tool.name`/`tool.description` 直接比较会在内容含
  `&`/`"` 时假阳性）。按 Fix 段落地，og:title/og:description 留待 IN-02 一并处理。
- 正/负双向验证：真实产物上门禁通过；临时删除产物中 canonical 后门禁报
  `VIOLATION [meta]: json-formatter canonical 缺失...` 且 exit 1，恢复后重新通过。

## Skipped Issues

None — 全部 in-scope findings 均已修复。

## Verification

- `node --check scripts/check-dist.mjs`：两个 commit 均通过
- 隔离 worktree 内全新 `corepack pnpm run build-only` + `node scripts/check-dist.mjs`：
  `OK: dist checks pass (meta/sitemap/ext-link/gzip)`
- `corepack pnpm run test:unit:run`：194/194 passed（19 files）
- `corepack pnpm run type-check`（vue-tsc --build）：通过
- WR-01 边界用例单测（node 内联）：子域仿冒 / 明文 http 拒绝，同源 URL 放行
- WR-02 负向测试：删除 canonical → 门禁 exit 1；恢复 → 重新通过

---

_Fixed: 2026-10-28T19:15:00+08:00_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
