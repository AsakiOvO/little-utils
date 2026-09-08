---
phase: 02-design-system-a11y-baseline
reviewed: 2026-09-08T11:07:15Z
depth: standard
files_reviewed: 37
files_reviewed_list:
  - .oxlintrc.json
  - eslint.config.ts
  - index.html
  - package.json
  - pnpm-lock.yaml
  - src/components/ToolCard.test.ts
  - src/components/ToolCard.vue
  - src/composables/useThemeMode.test.ts
  - src/composables/useThemeMode.ts
  - src/layouts/home.layout.vue
  - src/layouts/tool.layout.vue
  - src/pages/home.vue
  - src/pages/not-found.vue
  - src/styles/base-rules.test.ts
  - src/styles/base.css
  - src/styles/tokens.css
  - src/styles/tokens.test.ts
  - src/styles/tokens.ts
  - src/tools/json-formatter/components/CodeMirrorJson.vue
  - src/tools/json-formatter/components/cm-theme.ts
  - src/tools/json-formatter/json-formatter.vue
  - src/ui/Button.test.ts
  - src/ui/Button.vue
  - src/ui/Card.test.ts
  - src/ui/Card.vue
  - src/ui/CopyableText.test.ts
  - src/ui/CopyableText.vue
  - src/ui/Input.test.ts
  - src/ui/Input.vue
  - src/ui/Tabs.test.ts
  - src/ui/Tabs.vue
  - src/ui/ThemeToggle.test.ts
  - src/ui/ThemeToggle.vue
  - tsconfig.app.json
  - vite.config.ts
findings:
  critical: 1
  warning: 3
  info: 3
  total: 7
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-09-08T11:07:15Z
**Depth:** standard
**Files Reviewed:** 37
**Status:** issues_found

## Summary

对 Phase 02(设计系统 + a11y 基线)的 37 个变更文件做了标准深度审查:逐文件通读,并对主题状态机、FOUC 镜像脚本、tokens 单点同步、六件套契约做了跨文件追踪;用与 `tokens.test.ts` 完全相同的 WCAG 算法实测了疑点色对的对比度数值。

整体工程质量高:主题三态状态机的 detached-scope 修复与回归测试(用例⑦)、index.html 镜像脚本的防漂移文本断言、useStorage 白名单归一、CopyableText 的 aria-live 三态反馈都是教科书级的实现;未发现安全漏洞(无 secrets / eval / v-html / 注入面,index.html 内联脚本仅白名单布尔挂类)。

但存在一个系统性 BLOCKER:**亮色模式下,全站组件层仍把暗色血统的霓虹原语(`--color-neon-*`,L≈0.72–0.92)直接当作文本/选中/反馈色消费,实测对比度 1.15–2.71:1,远低于 D-20 的 4.5:1 红线**。tokens.ts 已备好达标的 D-07 深霓虹 `*-deep` 值,却只被 CodeMirror 主题(cm-theme.ts)消费——CSS 侧从未落地对应变量,DOM 组件层无法触达。现有测试(tokens.ts↔tokens.css 同步断言 + tokens.ts 常量色对)恰好绕开了「组件消费层」,这正是本 phase(名字就叫 a11y baseline)的核心验收面漏洞。另有 3 个 Warning、3 个 Info。

---

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: 亮色模式下霓虹原语作文本色,对比度系统性不达标(1.15–2.71:1,违反 D-20 红线)

**File:** 多文件(消费点见下表);根因在 `src/styles/tokens.css` + `src/styles/tokens.ts`
**Issue:**
tokens.css 的霓虹三色是「暗色血统原语」(cyan `oklch(0.85 0.16 195)`、magenta `oklch(0.72 0.24 330)`、yellow `oklch(0.92 0.19 105)`),声明在 `@theme` 全局层,`.dark` 块没有(也不需要)对它们做亮色适配。Phase 2 引入亮色模式后,所有把这些原语当**文本色**的组件在亮色下全部失效。用 tokens.test.ts 同款 WCAG 算法实测:

| 前景(原语) | vs 亮 bg(0.97) | vs 亮 surface(0.99) | 要求 |
|---|---|---|---|
| neon-cyan | **1.37:1** | **1.45:1** | 大字 3:1 / 正文 4.5:1 |
| neon-magenta | **2.55:1** | **2.71:1** | 正文 4.5:1 |
| neon-yellow | **1.15:1** | **1.21:1** | 正文 4.5:1 |
| 参照:`tokens.light['neon-cyan-deep']` | 7.59:1 | — | ✅ 达标 |
| 参照:`tokens.light['neon-magenta-deep']` | — | 9.78:1 | ✅ 达标 |

本清单内消费点(亮色下全部不达标):

- `src/components/ToolCard.vue:11`(卡片图标青字)、`:16`(**NEW 徽章:12px 品红小字,2.71:1**)
- `src/pages/not-found.vue:4`(60px "404" 青字,1.37:1 < 大字 3:1)、`:11`(hover 青字)
- `src/ui/Tabs.vue:35`(**活动 tab 14px 青字 1.45:1** —— 用户当前所在位置指示)
- `src/ui/CopyableText.vue:23-24`(复制成功态/hover 青字)、`:73`(**「已复制」14px 青字** —— 成功反馈本身看不清)
- `src/ui/Button.vue:42`(hover 青字 1.45:1)
- `src/layouts/home.layout.vue:9`(品牌 logo 青字 1.37:1;有 D-08「既有用法保留」注释,但该豁免裁定于暗色-only 的 Phase 1,Phase 2 引入亮色后属于豁免范围未更新,需重新裁定)

交叉检索发现的清单外同根因消费点(不在本次 files 列表,仅登记):`src/tools/json-formatter/components/JsonTree.vue:28-62`(JSON 键青字/串品红/值黄字,14px)、`src/tools/timestamp-converter/timestamp-converter.vue` 多处(选中态青字、输出黄字、错误边框品红)。

**根因:** tokens.ts 已按 D-07 备好亮色达标值 `neon-*-deep`(tokens.test.ts 也已断言其对 bg ≥4.5:1),但 **tokens.css 从未声明 `--color-neon-*-deep`(或语义 accent)变量**——`*-deep` 全仓库唯一消费方是 cm-theme.ts(编辑器语法高亮)。DOM 组件层在结构上无法消费达标色,只能继续用不达标原语。测试网恰好漏掉这一层:同步断言只盯 tokens.ts↔tokens.css 已列变量,色对断言只测 tokens.ts 常量,没有任何断言覆盖「组件类字符串消费的是哪个变量」。

**Fix:**
1. tokens.css 增设语义 accent 变量并按模式分流(亮色用 deep、暗色用原语),例如:

```css
/* 组件层:accent 语义角色(亮色 D-07 深霓虹 / 暗色霓虹原语),色值仍单点在 tokens.ts */
:root {
  --color-neon-cyan-deep: oklch(0.42 0.10 230);
  --color-neon-magenta-deep: oklch(0.40 0.16 330);
  --color-neon-yellow-deep: oklch(0.40 0.10 70);
  --color-accent: var(--color-neon-cyan-deep);
}
.dark {
  --color-accent: var(--color-neon-cyan);
}
```

   (deep 值同步进 tokens.ts,由现有 tokens.test.ts 同步断言收口。)
2. 上表消费点的**文本/选中/反馈**类用法改 `var(--color-accent)`(或各自对应的 deep 变量);边框/大字可按用途在 UI-SPEC 里逐项裁定,品牌 logo 的 D-08 豁免需在亮色语境下显式重新确认。
3. tokens.test.ts 增补 accent 色对断言,并为关键组件加「消费 accent 而非原语」的源码级断言(项目已有同类先例:Tabs.test.ts:103-104)。

## Warnings

### WR-01: Input.vue 的 `:id` 位于 `v-bind="$attrs"` 之前,消费方传 id 会静默打断 label 关联(与自身注释矛盾)

**File:** `src/ui/Input.vue:14-15`(textarea)、`:26-27`(input)
**Issue:** 组件头注释声称「控件 id/value/aria 由组件持有,**置于 $attrs 之后确保不被覆盖**」,但模板中 `:id="id"` 写在 `v-bind="$attrs"` **之前**。Vue 的 mergeProps 语义是后者胜(class/style 除外):消费方透传 `id` 属性会覆盖 `useId()` 生成的 id,而 `<label :for="id">` 仍用组件 id——`for`/`id` 关联静默断裂,这是一个 D-19 明确要保护的 a11y 契约。次要一致性问题:textarea 的 `rows="4"` 写在 `$attrs` 之后,消费方传 `rows` 会被静默忽略。
**Fix:**

```html
<textarea v-if="multiline" v-bind="$attrs" :id="id" rows="4" ... />
```

   (即把组件持有的 `:id` 移到 `v-bind="$attrs"` 之后,与注释声明一致;并在 Input.test.ts 补一条「attrs 传 id 时 label[for] 仍指向控件」的契约用例。)

### WR-02: home.layout.vue 用 `<nav>` 包裹非导航文案,产生空导航地标

**File:** `src/layouts/home.layout.vue:15`
**Issue:** `<nav>开发者 & 办公工具箱</nav>` 内容是站点副标题,不含任何链接。HTML 规范要求 nav 元素仅用于「页面导航区块」,屏幕阅读器会据此向用户播报一个没有任何导航功能的 landmark,属语义误用——在本 a11y 基线 phase 里应当纠正。
**Fix:** 改为无地标语义的 `<span>` 或 `<p>`(类名不变)。

### WR-03: 对比度守卫存在消费层盲区(CR-01 类回归无自动化防线)

**File:** `src/styles/tokens.test.ts:116-181`(整体覆盖面)
**Issue:** 现有 D-20「改色即红」双保险只覆盖:① tokens.ts↔tokens.css 已列变量的逐字同步;② tokens.ts 常量间的色对对比度。组件实际消费哪个变量、亮色模式下消费的是什么值,完全无断言——CR-01 正是从这个盲区进入主干且全绿的。对名为「a11y baseline」的 phase,这是验收面缺口而非风格问题。
**Fix:** 见 CR-01 Fix 第 3 点:accent 语义色对入 tokens.test.ts;Tabs/CopyableText/ToolCard 等关键消费者加「类含 var(--color-accent) 且不含 var(--color-neon-cyan) 文本用法」的源码级断言(项目已有 Tabs.test.ts:103 的源码级断言先例,成本低)。

## Info

### IN-01: 快速连续切换主题时,前次 rAF 链会提前移除 .theme-switching

**File:** `src/composables/useThemeMode.ts:55-62`
**Issue:** 每次 resolved 变化都挂 `.theme-switching` 并启动独立的双 rAF 移除链。若在约 32ms 窗口内发生第二次切换,第一次的移除链会在第二次切换窗口中途摘类,瞬切中和失效、该次切换可能出现全局过渡。仅在极速连点时出现,纯装饰性,不阻断功能;happy-dom + fake timers 的测试(用例⑥)覆盖不到该交错。
**Fix:** 移除前校验 resolved 未再变化(闭包捕获当次 mode),或用递增 token 丢弃过期 rAF 链。

### IN-02: Tabs 面板无条件 `tabindex="0"`,含交互内容时多出 Tab 停靠点

**File:** `src/ui/Tabs.vue:53`
**Issue:** WAI-ARIA tabs 模式建议仅当面板不含交互元素时才为面板加 `tabindex="0"`。本组件对所有面板统一加,面板常驻 `CopyableText` 复制按钮等交互件时,键盘用户在「tab → 面板」之间多一次 Tab 停靠。组件注释只论证了「纯静态面板加 tabindex=0」,未覆盖含交互件面板。
**Fix:** 在文档/注释中收窄该约定,或在面板插槽无法静态判断时保持现状并接受此偏离(需 UI-SPEC 明示)。

### IN-03: CopyableText 反馈由 sr-only 变可见引发行高抖动

**File:** `src/ui/CopyableText.vue:72-76`
**Issue:** 反馈 span 常驻 DOM、常态 `sr-only`;复制成功/失败后切换为可见文本,组件纵向高度瞬间增加一行,下方内容(如 Card 内布局)下移,视觉抖动。
**Fix:** 为反馈行保留固定最小高度,或反馈可见时用绝对定位覆盖展示,避免文档流变化。

---

_pnpm-lock.yaml 为锁定文件,仅抽样核对头部结构(lockfileVersion 9.0,specifier 与版本一致),无发现。_
_审查中实测对比度所用的 oklch→线性 sRGB 矩阵与 WCAG 公式,与 tokens.test.ts 内实现逐系数一致。_

---

_Reviewed: 2026-09-08T11:07:15Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
