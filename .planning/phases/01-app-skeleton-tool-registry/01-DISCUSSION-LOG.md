# Phase 1: 应用骨架与工具注册表契约 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-04
**Phase:** 1-应用骨架与工具注册表契约
**Areas discussed:** JSON 编辑器形态, Phase 1 首页形态, Phase 1 视觉基调, 工具图标方案

---

## JSON 编辑器形态

| Option | Description | Selected |
|--------|-------------|----------|
| CodeMirror 6 先行 | Phase 1 就引入（~45KB gz，懒加载不进首包），行号/语法高亮/错误定位一步到位，Phase 5 正则工具直接复用 | ✓ |
| textarea 先行 | Phase 1 最简实现，CodeMirror 延后到 Phase 5 统一引入；代价是 JSON 工具体验廉价且后续需返工 | |
| 你来定 | 由规划 agent 权衡后决定 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 格式化+树视图 | 格式化文本 + 可折叠树形视图（电商嵌套数据常用），左右双栏 | ✓ |
| 仅格式化文本 | 格式化/压缩/校验结果以文本呈现，实现最简 | |
| 你来定 | 由规划 agent 权衡 | |

**User's choice:** CodeMirror 6 先行；格式化 + 树视图双栏
**Notes:** 用户两次均直接采纳推荐项

---

## Phase 1 首页形态

| Option | Description | Selected |
|--------|-------------|----------|
| 完整框架壳 | 顶栏 + 工具卡片网格 + 双 layout 骨架（home/tool），Phase 4/6 只填肉不返工 | ✓ |
| 极简占位 | 最简工具链接列表，能跳转能用即可，Phase 4 重做首页 | |
| 你来定 | 由规划 agent 权衡 | |

**User's choice:** 完整框架壳
**Notes:** 无补充

---

## Phase 1 视觉基调

| Option | Description | Selected |
|--------|-------------|----------|
| 令牌预留+暗色底 | Tailwind 4 @theme 定义霓虹三色 oklch 令牌 + 暗色底，克制使用；Phase 2 只做亮色与降级 | ✓ |
| 纯灰暗色先行 | 中性深灰暗色硬编码，令牌完全留给 Phase 2 | |
| 你来定 | 由规划 agent 权衡 | |

**User's choice:** 令牌预留 + 暗色底
**Notes:** 无补充

---

## 工具图标方案

| Option | Description | Selected |
|--------|-------------|----------|
| lucide-vue-next | 按需导入、tree-shake 后每图标 <1KB，风格统一线性，与赛博朋克线条风兼容 | ✓ |
| emoji | 零依赖、零体积，但跨平台渲染不一致、风格难统一 | |
| 纯文字标识 | 用工具名首字/缩写做标识，最克制但辨识度一般 | |
| 你来定 | 由规划 agent 权衡 | |

**User's choice:** lucide-vue-next
**Notes:** 无补充

---

## Claude's Discretion

- defineTool 契约字段清单与 TS 类型设计
- 时间戳工具 UI 布局
- XSS 消毒管线技术选型
- ESLint 配置细节
- 路由派生实现机制（unplugin-vue-router vs 手写派生）

## Deferred Ideas

- 无
