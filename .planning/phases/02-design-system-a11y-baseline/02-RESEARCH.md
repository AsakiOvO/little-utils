# Phase 2: 设计系统与响应式/可访问性基线 - Research

**Researched:** 2026-09-07
**Domain:** Tailwind 4 三层设计令牌 + 亮暗双主题、VueUse 三态主题状态机、vite-ssg FOUC 防护、CodeMirror 6 动态双主题、自研 Vue 基础组件（WAI-ARIA）、WCAG 对比度单测、reduced-motion 与移动端基线
**Confidence:** HIGH（核心机制全部经官方文档/一手来源查证 + 关键色对经本地实跑验证；个别实现细节标注 ASSUMED）

## Summary

本阶段是**零新依赖**的纯前端阶段：六件套自研、主题能力由已在库的 `@vueuse/core 14.4.0` + Tailwind 4.3.3 CSS-first 机制承载、验证跑在已有 vitest 4.1.10 基建上。核心技术问题全部有确定答案：① 三层令牌的亮暗双语义映射 = **语义变量亮色值留在 `@theme`（生成 `:root` 变量 + utility），暗色值搬进 `.dark` 选择器下重新声明**——`@theme` 变量必须顶层、不可嵌套，但普通 `.dark` 块重声明合法且与 `@custom-variant dark (&:where(.dark, .dark *))`（已在 tokens.css:6 声明）天然对齐；这正是 D-12 允许的"机制性搬迁"。② 三态主题不用 `useDark`（两态 boolean）也不用 `useColorMode`（其 auto 分支经 `usePreferredDark` 解析，no-preference 系统会回落**亮色**，违反 D-01 回落**暗色**）——按 D-04 点名路径用 `useStorage + usePreferredColorScheme + watch` 自组 `useThemeMode` composable，no-preference 显式映射为 dark。③ FOUC 防护脚本放 `index.html` 的 `<head>` 顶部（vite-ssg 以 index.html 为每路由共享模板，普通内联 `<script>` 原样透传到预渲染产物），其判定逻辑必须与 `useThemeMode` 逐字对齐。

关键验证成果：**UI-SPEC 全部 24 个起点色对经本地实跑 oklch→sRGB→WCAG 算法一次通过 ≥4.5:1**（含暗色全部锁定值与亮色 D-07 起点值；sanity anchor 黑/白 = 21.00:1 精确匹配确认算法实现正确）。亮色 success/warning 的 UI-SPEC 未给出起点，实跑补出可行值（success `oklch(0.45 0.12 150)` = 6.45:1、warning `oklch(0.42 0.11 85)` = 7.79:1）。D-20 单测可直接采用这些值，预计零调色返工。

**Primary recommendation:** 按本文 §Architecture Patterns 的六个模式实现——tokens.css 重构为「@theme 原语+亮色语义 / .dark 暗色语义」、新建 `src/composables/useThemeMode.ts`（storage key 建议 `little-utils:v1:theme`，PITFALLS 前缀惯例全站首落地）、index.html head 注入 FOUC 阻塞脚本（判定逻辑与 composable 镜像）、六件套放 `src/ui/`（PascalCase，禁 import codemirror）、CodeMirror 双主题模块放 json-formatter 工具目录内用 Compartment 切换、D-20 单测同时断言对比度与 tokens.css↔tokens.ts 同步（改色即红的双保险）。

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**主题切换行为**
- **D-01:** 首次访问（localStorage 无记录且未手动切换过）跟随系统偏好（prefers-color-scheme），系统无偏好时回落暗色 — **Reversibility:** reversible
- **D-02:** 三态切换：暗 / 亮 / 跟随系统，任何时刻可回到自动模式；非两态 — **Reversibility:** reversible
- **D-03:** 切换控件为双 layout（home.layout / tool.layout）顶栏右上角的循环图标按钮，点击在 暗→亮→跟随系统 间循环，图标随状态变化（月亮/太阳/显示器）；新增工具页自动获得切换能力 — **Reversibility:** reversible
- **D-04:** 跟随系统态实时联动：处于「跟随系统」态时系统偏好变化立即生效（VueUse usePreferredColorScheme + watch）；用户手动选择后系统变化不影响，直到切回跟随态 — **Reversibility:** reversible
- **D-05:** 防闪烁（FOUC）：head 内联阻塞脚本在首屏绘制前读 localStorage 挂好 .dark 类与 color-scheme，零闪烁；保持 vite-ssg 预渲染 mounted 纪律（PITFALLS 既有先例）
- **D-06:** CodeMirror 编辑器定制亮色主题：EditorView.theme 定制亮色配色，背景/选区/行高亮对齐站点语义令牌（底色 = surface），语法高亮用深霓虹三色+中性色，随主题切换；不再硬用 oneDark

**亮色主题与令牌体系**
- **D-07:** 亮色令牌策略 = 浅冷灰底（保持 260 色相、偏离纯白）+ 深霓虹双色体系：霓虹三色在亮色下整体加深降饱和（青→深青蓝、品红→深紫红、电光黄→琥珀/金褐）满足 4.5:1；不做简单反转、不做 GitHub Light 式白天模式
- **D-08:** 发光效果亮色下保留但降强度：glow 阴影透明度降低、颜色换深霓虹血统；大面积装饰滥用留给 Phase 6 装饰层控制
- **D-09:** 三层设计令牌分层：①原语层（霓虹三色+中性灰阶原始值，不直接用于页面）→ ②语义层（bg/surface/text/border 等角色，亮暗两套映射到原语）→ ③组件层（仅组件需要时建，如 --input-border-focus，不强制、避免过度抽象）— **Reversibility:** costly — 语义层变量名是六件套组件与全部存量页面的消费契约，Phase 5 批量工具接入后改名/改层需触及所有消费方
- **D-10:** 语义层补齐 success/warning/danger 功能色 + 对应背景/边框变体，亮暗双套；基础组件错误态直接消费
- **D-11:** 主题切换瞬间颜色瞬切，无全局过渡动画（避免大面积重绘性能损耗，符合动效克制原则）
- **D-12:** D-05（Phase 1）「暗色令牌一字不动」解释为不重新设计暗色配色：值不变，允许机制性搬迁（从 @theme 搬进 .dark 选择器下、文件组织与映射方式调整）

**基础组件库（六件套）**
- **D-13:** 组件清单六件套：Button、Input（含 textarea 变体）、Card、Tabs、CopyableText（封装 useCopy + 复制按钮 + 成功反馈）、ThemeToggle（D-02/D-03 三态切换控件）；不建 Select（原生够用，避免过度设计）
- **D-14:** 组件形态 = Vue SFC：每个组件封装样式+默认行为+无障碍属性，调用方零心智负担；Phase 5 批量工具拿来即用 — **Reversibility:** costly — 组件 API 一旦被 Phase 5 七个工具消费即成向后兼容契约
- **D-15:** 存量页面全量迁移：home/not-found/双 layout/ToolCard/JSON 工具改用新组件，真实验证六件套 API 完备性，避免 Phase 4/6 改版时新旧两套并存
- **D-16:** 尺寸体系：单一默认尺寸起步（已满足 16px/44px 底线），API 留 size prop 位置但不实现
- **D-17:** CopyableText 封装复用现有 useCopy composable（能力层/展示层分离），不重复实现剪贴板逻辑
- **D-18:** 命名与注册：无前缀 + 按需导入，延续 safe-html 惯例（Button.vue/Input.vue 放 src/ui/，显式 import），与工具自包含模式一致、tree-shaking 友好
- **D-19:** 组件内置完整 a11y：focus-visible 焦点样式对齐霓虹色、Tabs 方向键导航 + roving tabindex、Input 关联 label/错误态 aria、按钮 aria-label 约定；Phase 6 冲刺 Lighthouse a11y ≥ 95 时组件层零返工

**基线验证**
- **D-20:** 对比度 ≥4.5:1 用单元测试验证：令牌色值同步维护进 TS 常量模块，vitest 实现 WCAG 对比度算法，断言关键色对（text/bg、霓虹文字用途、功能色）双主题全部达标；跑进现有 vitest 命令，改色即红
- **D-21:** 16px/44px 落点 = 组件默认 + 全局兜底：Input/textarea 组件默认 16px、Button 等交互件 min 44px；base.css 另给原生 input/select/textarea 一条 16px 兜底规则（防绕过组件直写原生标签）
- **D-22:** reduced-motion 用全局媒体查询一刀切：base.css 一条 @media (prefers-reduced-motion: reduce) 把全站 animation/transition 时长压到最短；Phase 6 装饰动画天然被覆盖
- **D-23:** 移动端验收 = 单测断言规则 + 手动真机/设备模拟抽验（走一遍 JSON 工具完整流程）；不引入 Playwright 等 E2E 设施

### Claude's Discretion
- 具体色值（亮色令牌的 oklch 数值，在 D-07 策略与 D-20 对比度约束内）
- 令牌文件组织（tokens.css 拆分方式、CSS 变量命名细节）
- 组件 props/events 具体设计（六件套清单与形态已锁，API 细节 researcher/planner 定）
- head 内联脚本的具体实现与 vite-ssg 模板注入方式
- CodeMirror 亮色主题的具体配色映射

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STYL-01 | 设计系统先行：Tailwind 4 `@theme` 定义霓虹青/品红/电光黄（oklch）设计令牌，霓虹文字对比度 ≥ 4.5:1 | §Pattern 1 三层令牌与 .dark 翻转机制（[CITED] 官方文档）；§Pattern 6 对比度单测（算法矩阵 [CITED: bottosson]）；UI-SPEC 起点色对已实跑全部达标（[VERIFIED: 本地 node 实跑]） |
| STYL-03 | 动效提供 `prefers-reduced-motion` 降级，工具操作区保持克制易读 | §Pattern 1 base.css 中和块（[CITED: developer.mozilla.org 2026-06]）；工具区克制由 tool.layout 现有约束 + 六件套中性样式保证 |
| SITE-04 | 用户可切换暗色/亮色模式（默认暗色、跟随系统偏好、选择持久化） | §Pattern 2 useThemeMode 三态状态机（VueUse 语义 [CITED: vueuse 官方]）；§Pattern 3 FOUC 脚本（Tailwind 官方三态模式 [CITED] + vite-ssg index.html 透传 [CITED]） |
| SITE-05 | 用户可在移动端正常使用全部核心功能（响应式，输入框 ≥16px 防 iOS 缩放，触控目标达标） | iOS 16px 规则多源确证（[CITED]）；D-21 双层落点（组件默认 + base.css 兜底）；44px 触控目标进 Button/ThemeToggle 默认尺寸；D-23 手动验收路径 |

</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 三态主题状态（偏好存储/循环切换/系统联动） | Browser/Client（`useThemeMode` composable） | — | localStorage + matchMedia 纯客户端能力；ThemeToggle 是唯一 JS 消费者 |
| 首屏主题（FOUC 防护） | 静态 HTML（vite-ssg 产物内 head 内联脚本） | Browser（脚本在浏览器首绘前执行） | 脚本必须先于 Vue 水合与首帧执行；预渲染期不执行脚本 |
| 主题视觉（令牌翻转/color-scheme） | CSS 层（@theme + .dark 变量重声明） | — | 零 JS 参与，级联自动生效；组件零改动 |
| 六件套基础组件 | Browser/Client（Vue SFC，`src/ui/`） | — | 纯展示+交互封装；显式 import（D-18） |
| CodeMirror 亮暗双主题 | Browser/Client（工具目录内，懒加载 chunk） | — | check-chunks 断言共享层零 CM（[VERIFIED: scripts/check-chunks.mjs:151]）；主题模块必须留在 json-formatter 目录 |
| 对比度/令牌同步验证 | 测试期（vitest 纯函数 + 文件内容断言） | — | 无 DOM 依赖，node 环境 node:fs 读 CSS 文本即可 |
| reduced-motion 降级 | CSS 层（base.css 全局媒体查询） | — | D-22 一刀切；纯 CSS 无 JS 检测需求 |

## Standard Stack

### Core（全部已在库 — 本阶段零新装）

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue | ^3.5.40 | SFC 组件（六件套） | 项目框架 [VERIFIED: package.json:32] |
| tailwindcss + @tailwindcss/vite | ^4.3.3 | `@theme` 令牌、`@custom-variant dark`、utility | CSS-first 主题机制 [VERIFIED: package.json:25,31] [CITED: tailwindcss.com/docs/theme /docs/dark-mode] |
| @vueuse/core | ^14.4.0 | `useStorage`（三态持久化）、`usePreferredColorScheme`（系统偏好实时联动）、`useClipboard`（useCopy 已封装） | SSR-safe、tree-shakeable [VERIFIED: package.json:27] [CITED: github.com/vueuse/vueuse 官方文档] |
| @lucide/vue | ^1.39.0 | ThemeToggle 图标（月亮/太阳/显示器）与组件内图标 | Phase 1 已过供应链闸门 [VERIFIED: package.json:24] |
| codemirror + @codemirror/view / @codemirror/state / @codemirror/language | ^6.x | D-06 双主题（EditorView.theme + Compartment + HighlightStyle） | [VERIFIED: package.json:21-23,28] [CITED: codemirror.net 官方文档] |
| vitest + @vue/test-utils + happy-dom | ^4.1.10 / ^2.4.11 / ^20.13.2 | D-20 对比度单测、组件测试、CSS 内容断言 | 86 个既有测试的同一基建 [VERIFIED: package.json:41,47,57] |
| vite-ssg | ^28.3.0 | index.html 模板透传（FOUC 脚本注入载体） | [VERIFIED: package.json:56] [CITED: antfu-collective/vite-ssg] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @codemirror/theme-one-dark | ^6.1.3 | **将被 D-06 替换移除** | oneDark import 删除后建议从 package.json 移除（清理依赖） |

**Installation:**
```bash
# 本阶段零新装。唯一 package.json 变更 = D-06 落地后移除 oneDark：
corepack pnpm remove @codemirror/theme-one-dark
```

**Version verification:** 无新装包；上表版本号全部 Read 自 [VERIFIED: package.json:20-59]，与本机 node_modules 实况一致（vitest/vue-tsc bin 已探测存在）。

## Package Legitimacy Audit

> 本阶段**不安装任何新包**，无需安装闸门。以下为直接消费的既有依赖复查结果（gsd-tools package-legitimacy check，2026-09-07）：

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| @vueuse/core | npm | 持续活跃 | ~9.9M/wk | github.com/vueuse/vueuse | OK | 已在用，Approved |
| tailwindcss | npm | 持续活跃 | ~110M/wk | github.com/tailwindlabs/tailwindcss | OK | 已在用，Approved |
| codemirror | npm | 持续活跃 | ~7.1M/wk | github.com/codemirror | OK | 已在用，Approved |
| @codemirror/theme-one-dark | npm | 持续活跃 | ~5.1M/wk | github.com/codemirror/theme-one-dark | OK | 本阶段移除 |
| @lucide/vue | npm | 新版今日发布 | ~507K/wk | github.com/lucide-icons/lucide | SUS（"too-new"） | 保留现状 — 信号=最新版本刚发布，非供应链风险；项目锁 ^1.39.0 且 Phase 1 已人工过闸 |
| vitest | npm | 新版 4 天前 | ~93M/wk | github.com/vitest-dev/vitest | SUS（"too-new"） | 保留现状 — 同上，已在 86 测试中运行 |
| @vue/test-utils | npm | 新版 11 天前 | ~4.3M/wk | github.com/vuejs/test-utils | SUS（"too-new"） | 保留现状 — 同上 |
| happy-dom | npm | 新版 4 天前 | ~14M/wk | github.com/capricorn86/happy-dom | SUS（"too-new"） | 保留现状 — 同上 |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** 无需 checkpoint — 四个 SUS 均为 seam 对"数天前发布最新版"的保守信号，包本体官方、高下载量、postinstall 为 null，且全部已锁定在本项目 lockfile 中运行（非本阶段新装）。⚠️ 执行纪律：**不要运行 `pnpm update`**，保持 pnpm-lock.yaml 现状（避免无意中拉入 too-new 版本）。

## Project Constraints (from CODEBUDDY.md)

CODEBUDDY.md / CLAUDE.md 在项目根目录不存在（已探测）。项目约束以 `.planning/PROJECT.md`、`.planning/research/*` 与 02-CONTEXT.md 为准，关键既有惯例：
- 零第三方外链/零 webfont（PITFALLS 3；UI-SPEC Font 行重申）
- 唯一 v-html 出口 = safe-html.vue（ESLint vue/no-v-html 白名单 `^sanitized`）；六件套一律文本插值渲染
- 测试文件就近 `*.test.ts`；type-check（vue-tsc --build）为构建门
- localStorage 键惯例 `little-utils:v1:*`（PITFALLS 技术债模式；favorites 属 Phase 4，theme key 本阶段首落地）

## Architecture Patterns

### System Architecture Diagram

```
[localStorage little-utils:v1:theme]      [系统 prefers-color-scheme]
        │ (首绘前，阻塞)                        │ (运行时实时)
        ▼                                       ▼
┌─────────────────────┐   同一判定逻辑   ┌──────────────────────────┐
│ index.html head      │ ◄──镜像对齐──► │ useThemeMode (composable) │
│ 内联 FOUC 阻塞脚本    │                │ useStorage +              │
│ → html.classList +   │                │ usePreferredColorScheme   │
│   color-scheme       │                │ → cycle()/resolved        │
└─────────┬───────────┘                └────────────┬─────────────┘
          │            ┌────────────────────────────┘
          ▼            ▼ (类/样式变更)
   ┌──────────────────────────┐
   │ html.dark 类 + color-scheme │
   └────────────┬─────────────┘
                ▼ 级联
   ┌──────────────────────────────────────────────┐
   │ tokens.css: :root(亮色语义) / .dark(暗色语义)     │
   │ → 全部组件/页面消费 var(--color-*) → 零改动翻转    │
   └────────────┬─────────────────────────────────┘
                ▼ 消费
   ┌────────────┴───────────────┐
   │ 六件套(src/ui) + 存量页面迁移   │ ThemeToggle(双 layout header)
   │ CodeMirror 主题(工具 chunk)  │ ← Compartment reconfigure
   └────────────────────────────┘
   [vitest: tokens.test.ts 对比度+同步断言] ←──── tokens.ts 常量模块（色值单点）
```

### Recommended Project Structure

```
src/
├── styles/
│   ├── tokens.css        # 重构：@theme(原语+亮色语义) + .dark(暗色语义) + glow 亮暗两套
│   ├── tokens.ts         # 新增：D-20 色值常量模块（CSS↔TS 同步断言的 TS 侧）
│   └── base.css          # 增改：16px 兜底、reduced-motion 块、color-scheme 动态化、全局 focus-visible 兜底
├── composables/
│   ├── useThemeMode.ts   # 新增：三态状态机（D-01/02/04）；storage key 唯一定义点
│   └── useCopy.ts        # 已有：CopyableText 封装复用（D-17，勿改 API）
├── ui/
│   ├── Button.vue / Input.vue / Card.vue / Tabs.vue / CopyableText.vue / ThemeToggle.vue  # 六件套（PascalCase，D-18）
│   └── safe-html.vue     # 已有：唯一 v-html 出口，不动
├── components/ToolCard.vue      # 迁移：改用 Card + hover accent（D-15）
├── layouts/home.layout.vue / tool.layout.vue   # 迁移 + ThemeToggle 挂载（D-03）
├── pages/home.vue / not-found.vue              # 迁移（D-15）
└── tools/json-formatter/
    ├── components/CodeMirrorJson.vue   # oneDark → Compartment 双主题
    └── components/cm-theme.ts          # 新增：亮/暗 EditorView.theme + HighlightStyle（只准本目录 import）
```

### Pattern 1: 三层令牌与 .dark 变量翻转（tokens.css 重构）

**What:** 原语层（`--color-neon-*`）留在 `@theme`；语义层亮色值也留在 `@theme`（Tailwind 生成 `:root` 变量与 utility），暗色值在 `@theme` 之后的普通 `.dark` 块中重新声明。
**When to use:** 所有语义令牌；D-12 暗色值原样搬迁。
**依据:** Tailwind 官方——`@theme` 变量生成在 `:root`、utility 编译为 `var(--color-*)` 引用、`@theme` 变量必须顶层不可嵌套、非 utility 变量用普通选择器声明 [CITED: tailwindcss.com/docs/theme、/docs/dark-mode]；现有页面全部以 `var(--color-*)` arbitrary value 消费（bg-[var(--color-bg)] 等），`.dark` 重声明后零改动翻转。`.dark` 与 `:root` 特异性同为 (0,1,0)，靠源顺序覆盖（.dark 块置于 @theme 之后）[CITED: CSS Cascading 规范行为]。`@custom-variant dark (&:where(.dark, .dark *))` 已在 tokens.css:6 声明 [VERIFIED: src/styles/tokens.css:6]。

```css
/* src/styles/tokens.css 重构骨架 */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* ── 原语层（不直接用于页面）── */
  --color-neon-cyan: oklch(0.85 0.16 195);    /* 暗色原语值不动 [VERIFIED: src/styles/tokens.css:10-12] */
  --color-neon-magenta: oklch(0.72 0.24 330);
  --color-neon-yellow: oklch(0.92 0.19 105);
  /* 原语层暗色系中性灰阶原始值按需补充（组件层/亮色语义映射用） */

  /* ── 语义层 · 亮色（:root 默认）── */
  --color-bg: oklch(0.97 0.008 260);
  --color-surface: oklch(0.99 0.004 260);
  --color-surface-raised: oklch(0.94 0.01 260);
  --color-text-primary: oklch(0.24 0.02 260);
  --color-text-muted: oklch(0.46 0.02 260);
  --color-border: /* 亮色值，executor 定 */;
  /* D-10 功能色亮色值 + 背景/边框变体（success/warning/danger） */
  --color-danger: oklch(0.50 0.19 25);
  --color-success: oklch(0.45 0.12 150);   /* 实跑验证 6.45:1 [VERIFIED: 本地 node 实跑] */
  --color-warning: oklch(0.42 0.11 85);    /* 实跑验证 7.79:1 [VERIFIED: 本地 node 实跑] */

  /* ── glow 亮色（D-08：透明度约减半 + 深霓虹血统）── */
  --shadow-glow-cyan: 0 0 12px oklch(0.42 0.10 230 / 0.18);
}

/* ── 语义层 · 暗色（D-12：值一字不动，机制性搬迁）── */
.dark {
  --color-bg: oklch(0.16 0.02 260);            /* [VERIFIED: src/styles/tokens.css:15-20] 逐值搬迁 */
  --color-surface: oklch(0.2 0.025 260);
  --color-surface-raised: oklch(0.24 0.03 260);
  --color-text-primary: oklch(0.93 0.01 260);
  --color-text-muted: oklch(0.65 0.02 260);
  --color-border: oklch(0.3 0.03 260);
  /* D-10 暗色功能色：danger oklch(0.65 0.19 25) / success oklch(0.75 0.15 150) / warning oklch(0.80 0.15 85) */
  --shadow-glow-cyan: 0 0 12px oklch(0.85 0.16 195 / 0.35);  /* 暗色 glow 原值 [VERIFIED: src/styles/tokens.css:26-27] */
  --shadow-glow-magenta: 0 0 12px oklch(0.72 0.24 330 / 0.3);
}

/* color-scheme 由 CSS 兜底 + JS 双写（见 Pattern 3） */
:root { color-scheme: light; }
.dark { color-scheme: dark; }
```

### Pattern 2: useThemeMode 三态状态机（D-01/D-02/D-04）

**What:** `useStorage`（持久化三态偏好）+ `usePreferredColorScheme`（实时系统偏好）+ `computed`（解析）+ `watch`（DOM 副作用）自组三态。
**Why not useDark/useColorMode:** useDark 是 boolean 两态，无 auto 语义位 [CITED: VueUse useDark 文档]；useColorMode 的 auto 经 `usePreferredDark` 解析——no-preference 系统下 dark MQ 不匹配 → light，违反 D-01 回落暗色 [CITED: VueUse useColorMode 文档："it will match with users' browser preference using usePreferredDark"]。D-04 已点名 usePreferredColorScheme 路径。

```typescript
// src/composables/useThemeMode.ts
import { computed, watch } from 'vue'
import { usePreferredColorScheme, useStorage } from '@vueuse/core'
import type { Ref } from 'vue'

export type ThemePreference = 'dark' | 'light' | 'auto'
export type ResolvedTheme = 'dark' | 'light'

/** 全站唯一 storage key 定义点（PITFALLS 惯例 little-utils:v1:* 首落地） */
export const THEME_STORAGE_KEY = 'little-utils:v1:theme'

/** 存储值白名单归一：防污染/旧值（安全 + 健壮） */
function normalize(raw: unknown): ThemePreference {
  return raw === 'dark' || raw === 'light' ? raw : 'auto'
}

let singleton: ReturnType<typeof createThemeMode> | null = null

function createThemeMode() {
  const preference = useStorage<ThemePreference>(THEME_STORAGE_KEY, 'auto', undefined, {
    initOnMounted: true, // vite-ssg mounted 纪律（ARCHITECTURE Anti-Pattern 5）：预渲染期不读 storage，防水合不匹配
    serializer: { read: normalize, write: (v: ThemePreference) => v },
  })
  const system = usePreferredColorScheme() // ComputedRef<'dark'|'light'|'no-preference'>，实时 [CITED: VueUse]

  const resolved = computed<ResolvedTheme>(() => {
    if (preference.value !== 'auto') return preference.value
    return system.value === 'light' ? 'light' : 'dark' // no-preference → dark（D-01）
  })

  // DOM 副作用：SSG Node 预渲染无 document，必须守卫
  watch(resolved, (mode) => {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('dark', mode === 'dark')
    document.documentElement.style.colorScheme = mode
  })

  /** D-03 循环：暗 → 亮 → 跟随系统 → 暗 */
  function cycle(): void {
    preference.value = preference.value === 'dark' ? 'light'
      : preference.value === 'light' ? 'auto' : 'dark'
  }

  return { preference: preference as Ref<ThemePreference>, resolved, cycle }
}

export function useThemeMode() {
  singleton ??= createThemeMode() // 模块级单例：多消费点共享同一状态
  return singleton
}
```

**注意：** `useStorage` 的 serializer 选项细节（read 返回归一值/异常路径）以 VueUse 14.4.0 真实签名为准——执行者须先核对该版本 API（先例：Phase 1 曾按 14.4.0 真实语义修正计划假设 [VERIFIED: .planning/STATE.md:80]）。

### Pattern 3: head 内联 FOUC 阻塞脚本（D-05）

**What:** `index.html` `<head>` 顶部（charset 之后、其它资源之前）注入普通内联 `<script>`；vite-ssg 以 index.html 为每路由共享模板，普通内联脚本原样透传进全部预渲染产物 [CITED: antfu-collective/vite-ssg 文档 + Tailwind 官方 dark-mode 模式 "best to add inline in head to avoid FOUC"]。预渲染（Node）不执行该脚本，零影响。
**判定逻辑必须与 Pattern 2 的 resolved 镜像对齐**（无记录/auto → light MQ 匹配才亮，否则暗）。

```html
<!-- index.html <head> 内、紧随 <meta charset> -->
<script>
  (function () {
    try {
      var raw = localStorage.getItem('little-utils:v1:theme'); // 与 THEME_STORAGE_KEY 一致
      var mode = raw === 'dark' || raw === 'light'
        ? raw
        : (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
            ? 'light' : 'dark'); // 无记录/auto：no-preference 回落暗（D-01）
      var root = document.documentElement;
      root.classList.toggle('dark', mode === 'dark'); // 白名单布尔，无注入面
      root.style.colorScheme = mode;
    } catch (e) { /* 隐私模式等：保持默认暗色基线（预渲染 HTML 的类即暗色兜底，见下） */ }
  })();
</script>
```

⚠️ **预渲染静态 HTML 的默认类问题：** vite-ssg 预渲染输出含 `<html lang="zh-CN">`（无 .dark 类）→ 亮色 HTML 先到，FOUC 脚本才挂 .dark。脚本在 head 顶部同步执行、先于首帧与 CSS 应用判断，通常无可见闪烁；若要绝对零闪烁，可在 vite.config.ts 的 `ssgOptions.onBeforePageRender` 钩子给模板 `<html>` 加 `class="dark"`（暗色为默认主题），脚本在亮色时移除 [CITED: vite-ssg onBeforePageRender 钩子]——两种方案都满足 D-05，执行时以「构建后目测暗色直开无白闪」为准验收。

### Pattern 4: CodeMirror 双主题 Compartment 切换（D-06）

**What:** `EditorView.theme(spec, {dark: bool})` 定义 UI chrome（背景/gutter/光标/选区），`HighlightStyle.define` + `syntaxHighlighting` 定义语法配色，二者打包进一个 `Compartment`，主题切换时 `dispatch({effects: compartment.reconfigure(...)})`，不重建视图 [CITED: codemirror.net/sections/examples/config（Compartment 官方示例）、codemirror/view theme 文档]。

```typescript
// src/tools/json-formatter/components/cm-theme.ts —— 只准本工具目录 import（check-chunks 断言）
import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { tokens } from '../../../styles/tokens' // D-20 常量模块：色值单点来源（字面值，非 var()）

const chrome = (dark: boolean) => EditorView.theme({
  '&': { backgroundColor: dark ? tokens.dark.surface : tokens.light.surface, color: dark ? tokens.dark['text-primary'] : tokens.light['text-primary'] },
  '.cm-gutters': { backgroundColor: dark ? tokens.dark.surface : tokens.light.surface, border: 'none', color: dark ? tokens.dark['text-muted'] : tokens.light['text-muted'] },
  '.cm-activeLine': { backgroundColor: dark ? tokens.dark['surface-raised'] : tokens.light['surface-raised'] },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: dark ? tokens.dark['surface-raised'] : tokens.light['surface-raised'] },
  '&.cm-focused': { outline: 'none' }, // 焦点环交给宿主容器统一 focus-visible
}, { dark })

const highlight = (dark: boolean) => syntaxHighlighting(HighlightStyle.define([
  { tag: [t.propertyName], color: dark ? tokens.neon.cyan : tokens.light['neon-cyan-deep'] },
  { tag: [t.string], color: dark ? tokens.neon.magenta : tokens.light['neon-magenta-deep'] },
  { tag: [t.number, t.bool, t.null], color: dark ? tokens.neon.yellow : tokens.light['neon-yellow-deep'] },
  { tag: [t.keyword, t.punctuation, t.operator], color: dark ? tokens.dark['text-muted'] : tokens.light['text-muted'] },
]))

// CodeMirrorJson.vue 内：const themeComp = new Compartment()
// 初始：themeComp.of(chrome(false) /* 或按 resolved 初始值 */)
// 切换：watch(resolved, m => view?.dispatch({ effects: themeComp.reconfigure(chrome(m === 'dark') && highlight(m === 'dark')) }))
```

**推荐色值来源：** 从 D-20 的 `tokens.ts` 常量模块取**字面 oklch 字符串**（与单测同源），而非 `var(--color-*)`——CSS 变量字符串在 theme spec 中理论上可行（生成普通 CSS）但未在本次查询中获官方确认 [ASSUMED]，字面值方案零此风险且随 Compartment 切换。

### Pattern 5: 六件套 a11y 内置（D-19，WAI-ARIA）

**Tabs（roving tabindex + 方向键）** [CITED: accessibility.build Tabs Guide 2026-07，与 W3C APG 一致；W3C 原页面本次被反爬拦截]：
- `role="tablist"`（+ `aria-label`）内每个 tab 是**真实 `<button role="tab">`**：`aria-selected`、`aria-controls="<panel-id>"`、**仅选中 tab `tabindex="0"`，其余 `-1`**（单一 Tab 停靠点是强制要求）
- 键盘：`←/→` 循环移动（水平）、`Home/End` 跳两端、自动激活模式聚焦即选中（面板廉价时推荐默认）；状态三件套（aria-selected/tabIndex/panel hidden）由一个 `selectTab()` 驱动防漂移
- `role="tabpanel"`：`id` + `aria-labelledby="<tab-id>"`，非激活面板用 **`hidden` 属性**（禁 CSS opacity 隐藏）；纯静态面板加 `tabindex="0"`
- UI-SPEC 补充：tab 超宽容器 `overflow-x-auto` 水平滚动 + 键盘导航时活动 tab `scrollIntoView`

**Input：** label 关联（`for`/`id` 或包裹）、错误态 `aria-invalid="true"` + `aria-describedby="<error-id>"`、错误文案由调用方 `error` prop 传入（UI-SPEC 契约）。
**焦点环：** 组件内 `focus-visible` 样式消费 `--color-neon-cyan`；base.css 加全局 `:focus-visible` 兜底（非组件交互件也可见焦点）。
**ThemeToggle：** `<button :aria-label="切换主题(当前:暗色)" :title="同文案">`，图标 `Moon/Sun/Monitor` 随 `preference` 切换（D-03；图标 aria-hidden，语义在 aria-label）。

### Pattern 6: D-20 对比度单测（改色即红双保险）

**What:** ① `src/styles/tokens.ts` 导出双主题色值常量（含 oklch 字符串解析辅助）；② vitest 实现 oklch→sRGB→WCAG 算法断言关键色对 ≥4.5:1；③ **读 tokens.css 文本做 CSS↔TS 同步断言**（色值单点漂移即红——CONTEXT Specific Ideas 要求）。
**算法（已实跑验证）:** oklch→OKLab（`a=c·cos h, b=c·sin h`）→LMS′ 矩阵→立方→LMS→线性 sRGB 矩阵 [CITED: bottosson.github.io/posts/oklab（OKLab 作者原文，公有领域参考实现）]；线性→sRGB gamma `c≤0.0031308 ? 12.92c : 1.055c^(1/2.4)−0.055`；WCAG 亮度 `c≤0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4`，`L=0.2126R+0.7152G+0.0722B`，对比度 `(L1+0.05)/(L2+0.05)`（多源交叉，W3C 原页本次反爬拦截）[CITED: WCAG 2.1 SC 1.4.3 经 5 独立源交叉]。0.03928 与 0.04045 阈值差异对任何 8-bit 颜色无影响。
**测试锚点（必须内置）：** 黑/白 = 21.00:1（本次实跑精确匹配 [VERIFIED: 本地 node 实跑]）。

### Anti-Patterns to Avoid

- **在 @theme 内给语义变量写暗色值并试图用媒体查询切换**：@theme 变量必须顶层、不可嵌套在选择器/媒体查询下 [CITED: tailwindcss.com/docs/theme]——暗色值只能走 `.dark` 普通块。
- **组件内用 `dark:` variant 写死颜色**：违反 D-09 语义层消费契约（页面/组件只消费 `var(--color-*)`），双主题翻倍维护。
- **六件套/共享层 import codemirror**：check-chunks 断言首包可达集零 CM（`VIOLATION: 首包（入口页可达集）泄漏 codemirror 字样` [VERIFIED: scripts/check-chunks.mjs:149-152]）。
- **复制逻辑在 CopyableText 里重写**：必须封装 `useCopy()`（D-17；useClipboard legacy 语义已在 useCopy.test.ts 锁定）。
- **手写 `window.matchMedia('(prefers-color-scheme)')` 监听**：用 usePreferredColorScheme（VueUse 管理 addEventListener/cleanup/SSR 守卫）。
- **面板隐藏用 opacity/移出屏幕**：屏幕阅读器仍可及（违反 4.1.2/1.3.1），必须 `hidden`。

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 剪贴板 + 降级 | 手写 navigator.clipboard/execCommand 分支 | `useCopy()`（已有，useClipboard legacy:true） | 安全上下文/手势/权限怪癖已处理并有测试 |
| 系统偏好监听 | 裸 matchMedia.addEventListener | `usePreferredColorScheme` | SSR 守卫、自动 cleanup、live 更新 |
| 三态持久化 | 裸 localStorage.getItem/setItem | `useStorage`（initOnMounted） | 预渲染安全、序列化、跨实例同步 |
| oklch→sRGB 解析 | 引入 culori/colorjs.io 等色彩库 | ~30 行纯函数进 tokens.ts + 锚点单测 | D-20 明示"vitest 实现 WCAG 对比度算法"；零新依赖纪律；公式短且已被实跑验证 |
| 图标 | 内联 SVG/图标字体 | `@lucide/vue` 按需导入 | tree-shake、与 ToolCard icon 模式一致 |
| FOUC 判定逻辑第二份实现随意发挥 | 与 composable 逻辑不一致的脚本 | Pattern 3 镜像对齐（注释互指） | 逻辑漂移 = 首屏闪烁或状态不一致 |

**Key insight:** 本阶段的复杂度集中在「状态单点」（theme 状态机）与「值单点」（tokens.ts），其余全部是薄封装——重复实现任何一处单点都会在 Phase 5/6 放大成全站问题。

## Runtime State Inventory

> 本阶段含 D-15 存量迁移（组件重构类，非字符串改名类）。逐类显式回答：

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **无存量数据**——src 内零 `localStorage`/`useStorage` 使用（已 grep 验证 [VERIFIED: search_content src 全目录 0 命中]）；favorites 属 Phase 4。本阶段**新建** theme key（建议 `little-utils:v1:theme`） | 无迁移；新 key 按 Pattern 2/3 定义 |
| Live service config | None — 纯静态站，无外部服务配置 | — |
| OS-registered state | None — 无 OS 级注册 | — |
| Secrets/env vars | None — 本阶段无新增 env/secret | — |
| Build artifacts | ① `@codemirror/theme-one-dark` 移除后需刷新 lockfile（`corepack pnpm remove` 自动处理）② `dist/` 既有产物过期——check-chunks 前须重新 `corepack pnpm build`（脚本自身有 dist 存在性断言 [VERIFIED: scripts/check-chunks.mjs:113-114]） | 执行器在 D-06 任务内一并处理 |

## Common Pitfalls

### Pitfall 1: FOUC 脚本与 composable 判定逻辑漂移
**What goes wrong:** 脚本判定「无记录→暗」而 composable 判定「无记录→跟随 matchMedia 默认」→ 首屏挂错类后 Vue 挂载又翻转 = 闪烁。
**Why it happens:** 两处实现、无共享源。
**How to avoid:** Pattern 3 脚本逐字镜像 Pattern 2 resolved 逻辑；两处注释互指；D-23 手动验收含「暗色系统直开无闪烁」。
**Warning signs:** 刷新瞬间背景色跳变。

### Pitfall 2: .dark 覆盖不生效（特异性/源顺序误判）
**What goes wrong:** .dark 块写在 @theme 之前，或误以为需要 !important。
**Why it happens:** `:root` 与 `.dark` 特异性同为 (0,1,0)，仅源顺序决定胜负。
**How to avoid:** `.dark` 块永远放在 @theme 之后；type-check 无法发现，靠「亮暗切换目测 + tokens.test.ts 内容断言」兜底。
**Warning signs:** 切亮色后部分元素仍是暗色值。

### Pitfall 3: 全局 transition-colors 在主题切换时产生渐变（违 D-11 瞬切）
**What goes wrong:** ToolCard/按钮等已用 Tailwind `transition-colors`（hover 用途），`.dark` 类切换时这些元素的 background/border/color 会渐变 ≤150ms，与「瞬切」语义冲突。
**Why it happens:** transition 属性对「任何来源的颜色变化」都生效，不区分 hover 与主题切换。
**How to avoid（推荐）:** 主题切换瞬间临时禁用过渡——切换 watch 内给 `html` 加 `.theme-switching` 类（`*,*::before,*::after { transition: none !important }`），双 rAF 后移除；约 5 行。备选：接受组件级 hover 渐变（D-11 原文禁的是「全局过渡动画」，此解释偏宽松——按推荐方案执行更符合 D-11 精神）。
**Warning signs:** 切主题时卡片/按钮颜色「流动」。

### Pitfall 4: iOS 16px 规则的遗漏面
**What goes wrong:** 只给 `<input>` 设 16px；`textarea`/`select` 遗漏仍触发强制缩放。
**Why it happens:** 规则常被记成"input 专属"；实际按最终渲染 computed font-size 判定，input/textarea/select（及 contenteditable）一体适用 [CITED: daisyUI issue #3871、php.cn 2026-05、CSDN 2025-11 多源一致]。
**How to avoid:** base.css 兜底选择器 `input, select, textarea { font-size: 16px; }`（D-21 原文选择器）+ Input 组件 textarea 变体默认 16px；`maximum-scale=1` 在现代 iOS 无效，不要依赖。
**Warning signs:** iOS 真机聚焦输入框页面自动放大且难缩回。

### Pitfall 5: happy-dom 环境的假 DOM（测试假设失真）
**What goes wrong:** 组件测试断言 `getBoundingClientRect()` 尺寸（恒 0）或真实 matchMedia 行为（happy-dom 不模拟媒体查询计算）。
**How to avoid:** 尺寸断言走**源码级**（断言组件 class 字符串含 `min-h-11`/字号类，或读 base.css 文本断言规则存在）；系统偏好测试用 `vi.stubGlobal('matchMedia', ...)` mock（先例：useCopy.test.ts 的 defineProperty 注入模式 [VERIFIED: src/composables/useCopy.test.ts:11-17]）。
**Warning signs:** 测试在真实浏览器过、CI 红（或反之）。

### Pitfall 6: 预渲染期访问 document/localStorage
**What goes wrong:** useThemeMode 副作用/ThemeToggle 状态初始化在 Node 预渲染时崩溃或产生水合不匹配。
**Why it happens:** vite-ssg 预渲染跑组件 setup，无浏览器全局。
**How to avoid:** `initOnMounted: true` + `typeof document === 'undefined'` 守卫（Pattern 2）；Phase 1 的 mounted 纪律直接沿用。
**Warning signs:** `document is not defined` 于 build；Vue hydration warning。

### Pitfall 7: theme storage 脏值
**What goes wrong:** localStorage 被其它站点脚本/手滑写成任意字符串 → 状态机进入未知分支。
**How to avoid:** Pattern 2 `normalize()` 白名单（非 'dark'/'light' 一律 'auto'）；FOUC 脚本同样只接受两个白名单值。
**Warning signs:** 主题状态诡异且难复现。

### Pitfall 8: 六件套意外进不了 tree-shaking / 或 CM 泄漏
**What goes wrong:** 建 barrel 文件 `src/ui/index.ts` 全量再导出 → 未来某工具 import 一个组件拉全部；或图省事把 cm-theme 放 src/ui/。
**How to avoid:** D-18 显式 import（不建 barrel，延续现状）；cm-theme.ts 只放 json-formatter/components/。
**Warning signs:** check-chunks VIOLATION；工具页加载共享 ui chunk 异常肥。

## Code Examples

（Pattern 1–6 已含可直接引用的实现骨架：tokens.css 重构、useThemeMode、FOUC 脚本、cm-theme + Compartment、Tabs a11y 骨架、对比度算法矩阵。补充两个断言形态示例：）

### tokens.css↔tokens.ts 同步断言（node:fs 读文件）
```typescript
// src/styles/tokens.test.ts（节选示意）
import { readFileSync } from 'node:fs'
const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')
it('tokens.css 中的暗色 bg 与 tokens.ts 单点一致', () => {
  expect(css).toContain(`--color-bg: ${tokens.dark.bg};`) // 改 CSS 不改 TS → 红
})
```

### base.css 规则存在性断言（SITE-05/STYL-03 的自动化部分）
```typescript
it('原生输入控件 16px 兜底（D-21）', () => {
  expect(css).toMatch(/input\s*,\s*select\s*,\s*textarea\s*\{[^}]*font-size:\s*16px/)
})
it('reduced-motion 全局中和块（D-22）', () => {
  expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*animation-duration:\s*0\.01ms/)
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind 3 `darkMode: 'class'` JS 配置 | v4 `@custom-variant dark` CSS-first | Tailwind 4.0（2025-01） | 本项目已在用；无迁移成本 |
| tailwind.config.js 主题 | v4 `@theme` + CSS 变量运行时 | 同上 | 令牌即 CSS 变量，`.dark` 覆盖模式成立 |
| `useDark` 布尔双态 / `useColorMode` auto | 自组 useStorage+usePreferredColorScheme 三态 | 本阶段裁定 | no-preference 回落方向可控（D-01） |
| oneDark 硬编码编辑器主题 | 语义令牌对齐双主题 + Compartment | D-06 | 亮暗一致性与站点视觉统一 |
| WCAG 2.x 4.5:1 判定 | 仍为现行标准（WCAG 3 APCA 尚未转正） | WCAG 2.2（2023-10） | D-20 继续按 4.5:1，无需前瞻改造 |
| reduced-motion 逐动画处理 | 全局中和块（0.01ms + iteration-count:1） | CSS-Tricks 2019 模式，至今标准 | D-22 一条规则覆盖全站与 Phase 6 装饰 |

**Deprecated/outdated:**
- `maximum-scale=1`/`user-scalable=no` 防 iOS 缩放：现代 iOS 忽略（无障碍覆盖），唯一可靠解是 16px
- `document.execCommand('copy')` 作为主路径：已废弃，仅存于 useCopy 降级链内部
- `EditorView.darkTheme()` 单独 API：等价 `theme(spec, {dark:true})`，统一用后者

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@lucide/vue` 导出图标名为 `Moon`/`Sun`/`Monitor`（组件形态） | Pattern 5 | 低——名称错误会在 type-check 即刻暴露，改 import 即可 |
| A2 | useColorMode auto 在 no-preference 下解析为 light（基于 auto=usePreferredDark 的官方表述推理） | Pattern 2 Why-not | 低——即便此推断有偏，推荐方案根本不使用 useColorMode，结论（自组三态）不变 |
| A3 | CSS var() 字符串可直接用于 EditorView.theme spec 值 | Pattern 4 | 已绕开——推荐 tokens.ts 字面值方案，此假设不阻塞 |
| A4 | `.dark` 块与 `:root` 特异性同为 (0,1,0)、靠源顺序覆盖 | Pattern 1 | 低——CSS 级联规范行为 [CITED]；且构建后目测验证兜底 |
| A5 | reduced-motion 自动化只能做 CSS 内容断言（happy-dom 不计算媒体查询），行为正确性依赖 D-23 手动抽验 | Validation Architecture | 低——测试策略选择，非事实风险 |

## Open Questions

1. **ThemeToggle 在 home.layout 的精确落位**
   - What we know: D-03 锁定「顶栏右上角」；现有 header 是 `justify-between`（logo | nav 文本）
   - What's unclear: nav 文本与 toggle 的组合方式（并列右侧 vs toggle 替换位置）
   - Recommendation: planner 定（两者均满足 D-03）；建议并列并给 toggle 独立 `ml-4`
2. **@codemirror/theme-one-dark 移除时机**
   - What we know: D-06 后无引用；check-chunks 断言 c 要求存在含 CM 的懒加载 chunk（与 oneDark 无关）
   - What's unclear: 是否与 D-06 同 PR 清理
   - Recommendation: 同任务清理（避免死依赖）；移除后跑全量构建+check-chunks 验证
3. **base.css 16px 兜底是否扩展 `[contenteditable]`**
   - What we know: D-21 锁定 `input/select/textarea` 三选；本站暂无 contenteditable
   - Recommendation: 按 D-21 原文三选择器执行；contenteditable 留待真实需求
4. **亮色 `--color-border` 的具体值**
   - What we know: UI-SPEC 未给亮色 border 起点；原语灰阶未定
   - Recommendation: executor 在 D-07 策略内定（约 oklch(0.88 0.01 260) 起步），非文字用途不受 4.5:1 约束（UI 组件 3:1 若参与边界识别——Tabs 指示等消费 accent 不受影响）

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| node | 构建/测试 | ✓ | v24.18.0（满足 engines ^22.18.0 ‖ >=24.12.0 [VERIFIED: package.json:62]） | — |
| pnpm | 包管理（仅移除 oneDark 时） | ⚠️ 经 nvm shim 在非交互 shell 报错 | — | **`corepack pnpm …`**（corepack 0.35.0 已确认可用 [VERIFIED: 探测输出]） |
| vitest / vue-tsc 本地 bin | 测试/类型检查 | ✓ | node_modules/.bin 已确认 | — |
| 浏览器 DevTools 设备模拟 | D-23 手动抽验 | ✓（开发者本机） | — | 真机 iOS 抽验（作者自有设备） |

**Missing dependencies with no fallback:** none
**Missing dependencies with fallback:** pnpm 直调（用 corepack pnpm）

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.10 + happy-dom 20.13.2 + @vue/test-utils 2.4.11（86 个既有测试基线） |
| Config file | vitest.config.ts（happy-dom 环境，已存在） |
| Quick run command | `corepack pnpm vitest run src/styles/tokens.test.ts` |
| Full suite command | `corepack pnpm vitest run`（⚠️ `test:unit` = `vitest` 默认 watch，非交互场景必须 `vitest run`） |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STYL-01 | 关键色对双主题 ≥4.5:1；tokens.css↔tokens.ts 同步 | unit | `corepack pnpm vitest run src/styles/tokens.test.ts` | ❌ Wave 0 |
| STYL-03 | base.css reduced-motion 中和块存在且属性正确 | unit（CSS 内容断言） | `corepack pnpm vitest run src/styles/base-rules.test.ts` | ❌ Wave 0 |
| SITE-04 | 三态循环/持久化/no-preference 回落暗/系统联动；ThemeToggle 点击循环 + aria-label 三态文案 + 图标切换 | unit + component | `corepack pnpm vitest run src/composables/useThemeMode.test.ts src/ui/ThemeToggle.test.ts` | ❌ Wave 0 |
| SITE-05 | base.css 16px 兜底规则存在；Button/ThemeToggle 44px 源码级断言；Input 16px | unit + component | `corepack pnpm vitest run src/styles/base-rules.test.ts src/ui/` | ❌ Wave 0 + D-23 手动真机/设备模拟走 JSON 工具全流程 |
| UI-SPEC backstop | Button 长文案换行、CopyableText 限高滚动但复制全文、空内容禁用 | component | `corepack pnpm vitest run src/ui/` | ❌ Wave 0 |
| 六件套回归 | 迁移后全站 86 测试 + type-check 不破 | regression | `corepack pnpm vitest run && corepack pnpm type-check` | ✅ |

**Manual-only（D-23 明示，不引 E2E）:** iOS/设备模拟上走「输入→格式化→复制」完整流程：输入框聚焦不缩放、触控准确、复制反馈可达；系统开减弱动态效果后走查全站。Justification: 真实布局/媒体查询/虚拟键盘行为 happy-dom 无法模拟，D-23 已裁定手动抽验 + 单测断言规则的组合。

### Sampling Rate
- **Per task commit:** `corepack pnpm vitest run <触及文件的测试>`（或就近 *.test.ts）
- **Per wave merge:** `corepack pnpm vitest run && corepack pnpm type-check`
- **Phase gate:** 全量测试绿 + `corepack pnpm build && corepack pnpm check:chunks`（确认六件套/CM 主题无 chunk 泄漏）+ D-23 手动抽验记录

### Wave 0 Gaps
- [ ] `src/styles/tokens.test.ts` — 对比度算法 + 锚点 + 色对断言 + CSS↔TS 同步（STYL-01）
- [ ] `src/styles/base-rules.test.ts` — 16px 兜底 + reduced-motion 内容断言（SITE-05/STYL-03）
- [ ] `src/composables/useThemeMode.test.ts` — 三态状态机（SITE-04）
- [ ] `src/ui/{Button,Input,Card,Tabs,CopyableText,ThemeToggle}.test.ts` — 组件行为 + a11y 属性（D-19/UI-SPEC backstop）
- [ ] matchMedia mock fixture（happy-dom 无 matchMedia；参考 useCopy.test.ts 注入模式）
- [ ] Framework install: 无需（基建已在）

## Security Domain

### Applicable ASVS Categories（security_asvs_level: 1）

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | 纯前端无账户 |
| V3 Session Management | no | 无会话 |
| V4 Access Control | no | 无受保护资源 |
| V5 Input Validation | yes | 用户内容渲染一律 Vue 文本插值（自动转义）；唯一 HTML 出口 safe-html 管线不变；CopyableText 展示区禁 v-html |
| V6 Cryptography | no | 无加密需求 |

### Known Threat Patterns for 本 stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| localStorage 脏值流入 DOM 属性（classList/style.colorScheme） | Tampering | Pattern 2/3 白名单归一（非 'dark'/'light' → 'auto'）；classList.toggle(bool) 与 CSSOM 属性赋值本身非注入面 |
| 新组件引入 v-html 捷径 | Tampering/XSS | ESLint vue/no-v-html 已强制；六件套全部插值渲染；code review 检查 |
| head 内联脚本与未来 CSP 冲突 | — | Phase 3 若上 CSP 需为该脚本配 hash/nonce（记入 Phase 3 交接）；脚本无外部输入参与 |
| 复制到剪贴板的敏感内容残留 | Information Disclosure | 既有行为（useCopy）不变；无新增上报/存储（数据不出浏览器约束） |

## Sources

### Primary (HIGH confidence)
- Context7 `/tailwindlabs/tailwindcss.com` — @theme 机制（:root 生成/var() 引用/顶层限制）、@custom-variant dark、官方三态 FOUC 脚本模式
- Context7 `/vueuse/vueuse` — useDark/useColorMode/{system,store}/usePreferredColorScheme 完整语义、useDark 默认 storage key
- Context7 `/antfu-collective/vite-ssg` — index.html 模板地位、ssgOptions（mock/beasties/onBeforePageRender/onPageRendered）
- Context7 `/codemirror/view` + `/codemirror/website` — EditorView.theme({dark})/baseTheme &light&dark/Compartment reconfigure 官方示例
- bottosson.github.io/posts/oklab（OKLab 作者原文，本次成功抓取）— oklch→线性 sRGB 全部矩阵系数（公有领域参考实现）
- 本地实跑（node，tmp-contrast-check.mjs，已删除）：24 个 UI-SPEC 起点色对全部 PASS ≥4.5:1；黑白锚点 21.00:1 精确匹配
- 代码库 Read（In-repo discrete values，均本 session 直读）：src/styles/tokens.css:6,10-12,15-20,23,26-27；src/styles/base.css:9-12,54-60；src/composables/useCopy.ts:7；src/composables/useCopy.test.ts:11-17；package.json:20-62；scripts/check-chunks.mjs:128-159；index.html:1-13；src/main.ts；src/App.vue；src/router/routes.ts；src/components/ToolCard.vue；src/layouts/home.layout.vue；src/layouts/tool.layout.vue；src/pages/home.vue；src/pages/not-found.vue；src/tools/json-formatter/json-formatter.vue；src/tools/json-formatter/components/CodeMirrorJson.vue:14-49

### Secondary (MEDIUM confidence)
- MDN `@media/prefers-reduced-motion`（2026-06-10 抓取成功）— 中和模式、0.01ms 理由、平台测试设置路径
- accessibility.build《Accessible Tabs: WAI-ARIA Tabs Pattern Guide》(2026-07，CPACC 审校) — Tabs 全要求（与 W3C APG 一致；w3.org 本次全域 Cloudflare 拦截，未获原文）
- WCAG 2.1 SC 1.4.3 公式 — 5 独立来源交叉（CSDN/php.cn/知乎等，公式一致；W3C 原页拦截）
- iOS 16px 规则 — daisyUI issue #3871（2025-05）+ php.cn（2026-05）+ CSDN 多篇（2025-11）交叉
- `.planning/research/STACK.md`、`PITFALLS.md`、`ARCHITECTURE.md`（Phase 0 研究，多条已交叉印证）

### Tertiary (LOW confidence)
- 无（所有 LOW 项已剔除或升格为 ASSUMED 列入 Assumptions Log）

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 零新装，全部版本 Read 自 package.json；机制经官方文档查证
- Architecture: HIGH — 六模式全部有官方一手依据 + 代码库 ground truth 对齐；唯一未决项是预渲染默认类的小方案选择（两案皆可）
- Pitfalls: HIGH — 全部来自机制分析/既有代码实况/多源交叉，非泛泛清单
- 对比度起点值: HIGH — 实跑验证，非估算

**Research date:** 2026-09-07
**Valid until:** 2026-10-07（30 天；Tailwind/VueUse/vitest 均为稳定大版本线，无 fast-moving 依赖）
