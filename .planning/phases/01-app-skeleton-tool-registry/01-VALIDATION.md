---
phase: "1"
slug: "app-skeleton-tool-registry"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-04"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (per 01-RESEARCH.md — Vue 3 + Vite 8 生态标准) |
| **Config file** | none — Wave 0 installs (vitest.config.ts + vite scaffold 同批建立) |
| **Quick run command** | `pnpm vitest run --reporter=dot` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run --reporter=dot`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

> 由 gsd-planner 于计划创建时填充（2026-09-04）。测试文件为**同目录共置**形态（`src/**/*.test.ts`，遵循 01-RESEARCH.md Recommended Project Structure 与 create-vue vitest 默认），非 `tests/*.spec.ts`。所有命令经 `corepack pnpm`（本机 pnpm alias 损坏，RESEARCH Environment Availability 已验证）。

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-T2 | 01-01 | 1 | ARCH-01 | T-01-04 | 注册表不变量 + 派生路由完整性（404 置尾、空注册表合法） | unit | `corepack pnpm vitest run src/tools/registry.test.ts src/router/routes.test.ts` | ❌ plan 创建 | ⬜ pending |
| 01-01-T3 | 01-01 | 1 | ARCH-01 | — | ToolCard 消费注册表元数据（icon 组件引用） | component | `corepack pnpm vitest run src/components/ToolCard.test.ts` | ❌ plan 创建 | ⬜ pending |
| 01-02-T2 | 01-02 | 2 | TOOL-02 | T-01-07 | 时间戳双向转换 + 秒/毫秒识别边界（结果回显防错判） | unit | `corepack pnpm vitest run src/tools/timestamp-converter/timestamp-converter.service.test.ts` | ❌ plan 创建 | ⬜ pending |
| 01-02-T3 | 01-02 | 2 | 成功标准#4 | T-01-06 | useCopy 复制状态与 legacy 降级 | component | `corepack pnpm vitest run src/composables/useCopy.test.ts` | ❌ plan 创建 | ⬜ pending |
| 01-03-T1 | 01-03 | 2 | ARCH-04 | T-01-01 | 消毒管线中和 script/onerror/javascript: 载荷（含无 DOM 退化） | unit | `corepack pnpm vitest run src/utils/sanitize.test.ts` | ❌ plan 创建 | ⬜ pending |
| 01-03-T2 | 01-03 | 2 | ARCH-04 | T-01-01 | SafeHtml 注入载荷无可执行节点 + ESLint 唯一出口卡口 | component + lint gate | `corepack pnpm vitest run src/ui/safe-html.test.ts && corepack pnpm lint` | ❌ plan 创建 | ⬜ pending |
| 01-04-T1 | 01-04 | 3 | TOOL-01 | T-01-01 | JSON tokenizer 大数保真/往返/键序/行列定位 | unit（属性化用例） | `corepack pnpm vitest run src/tools/json-formatter/json-formatter.service.test.ts` | ❌ plan 创建 | ⬜ pending |
| 01-04-T2 | 01-04 | 3 | TOOL-01 | T-01-01 | 全套回归（双工具 + 契约 + 消毒） | full suite | `corepack pnpm vitest run && corepack pnpm type-check` | ❌ plan 创建 | ⬜ pending |
| 01-04-T3 | 01-04 | 3 | ARCH-02 | T-01-11 | 分包卡口：首包无 CodeMirror + 工具独立 chunk + 预渲染页存在 | build gate | `corepack pnpm build && node scripts/check-chunks.mjs` | ❌ plan 创建 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] vitest + @vue/test-utils 安装（随 Plan 01-01 脚手架任务建立）
- [x] vitest.config.ts（Plan 01-01 Task 1；environment: happy-dom，A4 回退注释）
- [x] JSON tokenizer 测试集（长整数 ID ≥ 2^53 用例，Plan 01-04 Task 1 `<behavior>`）
- [x] sanitize 管线测试集（`<script>`/`<img onerror>` 载荷用例，Plan 01-03 Task 1 `<behavior>`）

*全部随计划任务建立，不单列 Wave 0。*

*若计划已含脚手架任务则随计划建立，不单列 Wave 0。*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 移动端输入不缩放/触控可用 | SITE-05（Phase 2 主责） | 需真机/DevTools 视觉确认 | 手机或 DevTools 设备模拟走查工具页 |
| 暗色底霓虹令牌视觉效果 | D-04 | 主观视觉判断 | 打开首页/工具页人工目检 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
