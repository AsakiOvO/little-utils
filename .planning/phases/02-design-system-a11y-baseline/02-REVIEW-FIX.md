---
phase: 02-design-system-a11y-baseline
fixed_at: 2026-09-08T19:31:04+08:00
review_path: .planning/phases/02-design-system-a11y-baseline/02-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-09-08T19:31:04+08:00
**Source review:** .planning/phases/02-design-system-a11y-baseline/02-REVIEW.md
**Iteration:** 1
**Fix scope:** critical_warning（IN-01/02/03 不在本次范围）

**Summary:**
- Findings in scope: 4
- Fixed: 4
- Skipped: 0

## Fixed Issues

### CR-01: 亮色模式下霓虹原语作文本色,对比度系统性不达标(1.15–2.71:1,违反 D-20 红线)

**Files modified:** `src/styles/tokens.css`, `src/styles/tokens.test.ts`, `src/components/ToolCard.vue`, `src/pages/not-found.vue`, `src/ui/Tabs.vue`, `src/ui/CopyableText.vue`, `src/ui/Button.vue`, `src/layouts/home.layout.vue`, `src/tools/json-formatter/components/JsonTree.vue`, `src/tools/timestamp-converter/timestamp-converter.vue`, `src/ui/Tabs.test.ts`, `src/ui/CopyableText.test.ts`, `src/ui/Button.test.ts`
**Commit:** c442679
**Applied fix:**

1. **根因落地（Fix 1）**:`tokens.css` 在 `.dark` 之前的 `:root` 块声明 D-07 深霓虹三色 `--color-neon-{cyan,magenta,yellow}-deep`（与 `tokens.ts` light 组逐字一致）+ 三个 accent 语义角色（亮色 = `*-deep` 引用）；`.dark` 块覆盖 accent 系列 = 原语引用。声明置于 `.dark` 之前,遵守文件内「同特异性靠源顺序」纪律。deep 值在 `tokens.ts` 已备好,无需改 TS。
2. **消费点切换（Fix 2）**:审查上表全部「文本/选中/反馈」类用法改经 `var(--color-accent)`（cyan）或 `var(--color-accent-magenta)` / `var(--color-accent-yellow)`（品红/黄文本消费点）:ToolCard 图标 + NEW 徽章（文本+徽章描边一体）、not-found「404」大字 + hover 青字、Tabs 活动 tab 选中态（指示条+文字一体）、CopyableText 成功态反馈 + hover 青字 + 「已复制」反馈文本、Button hover 青字、home.layout 品牌 logo（D-08 豁免在亮色语境下重新裁定:logo 为真实文本非装饰,改经 accent;glow 阴影为装饰非文本,保留）。
3. **交叉检索的清单外同根因消费点一并修复**（审查 Issue 已登记）:JsonTree（JSON 键青字/数字黄字/布尔与 null 及精度徽章品红）、timestamp-converter（识别回显黄字、两处错误卡品红边框、三处复制按钮成功态/hover 青字）。
4. **范围裁定**:hover/focus 独立描边、焦点环（`--color-focus`）等非文本用途保持原语,按审查 Fix 第 2 点「边框/大字按用途在 UI-SPEC 里逐项裁定」留给后续裁定;NOT 改 cm-theme.ts（其经 TS 常量分流,亮色已用 deep,不涉 CSS 变量）。
5. **同步断言收口**:`tokens.test.ts` 增补 deep 三色逐字同步断言 + accent 模式分流/源顺序断言。
6. 受影响组件测试断言同步为 accent（Tabs/CopyableText/Button）。

**备注:** 本 finding 涉及对比度逻辑与模式分流,已通过新增 12 组 accent 色对单测数值化验证（见 WR-03）,建议开发者对亮/暗两模式做一次目视抽验。

### WR-01: Input.vue 的 `:id` 位于 `v-bind="$attrs"` 之前,消费方传 id 会静默打断 label 关联

**Files modified:** `src/ui/Input.vue`, `src/ui/Input.test.ts`
**Commit:** 699b0bc
**Applied fix:** textarea 与 input 两处将组件持有的 `:id="id"` 移到 `v-bind="$attrs"` 之后（mergeProps 后者胜 → 组件 id 恒胜出）,与头注释「id/value/aria 由组件持有,置于 $attrs 之后确保不被覆盖」一致;`rows="4"` 按审查 Fix 示例保持组件持有。补充契约用例:attrs 透传 `id="consumer-id"` 时,input/textarea 双变体控件 id 均不为 consumer-id 且 `label[for]` 仍指向控件。

### WR-02: home.layout.vue 用 `<nav>` 包裹非导航文案,产生空导航地标

**Files modified:** `src/layouts/home.layout.vue`
**Commit:** ea1c76f
**Applied fix:** `<nav class="text-sm text-[var(--color-text-muted)]">开发者 & 办公工具箱</nav>` 改为无地标语义的 `<span>`（类名不变）,附注释说明理由（无链接副标题非导航区块,避免屏幕阅读器空地标误播报）。

### WR-03: 对比度守卫存在消费层盲区(CR-01 类回归无自动化防线)

**Files modified:** `src/styles/tokens.test.ts`, `src/ui/Tabs.test.ts`, `src/ui/CopyableText.test.ts`, `src/components/ToolCard.test.ts`
**Commit:** 127a00b
**Applied fix:** ① `tokens.test.ts` 新增「accent 语义角色色对 ≥4.5:1」describe:accent 系列三色 × 亮（=deep）/暗（=原语）× bg/surface 共 12 组色对断言,显式守卫 accent 实际指向值的对比度;② 关键消费者源码级断言（沿 Tabs.test.ts:103 先例）:Tabs tab 文本禁直连原语、CopyableText 按钮/反馈文本消费 accent 且不含原语、ToolCard 图标/徽章消费 accent(-magenta) 且任何 span 禁原语文本类（正向+负向回归防线）。

## Skipped Issues

None — 所有范围内 finding 均已修复。

## Verification

**运行位置:** 隔离 worktree（`.codebuddy/worktrees/rf-02-26473-1788865844`,分支 `gsd-reviewfix/02-26473`,内含完整 `pnpm install` 依赖）——以下数字可由 fast-forward 后的主 checkout（同提交内容）复现。

- **vitest 全量:** 18 test files / **190 tests passed**（含新增 accent 色对 12 组 + 消费层守卫 + Input 契约用例）
- **type-check（vue-tsc --build）:** exit 0
- **lint（oxlint + eslint）:** 0 warnings, 0 errors, exit 0

## 提交清单

| Finding | Commit | 文件数 |
|---|---|---|
| CR-01 | c442679 | 13 |
| WR-01 | 699b0bc | 2 |
| WR-02 | ea1c76f | 1 |
| WR-03 | 127a00b | 4 |

---

_Fixed: 2026-09-08T19:31:04+08:00_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
