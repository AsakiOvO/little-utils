# Phase 1: 应用骨架与工具注册表契约 - Pattern Map

**Mapped:** 2026-09-04
**Files analyzed:** 37（规划新建文件，提取自 CONTEXT.md + RESEARCH.md）
**Analogs found:** 0 / 37

> ## ⚠️ Greenfield 状态：无既有代码模式可映射
>
> 本工作区为**空项目（greenfield）**，不存在任何应用源码，因此不存在可复制的代码库类比（analog）。
> **PATTERNS.md 的常规职责（从既有代码提取模式）在本阶段不适用。**
>
> **绿地验证过程（2026-09-04）：**
> - `list_dir` 根目录 → 空（仅 dot 目录不显示）
> - 递归搜索 `**/*.{ts,tsx,js,jsx,vue,py,go,rs}` → 仅命中 `.claude/hooks/`、`.codebuddy/hooks/`、`.cursor/hooks/` 下的 **GSD 工作流钩子**（agent 基础设施，非应用源码）
> - 搜索 `**/SKILL.md` → 仅 GSD 工作流技能，无项目级编码规范技能
> - 无 `package.json`、无 `src/`、无任何 `.vue` 文件
> - 与上游文档交叉确认：CONTEXT.md `<code_context>`「Reusable Assets: 无 — 工作区为空项目」；RESEARCH.md Runtime State Inventory「工作区无既有代码」

---

## Planner 指引：模式的权威来源是 RESEARCH.md

由于无代码库 analog，**planner 的模式来源不是本文件，而是 RESEARCH.md 的以下已验证模式块**（外部一手验证，其中注册表模式经 it-tools 源码级验证）。各规划文件已逐一映射到对应模式块：

| RESEARCH.md 模式块 | 覆盖的新文件 | 验证来源 |
|-------------------|-------------|---------|
| §Pattern 1（defineTool 契约与注册表） | `src/tools/tool.ts`、`src/tools/index.ts`、`src/tools/*/index.ts` | it-tools 源码级 + npm registry |
| §Pattern 2（路由 = 注册表纯派生，已定夺手写） | `src/router/routes.ts`、`src/pages/not-found.vue`、route meta 类型增强 | npm registry 弃用证据 + router.vuejs.org |
| §Pattern 3（CodeMirror 6 in Vue 3） | `json-formatter/components/CodeMirrorJson.vue` | codemirror.net 官方文档 |
| §Pattern 4（JSON 树形视图自研递归组件） | `JsonTree.vue`、`json-formatter.vue` | package-legitimacy 排除库方案 |
| §Pattern 5（XSS 消毒渲染管线 + ESLint 白名单） | `src/utils/sanitize.ts`、`src/ui/safe-html.vue`、`eslint.config.ts` | cure53 + eslint.vuejs.org |
| §Pattern 6（JSON tokenizer） | `json-formatter.service.ts` + 其测试 | ECMA-404 文法 + 多源精度共识 |
| §Pattern 7（时间戳转换 dayjs 插件链） | `timestamp-converter.service.ts` + `.vue` | dayjs 官方插件文档 |
| §Code Examples（vite.config / main.ts / tokens.css / App.vue / useCopy） | 入口、构建、令牌、布局切换、composable | Context7 官方文档一手抓取 |

---

## File Classification

> 全部文件均为**新建**（greenfield）。Data Flow 标注该文件承担的运行期数据流；"Analog" 一律为 none。

### 配置与构建

| 规划文件 | Role | Data Flow | Analog | 模式来源 |
|---------|------|-----------|--------|---------|
| `package.json` | config | — | none | RESEARCH Installation（`packageManager: pnpm@11.25.0`，corepack 供给） |
| `vite.config.ts` | config | build | none | RESEARCH Code Examples: vite.config.ts |
| `eslint.config.ts` | config | build（lint 卡口） | none | RESEARCH §Pattern 5（`vue/no-v-html` + `ignorePattern: '^sanitized'`） |
| `index.html` | entry | — | none | create-vue `--bare` 产物（改造为挂 createApp 导出） |
| `vitest.config.ts` | config/test | — | none | RESEARCH Validation Architecture（`environment: 'happy-dom'`，jsdom 回退注释） |
| `scripts/check-chunks.mjs` | utility | build gate | none | RESEARCH Wave 0 Gaps（工具 chunk 分离 + 首包无 @codemirror 断言） |

### 应用核心

| 规划文件 | Role | Data Flow | Analog | 模式来源 |
|---------|------|-----------|--------|---------|
| `src/main.ts` | entry | request-response（SSG） | none | RESEARCH Code Examples: main.ts（ViteSSG 包装 + `@unhead/vue/client`） |
| `src/App.vue` | root component | event-driven（route.meta.layout 切换） | none | RESEARCH Code Examples: App.vue |
| `src/router/routes.ts` | route | request-response | none | RESEARCH §Pattern 2（注册表 map 派生 + 404 置尾 + 不变量断言） |
| `src/router/index.d.ts`（或 env.d.ts 扩展） | type-augmentation | — | none | RESEARCH §Pattern 2 第二块（`declare module 'vue-router'` 合并 RouteMeta） |

### 工具注册表契约（本阶段核心交付）

| 规划文件 | Role | Data Flow | Analog | 模式来源 |
|---------|------|-----------|--------|---------|
| `src/tools/tool.ts` | model（全站契约） | — | none | RESEARCH §Pattern 1（ToolMeta 接口 + defineTool + isNew 派生） |
| `src/tools/index.ts` | store（单一事实来源） | — | none | RESEARCH §Pattern 1（toolCategories + tools + 派生 helpers + assertRegistryInvariants） |
| `src/tools/registry.test.ts` | test | — | none | RESEARCH Test Map ARCH-01 行 |

### JSON 格式化工具

| 规划文件 | Role | Data Flow | Analog | 模式来源 |
|---------|------|-----------|--------|---------|
| `src/tools/json-formatter/index.ts` | registration module | — | none | RESEARCH §Pattern 1 第三块（工具自注册 + `component: () => import()`） |
| `src/tools/json-formatter/json-formatter.vue` | page component | transform（输入→格式化+树，双栏） | none | RESEARCH §Pattern 4（共享同一份解析结果） |
| `src/tools/json-formatter/json-formatter.service.ts` | service（纯函数） | transform | none | RESEARCH §Pattern 6（tokenizer，零 Vue/DOM 依赖） |
| `src/tools/json-formatter/json-formatter.service.test.ts` | test | — | none | RESEARCH Test Map TOOL-01 行（往返属性测试 + 行列定位） |
| `src/tools/json-formatter/components/JsonTree.vue` | component（递归） | transform（递归 vnode 渲染） | none | RESEARCH §Pattern 4（默认展开深度 2、2^53 精度标记） |
| `src/tools/json-formatter/components/CodeMirrorJson.vue` | component（编辑器封装） | event-driven（updateListener → emit） | none | RESEARCH §Pattern 3（onMounted 创建 / onBeforeUnmount 销毁 / watch 单向同步） |

### 时间戳转换工具

| 规划文件 | Role | Data Flow | Analog | 模式来源 |
|---------|------|-----------|--------|---------|
| `src/tools/timestamp-converter/index.ts` | registration module | — | none | RESEARCH §Pattern 1 第三块 |
| `src/tools/timestamp-converter/timestamp-converter.vue` | page component | request-response（表单→结果回显） | none | RESEARCH §Pattern 7（识别结果回显纪律） |
| `src/tools/timestamp-converter/timestamp-converter.service.ts` | service（纯函数） | transform | none | RESEARCH §Pattern 7（utc 先于 timezone、detectUnit 启发） |
| `src/tools/timestamp-converter/timestamp-converter.service.test.ts` | test | — | none | RESEARCH Test Map TOOL-02 行 |

### 布局与页面

| 规划文件 | Role | Data Flow | Analog | 模式来源 |
|---------|------|-----------|--------|---------|
| `src/layouts/home.layout.vue` | layout component | — | none | RESEARCH D-03 + Pitfall 4（强风格基线，结构此阶段定型） |
| `src/layouts/tool.layout.vue` | layout component | — | none | RESEARCH D-03 + Pitfall 4（克制易读，只提供 slot/router-view + chrome） |
| `src/pages/home.vue` | page | — | none | RESEARCH 结构注释（不懒加载，LCP 关键页，it-tools 同款） |
| `src/pages/not-found.vue` | page | — | none | RESEARCH §Pattern 2（catch-all 路由组件） |

### 共享组件与工具

| 规划文件 | Role | Data Flow | Analog | 模式来源 |
|---------|------|-----------|--------|---------|
| `src/components/ToolCard.vue` | component | — | none | RESEARCH 结构注释（消费 Tool 元数据：icon/name/description） |
| `src/composables/useCopy.ts` | composable | request-response（剪贴板） | none | RESEARCH Code Examples: useCopy（`useClipboard({ legacy: true })`） |
| `src/composables/useCopy.test.ts` | test | — | none | RESEARCH Test Map 成功标准 #4 行（happy-dom 剪贴板 mock） |
| `src/ui/safe-html.vue` | component（安全边界） | transform（HTML 字符串→消毒） | none | RESEARCH §Pattern 5（全站唯一 v-html，绑定名必须 `sanitized*`） |
| `src/ui/safe-html.test.ts` | test | — | none | RESEARCH Test Map ARCH-04 行（注入载荷不产生可执行节点） |
| `src/utils/sanitize.ts` | utility | transform | none | RESEARCH §Pattern 5（DOMPurify + 无 DOM 环境退化为 escapeHtml） |
| `src/utils/sanitize.test.ts` | test | — | none | RESEARCH Test Map ARCH-04 行（`<script>`/`<img onerror>`/`javascript:` 剥离） |
| `src/utils/with-default-on-error.ts` | utility | transform | none | 仅见 RESEARCH 结构清单，无详细模式块 → planner 按 V7 轻量错误处理（`{ok,error}` 结构化返回）设计 |

### 样式

| 规划文件 | Role | Data Flow | Analog | 模式来源 |
|---------|------|-----------|--------|---------|
| `src/styles/tokens.css` | config（CSS 令牌） | — | none | RESEARCH Code Examples: tokens.css（@theme oklch + @custom-variant dark） |
| `src/styles/base.css` | style | — | none | RESEARCH 结构注释（reset、:root 暗色基线） |

---

## 本阶段确立的模式基线（供后续 Phase 的 Pattern Mapper 使用）

Phase 1 是全站契约定型阶段。**本阶段交付后，这些新文件将成为 Phase 2-8 的 analog 源**：

| Phase 1 产出 | 未来角色 |
|-------------|---------|
| `src/tools/tool.ts` + `tools/<slug>/` 目录形态 | Phase 5/8 批量工具的 registration-module analog |
| `src/tools/json-formatter/json-formatter.service.ts` | 后续"纯函数 service + 纯函数测试"工具的 service analog |
| `src/ui/safe-html.vue` + `src/utils/sanitize.ts` | 全站唯一渲染出口，任何新展示组件的安全 analog |
| `src/composables/useCopy.ts` | 后续 composables 的封装模式 analog |
| `src/styles/tokens.css` @theme 令牌 | Phase 2 主题系统与 Phase 6 视觉强化的地基（只消费语义类/变量，不硬编码色值） |
| `src/router/routes.ts` 派生式路由 | 新静态页面接入的路由 analog |
| 双 layout（home/tool） | D-03 锁定结构，Phase 4/6 只填内容不重构 |

**关键纪律（写入各 PLAN 的 action 时必须继承）：**
1. CodeMirror 只能被工具 chunk 静态引用，共享层（ui/composables/utils）禁止 import（RESEARCH Pitfall 2）
2. 浏览器 API 只出现在 onMounted/事件回调/守卫分支内（RESEARCH Pitfall 3）
3. 路由只能从 `tools.map()` 派生，禁止手写静态路由表/文件路由双真相（RESEARCH §Pattern 2）
4. JSON 工具主路径禁止 `JSON.parse`+`stringify`（精度丢失 + 键重排）（RESEARCH §Pattern 6）
5. service 零 Vue/DOM 依赖，返回结构化错误 `{ok, error}`（RESEARCH Security Domain V7）

## No Analog Found

| 文件（组） | Role | Data Flow | 原因 |
|-----------|------|-----------|------|
| **全部 37 个规划文件** | — | — | Greenfield：工作区无任何应用源码，不存在 analog |

## Metadata

**Analog search scope:** 工作区根目录全量（`/Users/estrella/Code/demo/little-utils`）
**Files scanned:** 74 个源码文件命中 —— 全部为 GSD 工作流钩子（`.claude/hooks/`、`.codebuddy/hooks/`、`.cursor/hooks/`），0 个应用源码
**Tracked-source gate (#3645):** 不适用 —— 本文件未命名任何 analog 路径
**Pattern extraction date:** 2026-09-04
**Planner 注意：** 本文件不提供代码摘录；请直接消费 RESEARCH.md §Pattern 1-7 与 §Code Examples（含完整可复制代码块），并落实上文 5 条关键纪律到各 plan action。
