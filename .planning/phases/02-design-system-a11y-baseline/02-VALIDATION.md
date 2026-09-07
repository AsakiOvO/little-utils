---
phase: "2"
slug: "design-system-a11y-baseline"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-07"
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.10 + happy-dom（Phase 1 既有基建，86 测试） |
| **Config file** | `vitest.config.ts`（既有；测试文件就近 `*.test.ts` 布局） |
| **Quick run command** | `corepack pnpm vitest run <changed *.test.ts>` |
| **Full suite command** | `corepack pnpm vitest run` |
| **Estimated runtime** | ~10 seconds |

辅助卡口（非 vitest）：`corepack pnpm type-check`（vue-tsc）、`corepack pnpm lint`、`corepack pnpm build && corepack pnpm check:chunks`（首包 CM 泄漏断言——CodeMirror 双主题模块必须留在 json-formatter 工具目录内）。

---

## Sampling Rate

- **After every task commit:** Run `corepack pnpm vitest run <changed tests>` + `corepack pnpm type-check`
- **After every plan wave:** Run `corepack pnpm vitest run`（全量）
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 由 planner 按 PLAN.md 任务回填 | — | — | STYL-01 | — | N/A | unit（对比度断言） | `corepack pnpm vitest run src/styles/contrast.test.ts` | ❌ W0 | ⬜ pending |
| 由 planner 按 PLAN.md 任务回填 | — | — | STYL-03 | — | N/A | unit（reduced-motion 规则断言） | `corepack pnpm vitest run`（base.css 规则断言） | ❌ W0 | ⬜ pending |
| 由 planner 按 PLAN.md 任务回填 | — | — | SITE-04 | — | N/A | unit（useThemeMode 三态/持久化） | `corepack pnpm vitest run`（composable 测试） | ❌ W0 | ⬜ pending |
| 由 planner 按 PLAN.md 任务回填 | — | — | SITE-05 | — | N/A | unit（16px/44px 组件断言） | `corepack pnpm vitest run`（六件套测试） | ❌ W0 | ⬜ pending |
| 由 planner 按 PLAN.md 任务回填 | — | — | STYL-01 | — | N/A | build 卡口 | `corepack pnpm build && corepack pnpm check:chunks` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/styles/contrast.test.ts`（或 planner 指定的色值常量模块测试）— D-20 对比度断言 stubs：24 个起点色对 ≥4.5:1（UI-SPEC 已实跑预验证，预期一次通过）
- [ ] `src/composables/useThemeMode.test.ts` — 三态循环/持久化/实时联动 stubs（happy-dom 下 matchMedia 需 mock）

*其余为既有基建覆盖，无需新装框架。*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 手机完整走一遍 JSON 格式化工具（输入→格式化→复制），输入不触发 iOS 缩放、触控目标可准确点按 | SITE-05 | 需真机/设备模拟的触控与聚焦行为，happy-dom 无法模拟 | 浏览器设备模拟（375px）或真机访问 dev server，走完 JSON 工具流程 |
| 系统开启"减少动态效果"后动画/过渡自动降级 | STYL-03 | 需切换 OS 级偏好设置 | 系统设置开启 Reduce Motion → 刷新站点 → 验证 hover/过渡为瞬时 |
| 系统深浅色切换时跟随态实时联动 | SITE-04 | 依赖 OS 级 prefers-color-scheme 实时变化 | 跟随系统态下切换系统外观 → 页面立即变主题 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
