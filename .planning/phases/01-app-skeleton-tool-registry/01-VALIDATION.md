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

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 由 gsd-planner 填充（计划创建后映射到具体任务） | 01 | 1 | ARCH-01 | — | 注册表派生路由完整性 | unit | `pnpm vitest run tests/registry.spec.ts` | ❌ W0 | ⬜ pending |
| 由 gsd-planner 填充 | 01 | 1 | TOOL-01 | T-01 (XSS) | JSON 大数精度保护 | unit | `pnpm vitest run tests/json-tokenizer.spec.ts` | ❌ W0 | ⬜ pending |
| 由 gsd-planner 填充 | 01 | 1 | ARCH-04 | T-01 (XSS) | 消毒管线中和脚本载荷 | unit | `pnpm vitest run tests/sanitize.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] vitest + @vue/test-utils 安装（随脚手架 Wave 0 建立）
- [ ] `tests/` 目录与 vitest.config.ts
- [ ] JSON tokenizer 测试集（长整数 ID ≥ 2^53 用例，见 01-RESEARCH.md）
- [ ] sanitize 管线测试集（`<script>`/`<img onerror>` 载荷用例）

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
