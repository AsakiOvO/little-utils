# Phase 2: 设计系统与响应式/可访问性基线 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-07
**Phase:** 2-设计系统与响应式/可访问性基线
**Areas discussed:** 主题切换行为, 亮色主题视觉基调, 基础组件库清单, 基线如何验证

---

## 主题切换行为

### Q1 首次访问主题

| Option | Description | Selected |
|--------|-------------|----------|
| 跟随系统（推荐） | 无记录时用 prefers-color-scheme 判定，无偏好回落暗色 | ✓ |
| 一律暗色 | 品牌优先，首次访客一律暗色进站 | |

**User's choice:** 跟随系统（推荐）
**Notes:** 与 SITE-04「默认暗色、跟随系统偏好」最自然的解读一致

### Q2 切换形态

| Option | Description | Selected |
|--------|-------------|----------|
| 两态：暗⇄亮（推荐） | it-tools 同款一键切换，实现简单 | |
| 三态：暗/亮/系统 | 任何时刻可回到自动模式 | ✓ |

**User's choice:** 三态：暗/亮/系统
**Notes:** 用户手动选择后仍可一键回到跟随系统

### Q3 控件位置与形态

| Option | Description | Selected |
|--------|-------------|----------|
| 双 layout 顶栏图标按钮（推荐） | 右上角循环按钮，图标随状态变化（月亮/太阳/显示器） | ✓ |
| 双 layout 顶栏三段控件 | 三图标并排，占宽较大，移动端顶栏紧张 | |
| 仅工具页顶栏 | 首页暂不加切换入口 | |

**User's choice:** 双 layout 顶栏图标按钮（推荐）

### Q4 系统联动

| Option | Description | Selected |
|--------|-------------|----------|
| 跟随态实时联动（推荐） | 跟随态下系统偏好变化立即生效；手动选择后不受影响 | ✓ |
| 仅加载时读取一次 | 会话中系统切换不实时生效 | |

**User's choice:** 跟随态实时联动（推荐）

### Q5 防闪烁（FOUC）

| Option | Description | Selected |
|--------|-------------|----------|
| head 内联脚本同步设置（推荐） | 首屏绘制前挂 .dark 类与 color-scheme，零闪烁 | ✓ |
| Vue 挂载后切换 | 实现最简但进站会闪一下 | |

**User's choice:** head 内联脚本同步设置（推荐）

### Q6 CodeMirror 亮色主题

| Option | Description | Selected |
|--------|-------------|----------|
| 定制亮色 CodeMirror 主题（推荐） | EditorView.theme 定制，对齐站点令牌 | ✓ |
| 编辑器保持暗色 | 亮色页面里暗色编辑器视觉割裂 | |
| Phase 2 先暗色后补 | 降级项记录，后续补 | |

**User's choice:** 定制亮色 CodeMirror 主题（推荐）

---

## 亮色主题视觉基调

### Q1 亮色令牌策略

| Option | Description | Selected |
|--------|-------------|----------|
| 浅底+深霓虹双色体系（推荐） | 浅冷灰底 + 霓虹三色加深降饱和满足 4.5:1 | ✓ |
| 白底+仅文字深色化 | 霓虹仅作装饰，可读色板受限 | |
| 亮色大幅降饱和白天模式 | GitHub Light 式，氛围最弱 | |

**User's choice:** 浅底+深霓虹双色体系（推荐）

### Q2 发光处理

| Option | Description | Selected |
|--------|-------------|----------|
| 保留但降强度（推荐） | 透明度降低、颜色换深霓虹血统 | ✓ |
| 亮色完全去掉发光 | 氛围完全靠色相维持 | |

**User's choice:** 保留但降强度（推荐）

### Q3 令牌分层

| Option | Description | Selected |
|--------|-------------|----------|
| 原语→语义→组件（推荐） | 组件层仅在需要时建，避免过度抽象 | ✓ |
| 原语→语义→主题映射层 | 亮暗两套语义值作为独立主题层 | |
| 由 planner/researcher 定 | 只锁底线 | |

**User's choice:** 原语→语义→组件（推荐）

### Q4 切换过渡

| Option | Description | Selected |
|--------|-------------|----------|
| 瞬切（推荐） | 无全局过渡动画，避免大面积重绘 | ✓ |
| 全局短过渡 | 约 200ms 平滑过渡，需进 reduced-motion 清单 | |

**User's choice:** 瞬切（推荐）

### Q5 亮色下黄色处理

| Option | Description | Selected |
|--------|-------------|----------|
| 加深降饱和为琥珀色（推荐） | 保持三色血统齐整，色相偏离电光感 | ✓ |
| 亮色下黄色仅作装饰 | 黄色不做正文文字 | |

**User's choice:** 加深降饱和为琥珀色（推荐）

### Q6 功能语义色

| Option | Description | Selected |
|--------|-------------|----------|
| 补齐三色（推荐） | success/warning/danger + 背景/边框变体，亮暗双套 | ✓ |
| 暂不补 | 错误态先用 danger 单色顶替 | |

**User's choice:** 补齐三色（推荐）

### Q7 亮色 CodeMirror 底色

| Option | Description | Selected |
|--------|-------------|----------|
| 编辑器底色 = surface 语义色（推荐） | 编辑器与页面完全同步，视觉一体化 | ✓ |
| 编辑器底色独立偏白纸感 | 代码块卡片质感 | |

**User's choice:** 编辑器底色 = surface 语义色（推荐）

### Q8 D-05 边界

| Option | Description | Selected |
|--------|-------------|----------|
| 允许机制性搬迁（推荐） | 值不变，仅文件组织/映射方式调整 | ✓ |
| 严格不动 | 旧变量保留兼容，改造空间受限 | |

**User's choice:** 允许机制性搬迁（推荐）
**Notes:** D-05 本意是「不重新设计暗色配色」，非冻结文件结构

---

## 基础组件库清单

### Q1 组件清单

| Option | Description | Selected |
|--------|-------------|----------|
| 六件套（推荐） | Button/Input/Card/Tabs/CopyableText/ThemeToggle | ✓ |
| 五件套（ThemeToggle 不进库） | ThemeToggle 放 layouts/ 不进 src/ui/ | |
| 七件套（加 Select） | 时区工具有下拉场景，可能过度设计 | |

**User's choice:** 六件套（推荐）

### Q2 组件形态

| Option | Description | Selected |
|--------|-------------|----------|
| Vue SFC 组件（推荐） | 封装样式+行为+a11y，调用方零心智负担 | ✓ |
| 纯 CSS 类 + 原生标签 | 更轻但 16px/44px/aria 靠自觉 | |

**User's choice:** Vue SFC 组件（推荐）

### Q3 存量迁移

| Option | Description | Selected |
|--------|-------------|----------|
| 全量迁移（推荐） | 真实验证六件套 API 完备性，避免两套并存 | ✓ |
| 仅新组件落地，存量暂不动 | API 缺口要等真实使用才暴露 | |

**User's choice:** 全量迁移（推荐）

### Q4 尺寸体系

| Option | Description | Selected |
|--------|-------------|----------|
| 单一默认尺寸起步（推荐） | API 留 size prop 位置但不实现 | ✓ |
| sm/md 两档起步 | 分档边界易成主观设计 | |

**User's choice:** 单一默认尺寸起步（推荐）

### Q5 复制能力

| Option | Description | Selected |
|--------|-------------|----------|
| CopyableText 封装 useCopy（推荐） | 能力层/展示层分离，不重复实现 | ✓ |
| 组件内独立实现 | 两套剪贴板降级代码并存 | |

**User's choice:** CopyableText 封装 useCopy（推荐）

### Q6 命名注册

| Option | Description | Selected |
|--------|-------------|----------|
| 无前缀+按需导入（推荐） | 延续 safe-html 惯例，与工具自包含模式一致 | ✓ |
| Ui 前缀+按需导入 | 与现有 safe-html 命名不一致 | |

**User's choice:** 无前缀+按需导入（推荐）

### Q7 a11y 基线

| Option | Description | Selected |
|--------|-------------|----------|
| 组件内置完整 a11y（推荐） | focus-visible/Tabs 键盘导航/aria；Phase 6 冲刺 95 分零返工 | ✓ |
| 最小化：语义标签+焦点可见 | Phase 6 有返工面 | |

**User's choice:** 组件内置完整 a11y（推荐）

---

## 基线如何验证

### Q1 对比度验证

| Option | Description | Selected |
|--------|-------------|----------|
| 单元测试计算对比度（推荐） | 色值进 TS 常量模块，vitest 算 WCAG 对比度，改色即红 | ✓ |
| 构建脚本/独立命令校验 | check-contrast 脚本，多维护一条命令 | |
| Lighthouse/axe 手动验收 | 不可重复，仅辅助 | |

**User's choice:** 单元测试计算对比度（推荐）

### Q2 移动端规则落点

| Option | Description | Selected |
|--------|-------------|----------|
| 组件默认+全局兜底（推荐） | 组件内置 + base.css 原生标签 16px 兜底 | ✓ |
| 仅组件层 | 绕过组件的原生标签无保障 | |
| 仅全局 CSS | 组件失去独立防护 | |

**User's choice:** 组件默认+全局兜底（推荐）

### Q3 动效降级

| Option | Description | Selected |
|--------|-------------|----------|
| 全局媒体查询一刀切（推荐） | Phase 6 装饰动画天然被覆盖 | ✓ |
| 全局压时长+保留极短过渡 | 规则复杂，收益存疑 | |
| 逐处降级 | Phase 6 维护成本高 | |

**User's choice:** 全局媒体查询一刀切（推荐）

### Q4 移动端验收

| Option | Description | Selected |
|--------|-------------|----------|
| 单测断言+手动真机抽验（推荐） | 不新增 E2E 设施 | ✓ |
| 引入 Playwright 视口测试 | 新增一整套依赖与维护负担 | |

**User's choice:** 单测断言+手动真机抽验（推荐）

---

## Claude's Discretion

- 亮色令牌具体 oklch 色值（D-07 策略 + D-20 对比度约束内）
- 令牌文件组织与 CSS 变量命名细节
- 六件套 props/events 具体设计（清单与形态已锁）
- head 内联脚本具体实现与 vite-ssg 模板注入方式
- CodeMirror 亮色主题具体配色映射

## Deferred Ideas

None — discussion stayed within phase scope
