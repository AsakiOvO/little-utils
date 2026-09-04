# Phase 1: 应用骨架与工具注册表契约 - Context

**Gathered:** 2026-09-04
**Status:** Ready for planning

<domain>
## Phase Boundary

交付可运行的站点骨架：Vite + Vue 3.5 + TypeScript + Tailwind 4 脚手架、`defineTool()` 工具注册表（派生路由/导航/分包）、XSS 消毒渲染管线、双 layout（home/tool）框架壳，并以 2 个真实工具（JSON 格式化、时间戳转换）验证全站契约。本阶段不包含：主题系统完整实现（Phase 2）、SSG/部署（Phase 3）、搜索/收藏（Phase 4）、其余工具（Phase 5/8）。

</domain>

<decisions>
## Implementation Decisions

### JSON 工具实现形态
- **D-01:** 输入区使用 CodeMirror 6（~45KB gz，随工具路由懒加载，不进首屏 bundle），提供行号、语法高亮、错误定位 — **Reversibility:** costly — CodeMirror 成为 Phase 5 正则测试器与后续编辑器类工具的共享依赖，换编辑器意味着多工具返工
- **D-02:** 输出视图为"格式化文本 + 可折叠树形视图"左右双栏；树形视图针对电商嵌套数据（深层对象/长数组）场景

### 站点骨架与首页形态
- **D-03:** Phase 1 即交付完整框架壳：顶栏 + 工具卡片网格 + 双 layout（home/tool）；Phase 4（站点体验）与 Phase 6（视觉强化）只填充内容/样式，不重构布局结构 — **Reversibility:** costly — 首页结构是 Phase 4/6 的改造基线，返工意味着两级 phase 连锁修改

### 视觉基调（为 Phase 2 预留）
- **D-04:** Phase 1 即用 Tailwind 4 `@theme` 定义霓虹青/品红/电光黄 oklch 设计令牌（STYL-01 提前落一半），页面以暗色底呈现但风格克制使用 — **Reversibility:** reversible
- **D-05:** Phase 2 只补亮色主题切换与 reduced-motion 降级，不重做令牌体系

### 工具图标方案
- **D-06:** 使用 lucide-vue-next，注册表 `icon` 字段存组件引用；按需导入、tree-shake 后每图标 <1KB，线性风格与赛博朋克视觉兼容 — **Reversibility:** costly — icon 字段类型（组件引用）是 defineTool 契约的一部分，Phase 5 批量工具接入后修改需触及全部工具目录

### Claude's Discretion
- defineTool 契约的具体字段清单与 TS 类型设计（除 icon 为组件引用外）
- 时间戳工具的具体 UI 布局
- XSS 消毒渲染管线的具体技术选型（DOMPurify 等由 researcher/planner 验证）
- ESLint 配置细节（禁 v-html 规则）
- 路由派生的具体实现机制（unplugin-vue-router vs 手写派生，research 阶段二选一定夺）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目定义
- `.planning/PROJECT.md` — 项目上下文、核心价值、约束（纯前端/数据不出浏览器/赛博朋克风格/中文优先）
- `.planning/REQUIREMENTS.md` — v1 需求（本阶段覆盖 ARCH-01/02/04、TOOL-01/02）
- `.planning/ROADMAP.md` §Phase 1 — 阶段目标与 4 条成功标准

### 技术决策依据
- `.planning/research/SUMMARY.md` — 关键栈选型与架构共识（Vue 3.5/Vite 8/Tailwind 4/CodeMirror 6）
- `.planning/research/STACK.md` — 版本清单、依赖纪律（What NOT to Use）、pnpm
- `.planning/research/ARCHITECTURE.md` — 注册表驱动架构模式（it-tools 源码级验证）：工具自包含目录、defineTool 元数据、路由/导航/搜索/sitemap 派生、懒加载链路、SSG 期间的 mounted 纪律
- `.planning/research/PITFALLS.md` — XSS 渲染管线（Critical）、bundle 膨胀、赛博朋克 a11y 红线、工具"验收三件套"
- `.planning/research/SUPPLEMENT.md` — 网络恢复后的补充验证（无需求变更）

### 工作流配置
- `.planning/config.json` — YOLO 模式、standard 粒度、并行执行、inherit 模型

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 无 — 工作区为空项目（greenfield），全部新建

### Established Patterns
- 无既有代码；本阶段建立的注册表契约、双 layout、消毒管线将成为全站模式基线

### Integration Points
- `tools/`（或 `src/tools/`）目录结构 = 后续 Phase 5/8 批量工具的接入点
- `defineTool()` 类型契约 = 路由/导航/搜索/收藏/sitemap 五个消费方的数据源
- Tailwind 4 `@theme` 令牌 = Phase 2 主题系统与 Phase 6 视觉强化的地基

</code_context>

<specifics>
## Specific Ideas

- 树形 JSON 视图强调电商嵌套数据的可折叠浏览体验（作者日常苏宁易购接口调试场景）
- 时间戳转换需含时区显示（成功标准 #2）
- XSS 验收标准明确：粘贴含 `<script>`/`<img onerror>` 的内容仅渲染为纯文本，不执行任何脚本

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 1-应用骨架与工具注册表契约*
*Context gathered: 2026-09-04*
