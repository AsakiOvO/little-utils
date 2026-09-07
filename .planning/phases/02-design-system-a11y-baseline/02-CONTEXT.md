# Phase 2: 设计系统与响应式/可访问性基线 - Context

**Gathered:** 2026-09-07
**Status:** Ready for planning

<domain>
## Phase Boundary

交付站点级设计系统与响应式/可访问性基线：三层设计令牌体系（原语/语义/组件，含 WCAG 对比度自动校验）、暗色模式三态切换（暗/亮/跟随系统，持久化 + 防闪烁）、16px/44px 移动端规则、reduced-motion 全局降级、自研六件套基础组件库（含存量页面全量迁移）。本阶段不包含：首页/导航 glow/glitch/HUD 强风格化（Phase 6）、搜索/收藏/首页内容（Phase 4）、新工具（Phase 5/8）、SSG/部署（Phase 3）。

</domain>

<decisions>
## Implementation Decisions

### 主题切换行为
- **D-01:** 首次访问（localStorage 无记录且未手动切换过）跟随系统偏好（prefers-color-scheme），系统无偏好时回落暗色 — **Reversibility:** reversible
- **D-02:** 三态切换：暗 / 亮 / 跟随系统，任何时刻可回到自动模式；非两态 — **Reversibility:** reversible
- **D-03:** 切换控件为双 layout（home.layout / tool.layout）顶栏右上角的循环图标按钮，点击在 暗→亮→跟随系统 间循环，图标随状态变化（月亮/太阳/显示器）；新增工具页自动获得切换能力 — **Reversibility:** reversible
- **D-04:** 跟随系统态实时联动：处于「跟随系统」态时系统偏好变化立即生效（VueUse usePreferredColorScheme + watch）；用户手动选择后系统变化不影响，直到切回跟随态 — **Reversibility:** reversible
- **D-05:** 防闪烁（FOUC）：head 内联阻塞脚本在首屏绘制前读 localStorage 挂好 .dark 类与 color-scheme，零闪烁；保持 vite-ssg 预渲染 mounted 纪律（PITFALLS 既有先例）
- **D-06:** CodeMirror 编辑器定制亮色主题：EditorView.theme 定制亮色配色，背景/选区/行高亮对齐站点语义令牌（底色 = surface），语法高亮用深霓虹三色+中性色，随主题切换；不再硬用 oneDark

### 亮色主题与令牌体系
- **D-07:** 亮色令牌策略 = 浅冷灰底（保持 260 色相、偏离纯白）+ 深霓虹双色体系：霓虹三色在亮色下整体加深降饱和（青→深青蓝、品红→深紫红、电光黄→琥珀/金褐）满足 4.5:1；不做简单反转、不做 GitHub Light 式白天模式
- **D-08:** 发光效果亮色下保留但降强度：glow 阴影透明度降低、颜色换深霓虹血统；大面积装饰滥用留给 Phase 6 装饰层控制
- **D-09:** 三层设计令牌分层：①原语层（霓虹三色+中性灰阶原始值，不直接用于页面）→ ②语义层（bg/surface/text/border 等角色，亮暗两套映射到原语）→ ③组件层（仅组件需要时建，如 --input-border-focus，不强制、避免过度抽象）— **Reversibility:** costly — 语义层变量名是六件套组件与全部存量页面的消费契约，Phase 5 批量工具接入后改名/改层需触及所有消费方
- **D-10:** 语义层补齐 success/warning/danger 功能色 + 对应背景/边框变体，亮暗双套；基础组件错误态直接消费
- **D-11:** 主题切换瞬间颜色瞬切，无全局过渡动画（避免大面积重绘性能损耗，符合动效克制原则）
- **D-12:** D-05（Phase 1）「暗色令牌一字不动」解释为不重新设计暗色配色：值不变，允许机制性搬迁（从 @theme 搬进 .dark 选择器下、文件组织与映射方式调整）

### 基础组件库（六件套）
- **D-13:** 组件清单六件套：Button、Input（含 textarea 变体）、Card、Tabs、CopyableText（封装 useCopy + 复制按钮 + 成功反馈）、ThemeToggle（D-02/D-03 三态切换控件）；不建 Select（原生够用，避免过度设计）
- **D-14:** 组件形态 = Vue SFC：每个组件封装样式+默认行为+无障碍属性，调用方零心智负担；Phase 5 批量工具拿来即用 — **Reversibility:** costly — 组件 API 一旦被 Phase 5 七个工具消费即成向后兼容契约
- **D-15:** 存量页面全量迁移：home/not-found/双 layout/ToolCard/JSON 工具改用新组件，真实验证六件套 API 完备性，避免 Phase 4/6 改版时新旧两套并存
- **D-16:** 尺寸体系：单一默认尺寸起步（已满足 16px/44px 底线），API 留 size prop 位置但不实现
- **D-17:** CopyableText 封装复用现有 useCopy composable（能力层/展示层分离），不重复实现剪贴板逻辑
- **D-18:** 命名与注册：无前缀 + 按需导入，延续 safe-html 惯例（Button.vue/Input.vue 放 src/ui/，显式 import），与工具自包含模式一致、tree-shaking 友好
- **D-19:** 组件内置完整 a11y：focus-visible 焦点样式对齐霓虹色、Tabs 方向键导航 + roving tabindex、Input 关联 label/错误态 aria、按钮 aria-label 约定；Phase 6 冲刺 Lighthouse a11y ≥ 95 时组件层零返工

### 基线验证
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目定义
- `.planning/PROJECT.md` — 项目上下文、约束（纯前端/数据不出浏览器/赛博朋克风格/中文优先）、Key Decisions（D-04/D-05 Phase 1 令牌决策）
- `.planning/REQUIREMENTS.md` — 本阶段覆盖 STYL-01、STYL-03、SITE-04、SITE-05；Out of Scope 表（全量 UI 组件库被否决）
- `.planning/ROADMAP.md` §Phase 2 — 阶段目标与 5 条成功标准；§Phase 6（下游消费者：本阶段令牌/组件是其地基）

### 技术决策依据
- `.planning/research/STACK.md` — 版本清单与依赖纪律（What NOT to Use）
- `.planning/research/PITFALLS.md` — 赛博朋克 a11y 红线（霓虹对比度、reduced-motion）、SSG mounted 纪律
- `.planning/research/ARCHITECTURE.md` — 注册表驱动架构（本阶段 ThemeToggle 进双 layout 的接缝）

### Phase 1 决策与现状
- `.planning/phases/01-app-skeleton-tool-registry/01-CONTEXT.md` — D-04（oklch 令牌已定义）、D-05（Phase 2 只补切换不重做令牌，本阶段 D-12 已重释边界）、D-03（框架壳结构 Phase 4/6 只填不改）
- `src/styles/tokens.css` — 现有令牌：霓虹三色 oklch + 暗色语义底 + glow 阴影；`@custom-variant dark` 已声明未启用
- `src/styles/base.css` — 现有 reset 与暗色基线（color-scheme: dark 待改为动态）
- `src/composables/` useCopy — CopyableText 必须封装复用的能力层（含剪贴板降级处理与测试）

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/composables/useCopy` — 剪贴板能力（含降级），CopyableText 直接封装
- `@vueuse/core` 14.4.0 — usePreferredColorScheme/usePreferredDark 可支撑 D-01/D-04 三态联动
- `@lucide/vue` — 切换图标（月亮/太阳/显示器）与组件内图标来源
- `src/ui/safe-html.vue` + `.test.ts` — src/ui 目录惯例与组件测试先例
- vitest + happy-dom 测试基建（86 测试）— D-20 对比度测试与 D-23 组件断言跑在同一命令

### Established Patterns
- Tailwind 4 `@theme` + CSS 变量语义色：全部页面用 `var(--color-*)` 消费，令牌体系扩展沿此模式
- `@custom-variant dark (&:where(.dark, .dark *))` — 类切换变体已预留，D-05 防闪烁脚本只需挂 .dark 类
- 双 layout（route.meta.layout 驱动）：ThemeToggle 放两处 header 即全站生效
- 就近测试文件 `*.test.ts` 布局（Phase 1 决策）

### Integration Points
- `src/styles/tokens.css` / `base.css` — 三层令牌与全局规则（16px 兜底、reduced-motion）的落点
- `src/ui/` — 六件套组件的新家
- `src/layouts/home.layout.vue` / `tool.layout.vue` — ThemeToggle 挂载点
- `src/tools/json-formatter/components/CodeMirrorJson.vue` — oneDark 替换为亮/暗双主题切换（代码注释已预留此意图）
- 存量迁移面：`src/pages/home.vue`、`not-found.vue`、`ToolCard.vue`、JSON 工具 UI

</code_context>

<specifics>
## Specific Ideas

- 主题切换图标状态即语义：月亮=暗、太阳=亮、显示器=跟随系统，循环点击
- 亮色主题下赛博朋克血统靠「深霓虹色相 + 浅冷灰底」维持，不靠发光堆砌
- 对比度验证必须「改色即红」——色值单点维护进 TS 模块，防止 CSS 与测试数据漂移
- 成功标准 #2 验收场景：手机上完整走一遍 JSON 格式化工具（输入→格式化→复制）

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 2-设计系统与响应式/可访问性基线*
*Context gathered: 2026-09-07*
