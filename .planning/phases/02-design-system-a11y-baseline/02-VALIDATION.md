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
| 02-01 T1 三层令牌重构（tokens.css/tokens.ts/tokens.test.ts） | 02-01 | 1 | STYL-01 | T-02-01/T-02-02 | 色值单点同步断言（改色即红，D-20）；语义层消费契约注释（D-09） | unit（对比度算法+锚点+同步断言） | `corepack pnpm vitest run src/styles/tokens.test.ts && corepack pnpm type-check` | ❌ 自建（tokens.test.ts 任务内创建） | ⬜ pending |
| 02-01 T2 base.css 全局基线（16px/reduced-motion/焦点环/瞬切） | 02-01 | 1 | STYL-03, SITE-05 | T-02-02 | 焦点环经组件层 --color-focus 消费（不直连原语，D-09） | unit（CSS 内容断言） | `corepack pnpm vitest run src/styles/base-rules.test.ts && corepack pnpm type-check` | ❌ 自建（base-rules.test.ts 任务内创建） | ⬜ pending |
| 02-02 T1 useThemeMode 三态状态机 | 02-02 | 1 | SITE-04 | T-02-03 | normalize 白名单归一（脏值→auto，Pitfall 7）；SSG 守卫 | unit（composable 状态机） | `corepack pnpm vitest run src/composables/useThemeMode.test.ts && corepack pnpm type-check` | ❌ 自建（useThemeMode.test.ts 任务内创建） | ⬜ pending |
| 02-02 T2 ThemeToggle 组件 + 双 layout 挂载 | 02-02 | 1 | SITE-04 | T-02-03 | aria-label 三态文案；图标 aria-hidden（零注入面） | component | `corepack pnpm vitest run src/ui/ThemeToggle.test.ts && corepack pnpm type-check` | ❌ 自建（ThemeToggle.test.ts 任务内创建） | ⬜ pending |
| 02-02 T3 FOUC 内联脚本 + 预渲染默认暗色类 + 镜像断言 | 02-02 | 1 | SITE-04 | T-02-04 | head 脚本白名单挂类（无注入面）；镜像断言防判定漂移（Pitfall 1） | build 卡口 + unit | `corepack pnpm build && corepack pnpm check:chunks && grep -c "little-utils:v1:theme" dist/index.html && grep -c "class=\"dark\"" dist/index.html && corepack pnpm vitest run src/composables/useThemeMode.test.ts` | ✅（useThemeMode.test.ts 同计划 T1 已建；build/check:chunks 既有） | ⬜ pending |
| 02-03 T1 Button 组件（variant/44px/disabled） | 02-03 | 2 | SITE-05, STYL-03 | T-02-05 | 文本插值渲染（零 v-html） | component | `corepack pnpm vitest run src/ui/Button.test.ts && corepack pnpm type-check` | ❌ 自建（Button.test.ts 任务内创建） | ⬜ pending |
| 02-03 T2 Input 组件（textarea/label/v-model/错误态） | 02-03 | 2 | SITE-05, STYL-03 | T-02-05 | 错误文案零内置（调用方传入）；插值渲染 | component | `corepack pnpm vitest run src/ui/Input.test.ts && corepack pnpm type-check` | ❌ 自建（Input.test.ts 任务内创建） | ⬜ pending |
| 02-03 T3 Card 组件（as/padding） | 02-03 | 2 | STYL-03 | T-02-05 | attrs 透传渲染（零 v-html） | component | `corepack pnpm vitest run src/ui/Card.test.ts && corepack pnpm type-check` | ❌ 自建（Card.test.ts 任务内创建） | ⬜ pending |
| 02-04 T1 CopyableText（useCopy 封装 + 三态反馈） | 02-04 | 2 | SITE-05 | T-02-06 | 展示区全插值转义（禁 v-html，RESEARCH V5） | component | `corepack pnpm vitest run src/ui/CopyableText.test.ts && corepack pnpm type-check` | ❌ 自建（CopyableText.test.ts 任务内创建） | ⬜ pending |
| 02-04 T2 Tabs（roving tabindex + 方向键） | 02-04 | 2 | SITE-05 | T-02-06 | 面板 hidden 属性隐藏（非 opacity，屏幕阅读器可达） | component | `corepack pnpm vitest run src/ui/Tabs.test.ts && corepack pnpm type-check` | ❌ 自建（Tabs.test.ts 任务内创建） | ⬜ pending |
| 02-05 T1 cm-theme 双主题 + CodeMirrorJson Compartment 切换 | 02-05 | 2 | STYL-01, SITE-04 | T-02-09 | cm-theme 留在工具目录（懒加载边界，ARCH-02） | type-check + 回归 | `corepack pnpm type-check && corepack pnpm vitest run` | ✅（既有 86+ 测试；tokens.ts 由 02-01 提供） | ⬜ pending |
| 02-05 T2 oneDark 死依赖移除 + 构建卡口复跑 | 02-05 | 2 | STYL-01 | T-02-SC | 仅 `corepack pnpm remove`；禁止 pnpm update（lockfile 现状纪律） | build 卡口 | `corepack pnpm build && corepack pnpm check:chunks` | ✅（check-chunks.mjs 既有） | ⬜ pending |
| 02-06 T1 ToolCard 迁移（Card as=RouterLink） | 02-06 | 3 | STYL-03 | T-02-10 | 静态元数据插值（消毒管线不变） | component 回归 | `corepack pnpm vitest run src/components/ToolCard.test.ts && corepack pnpm type-check` | ✅（ToolCard.test.ts 既有，任务内适配） | ⬜ pending |
| 02-06 T2 home/not-found 迁移 + Typography 归一 | 02-06 | 3 | STYL-03 | T-02-10 | 空态文案锁定零改写；插值渲染 | regression | `corepack pnpm vitest run && corepack pnpm type-check` | ✅（既有全量） | ⬜ pending |
| 02-06 T3 双 layout 归一（品牌/footer/header 间距/返回键） | 02-06 | 3 | STYL-03 | T-02-10 | 布局归一零新增装饰；ThemeToggle 位置不动（D-03） | regression + lint | `corepack pnpm vitest run && corepack pnpm type-check && corepack pnpm lint` | ✅（既有全量） | ⬜ pending |
| 02-07 T1 json-formatter 迁移（Button/CopyableText/Card + danger 错误卡） | 02-07 | 4 | SITE-05 | T-02-11 | 全插值渲染（含 CopyableText 展示区禁 v-html） | regression | `corepack pnpm vitest run && corepack pnpm type-check && corepack pnpm lint` | ✅（既有全量） | ⬜ pending |
| 02-07 T2 阶段终局门禁 + D-23 手动验收（human-check） | 02-07 | 4 | SITE-05 | T-02-12（accept） | 五项自动门禁；人工抽验（iOS 流程/reduced-motion/系统联动/直开无闪烁） | 全量门禁 + human-check | `corepack pnpm vitest run && corepack pnpm type-check && corepack pnpm lint && corepack pnpm build && corepack pnpm check:chunks`（人工项见 02-07 T2 human-check 清单） | ✅（既有全量 + 构建链） | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

> 测试文件由 Wave 1 计划任务自建（就近 `*.test.ts`，非独立 stubs）；文件名已与 PLAN.md 对齐（2026-09-07 修订：contrast.test.ts → tokens.test.ts）。

- [ ] `src/styles/tokens.test.ts`（02-01 T1）— D-20 对比度断言：黑白锚点 21:1 + 双主题色对 ≥4.5:1 + tokens.css↔tokens.ts 同步断言（UI-SPEC 已实跑预验证，预期一次通过）
- [ ] `src/styles/base-rules.test.ts`（02-01 T2）— 16px 兜底 / reduced-motion 中和 / 焦点环 / .theme-switching 内容断言（SITE-05/STYL-03 自动化部分）
- [ ] `src/composables/useThemeMode.test.ts`（02-02 T1）— 三态循环/持久化/回落暗/实时联动（happy-dom 下 matchMedia 需 mock + vi.resetModules 重置单例）
- [ ] `src/ui/{Button,Input,Card,Tabs,CopyableText,ThemeToggle}.test.ts`（02-02 T2 / 02-03 / 02-04）— 组件行为 + a11y 属性断言（D-19/UI-SPEC backstop）
- [ ] matchMedia mock 注入模式（stubGlobal 先例 = useCopy.test.ts；随 02-02 T1 落地）

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
