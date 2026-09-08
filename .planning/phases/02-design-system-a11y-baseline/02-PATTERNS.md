# Phase 2: 设计系统与响应式/可访问性基线 - Pattern Map

**Mapped:** 2026-09-07
**Files analyzed:** 21（9 新建 + 12 修改）
**Analogs found:** 18 / 21（其余 3 个为纯新建物，RESEARCH Pattern 已给实现骨架）

> 本阶段特殊性：12 个"修改文件"自身就是最直接基线（迁移面 = 原地重构）。对这批文件，analog 栏标 **baseline**，摘录现状关键行作为迁移起点。对 9 个新建文件，analog 是既有同角色先例。

## File Classification

| 新/改文件 | 角色 | 数据流 | Closest Analog | Match Quality |
|-----------|------|--------|----------------|---------------|
| `src/styles/tokens.css`（改） | config/令牌层 | transform | 自身基线（RESEARCH §Pattern 1 骨架） | baseline |
| `src/styles/base.css`（改） | config/reset | transform | 自身基线 | baseline |
| `src/styles/tokens.ts`（新） | utility/常量模块 | transform | `scripts/check-chunks.mjs`（fs 读文本对偶）+ `tokens.css`（值单点约束） | partial（新建物） |
| `src/styles/tokens.test.ts`（新） | test/纯函数+fs | batch | `useCopy.test.ts`（mock 注入）+ `check-chunks.mjs`（readFileSync 断言） | role-match |
| `src/styles/base-rules.test.ts`（新） | test/fs 内容断言 | batch | `scripts/check-chunks.mjs` | role-match |
| `src/composables/useThemeMode.ts`（新） | composable/状态机 | event-driven | `src/composables/useCopy.ts` | role-match |
| `src/composables/useThemeMode.test.ts`（新） | test/composable | batch | `useCopy.test.ts` | role-match |
| `src/ui/Button.vue`（新） | component/交互件 | request-response | `safe-html.vue`（形态）+ `tool.layout.vue:6-12`（边框交互件样式） | role-match |
| `src/ui/Input.vue`（新） | component/表单件 | request-response | `safe-html.vue`（形态） | role-match |
| `src/ui/Card.vue`（新） | component/容器件 | request-response | `ToolCard.vue:3-6` + `home.vue:12-20`（卡片样式现状） | role-match |
| `src/ui/Tabs.vue`（新） | component/导航件 | event-driven | `JsonTree.vue`（交互+内部状态先例） | role-match |
| `src/ui/CopyableText.vue`（新） | component/展示+复制 | event-driven | `json-formatter.vue:75-111`（复制按钮反馈现状）+ `useCopy.ts`（D-17 必须封装） | role-match |
| `src/ui/ThemeToggle.vue`（新） | component/控件 | event-driven | `useCopy.ts`（composable 消费）+ `JsonTree.vue`（button 交互） | role-match |
| `src/ui/{六件套}.test.ts`（新） | test/component | batch | `safe-html.test.ts` + `ToolCard.test.ts` | role-match |
| `src/tools/json-formatter/components/cm-theme.ts`（新） | utility/CM 主题 | transform | `CodeMirrorJson.vue:27-30`（EditorView.theme 现有用法） | role-match |
| `CodeMirrorJson.vue`（改） | component | event-driven | 自身基线（oneDark 替换点） | baseline |
| `index.html`（改） | config/SSG 模板 | — | 自身基线 + `vite.config.ts`（ssgOptions 接缝） | baseline |
| `home.layout.vue` / `tool.layout.vue`（改） | layout | request-response | 自身基线（ThemeToggle 挂载点） | baseline |
| `home.vue` / `not-found.vue`（改） | page | request-response | 自身基线（Card 迁移面） | baseline |
| `ToolCard.vue`（改） | component | request-response | 自身基线（Card 迁移面） | baseline |
| `json-formatter.vue`（改） | tool page | request-response | 自身基线（Button/CopyableText 迁移面） | baseline |

*全部 analog 已验证 git-tracked（`git ls-files` 2026-09-07，零镜像路径）。*

## Pattern Assignments

### 六件套 `src/ui/{Button,Input,Card,Tabs,CopyableText,ThemeToggle}.vue`（component）

**Analog:** `src/ui/safe-html.vue`（同目录、同形态、同命名惯例的直接先例——D-18 指名延续）

**组件文件形态**（safe-html.vue:1-16 全文）：
```vue
<!-- src/ui/safe-html.vue —— 全站唯一允许 v-html 的组件（ARCH-04 唯一 HTML 字符串出口） -->
<template>
  <div class="safe-html" v-html="sanitizedHtml" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { sanitizeHtml } from '../utils/sanitize'

const props = defineProps<{ html: string }>()

const sanitizedHtml = computed(() => sanitizeHtml(props.html))
</script>
```
**要复制的结构：** ① 文件头中文注释引用决策编号（ARCH-XX/D-XX）；② `<template>` 在前 `<script setup lang="ts">` 在后；③ `defineProps<{...}>()` 泛型签名；④ **无 `<style>` 块**——样式全部走 Tailwind utility（全库组件零 style 块先例：safe-html/JsonTree/ToolCard/两 layout）。

**props 带默认值 + 自命名**（JsonTree.vue:70-80）：
```typescript
defineOptions({ name: 'JsonTree' })

const props = withDefaults(defineProps<{ node: TreeNode; depth?: number }>(), { depth: 0 })
```
Tabs/Input/CopyableText 需要默认值 props 时照此（D-16 size prop 留位可实现为 optional + withDefaults）。

**emits 类型签名**（CodeMirrorJson.vue:20-21）：
```typescript
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
```
Input（textarea 变体）的 v-model 契约照此形态。

**交互件样式基线**（tool.layout.vue:6-12，tool.layout 返回按钮 = Button/ThemeToggle 的视觉起点）：
```vue
<RouterLink
  to="/"
  class="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]"
>
  <span aria-hidden="true">←</span>
  <span>返回首页</span>
</RouterLink>
```
**迁移方向：** 保留 `rounded-md border` 圆角边框语言；`text-sm`(14px) 文字改由内层 span 承担、根元素加 `min-h-11`（44px，D-21）；focus-visible 焦点环消费 `--color-neon-cyan`（D-19）。

**Card 样式基线**（ToolCard.vue:3-6 / home.vue:12-20，Card.vue 的视觉起点）：
```vue
<!-- ToolCard 现状：卡片语言 = rounded-lg + border + surface + p-5 -->
<RouterLink
  :to="tool.path"
  class="group flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-neon-cyan)] hover:bg-[var(--color-surface-raised)]"
>
<!-- home.vue 空态卡：rounded-lg + border + bg-surface + p-10 text-center -->
```
**迁移方向：** Card.vue 抽取 `rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-*` 为默认插槽容器；ToolCard/home 空态/not-found 改消费 `<Card>`。

**按钮 + 复制反馈先例**（json-formatter.vue:77-89，CopyableText 的行为模板）：
```vue
<button
  type="button"
  class="rounded-md border px-2 py-1 text-xs transition-colors"
  :class="
    isCopied('formatted')
      ? 'border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)]'
      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan)]'
  "
  aria-label="复制格式化文本"
  @click="copyValue('formatted', parsed.formatted)"
>
  {{ isCopied('formatted') ? '已复制' : '复制' }}
</button>
```
配套驱动状态（json-formatter.vue:171-182）：
```typescript
const { copy, copied } = useCopy()
const lastCopiedKey = ref<string | null>(null)

async function copyValue(key: string, value: string): Promise<void> {
  await copy(value)
  lastCopiedKey.value = key
}

function isCopied(key: string): boolean {
  return copied.value && lastCopiedKey.value === key
}
```
**CopyableText 迁移方向：** 把「copy + copied 窗口反馈 + 复制按钮 + aria-label」收进组件内部（内部调 `useCopy()`，D-17）；成功态样式沿用 `border/text-neon-cyan` 语言；展示区一律 `{{ }}` 插值（禁 v-html，RESEARCH V5）。

---

### `src/composables/useThemeMode.ts`（composable，event-driven）

**Analog:** `src/composables/useCopy.ts`（同目录唯一先例：VueUse 薄封装 + Don't Hand-Roll 头注释 + 单一导出函数）

**完整先例**（useCopy.ts:1-9 全文）：
```typescript
// src/composables/useCopy.ts — 全站复制基建（成功标准 #4，RESEARCH Code Examples）
// Don't Hand-Roll：禁止裸调 navigator.clipboard——useClipboard({ legacy: true })
// 提供安全上下文缺失时的 document.execCommand('copy') 降级路径。
import { useClipboard } from '@vueuse/core'

export function useCopy() {
  const { copy, copied, isSupported } = useClipboard({ legacy: true, copiedDuring: 1500 })
  return { copy, copied, isSupported }
}
```
**要复制的惯例：** ① 头注释写明「禁止裸调底层 API + 为什么」（useThemeMode 对应：禁止 useDark/useColorMode、禁止裸 matchMedia，RESEARCH §Pattern 2）；② 能力委托给 VueUse；③ 返回解构对象。**差异点：** useCopy 无状态跨调用共享需求；useThemeMode 需模块级单例（RESEARCH 骨架 `singleton ??= createThemeMode()`）+ storage key 全站唯一导出常量 `THEME_STORAGE_KEY = 'little-utils:v1:theme'`（PITFALLS 键前缀惯例全站首落地）。**SSG 纪律：** DOM 副作用前 `typeof document === 'undefined'` 守卫 + `useStorage` 的 `initOnMounted: true`（先例=CodeMirrorJson onMounted 才建视图，见下）。

**消费方式先例**（json-formatter.vue:172）：
```typescript
const { copy, copied } = useCopy()
```
ThemeToggle 内照此消费 `const { preference, resolved, cycle } = useThemeMode()`。

---

### `src/composables/useThemeMode.test.ts`（test）

**Analog:** `src/composables/useCopy.test.ts`（同目录 composable 测试先例：环境缺口用注入/mock 弥合）

**注入模式**（useCopy.test.ts:11-17 + 39-44）：
```typescript
function patchNavigator(prop: string, value: unknown): void {
  Object.defineProperty(window.navigator, prop, { value, configurable: true })
}

function unpatchNavigator(prop: string): void {
  delete (window.navigator as unknown as Record<string, unknown>)[prop]
}
// ...
vi.stubGlobal(
  'ClipboardItem',
  class FakeClipboardItem { constructor(public data: Record<string, string>) {} },
)
```
**要复制的纪律：** ① beforeEach 注入 / afterEach `vi.unstubAllGlobals()` 清理成对（useCopy.test.ts:47-52）；② 头注释写明「happy-dom 环境缺口 + 为什么这样 mock」（useCopy.test.ts:2-7 三行环境说明）；③ fake timers 用 `vi.useFakeTimers()`/`useRealTimers()` 成对。**useThemeMode 版：** happy-dom 无真实 matchMedia → `vi.stubGlobal('matchMedia', ...)` mock（RESEARCH Pitfall 5 点名此路径）；localStorage 隔离用 happy-dom 自带 per-origin storage 或 beforeEach 清理。**注意单例：** 测试间需重置模块级 singleton（`vi.resetModules()` + 动态 import，或导出测试用 reset 钩子）。

---

### `src/ui/*.test.ts` × 6（test/component）

**Analog:** `src/ui/safe-html.test.ts`（同目录组件测试先例）+ `src/components/ToolCard.test.ts`（含 router 上下文与 mount helper 先例）

**mount + DOM 断言先例**（safe-html.test.ts:24-37）：
```typescript
const wrapper = mount(SafeHtml, {
  props: { html: '<script>alert(1)</script><img src=x onerror=alert(1)>' },
})
expect(wrapper.element.querySelector('script')).toBeNull()
```

**mount helper + router 上下文 + 测试夹具工厂**（ToolCard.test.ts:9-23, 25-38）：
```typescript
const FakeIcon = () => h('span', { class: 'fake-icon' })

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
})

function mountToolCard(tool: Tool) {
  return mount(ToolCard, { props: { tool }, global: { plugins: [router] } })
}

function makeTool(overrides: Partial<Tool> = {}): Tool {
  return { name: 'JSON 格式化', /* ... */ ...overrides }
}
```
**要复制的惯例：** ① 头注释说明环境选择理由；② mount helper 函数收敛重复 props；③ `makeXxx(overrides)` 工厂（六件套组件测试可用 `makeProps()` 同型）；④ 正/反断言成对（isNew true/false 两 case 的写法，ToolCard.test.ts:59-67）。

**环境注释先例**（safe-html.test.ts:1-5）：
```typescript
// @vitest-environment jsdom
// jsdom 回退原因同 src/utils/sanitize.test.ts（A4：happy-dom 20.13.2 与 DOMPurify 3.4.14
// 的 Node.prototype.nodeName 缓存 getter 不兼容，详见 01-03-SUMMARY）。
```
**含义：** 本库组件测试默认 happy-dom（vitest.config.ts），仅遇依赖兼容问题时才文件头切 jsdom 并写明理由——六件套测试无外部依赖，应留在 happy-dom 并按 Pitfall 5 做源码级断言（`min-h-11`/字号类字符串断言，不测 getBoundingClientRect）。

---

### `src/tools/json-formatter/components/cm-theme.ts`（utility，transform）

**Analog:** `src/tools/json-formatter/components/CodeMirrorJson.vue`（同目录、CM 6 API 用法先例；oneDark 替换点即本文件消费者）

**EditorView.theme 现有用法**（CodeMirrorJson.vue:27-30）：
```typescript
const fitHeightTheme = EditorView.theme({
  '&': { height: '100%' },
  '.cm-scroller': { overflow: 'auto' },
})
```
**extensions 组装位置**（CodeMirrorJson.vue:36-45）：
```typescript
view = new EditorView({
  extensions: [
    basicSetup,
    json(),
    linter(jsonParseLinter()),
    oneDark, // ← line 17 import，D-06 后删除并换 cm-theme 的 Compartment
    fitHeightTheme,
    EditorView.updateListener.of((u) => { /* ... */ }),
  ],
  doc: props.modelValue,
  parent: el,
})
```
**懒加载边界头注释**（CodeMirrorJson.vue:2-3，cm-theme.ts 必须复制此纪律声明）：
```
<!-- 懒加载边界：CM 包仅被本组件静态 import → 只落进 json-formatter 工具 chunk；
     共享层（ui/composables/utils/pages/layouts）出现任何引用即违反 ARCH-02（Pitfall 2）。 -->
```
**主题切换载体**（CodeMirrorJson.vue:52-60 watch 单向同步模式，Compartment reconfigure 照此挂 watch）：
```typescript
watch(
  () => props.modelValue,
  (v) => {
    const current = view?.state.doc.toString()
    if (view && v !== current) {
      view.dispatch({ changes: { from: 0, to: current?.length ?? 0, insert: v } })
    }
  },
)
```
**要复制的惯例：** ① `EditorView.theme(spec)` / `HighlightStyle.define` + `syntaxHighlighting` 打包进一个 `Compartment`（RESEARCH §Pattern 4 骨架）；② 生命周期纪律——`onMounted` 才创建视图、`onBeforeUnmount` 销毁置 null（CodeMirrorJson.vue:32-49, 62-65）；③ cm-theme.ts 只准放 json-formatter/components/ 内（check-chunks.mjs:149-157 断言首包可达集零 CM 字样）；④ 色值从 `src/styles/tokens.ts` 取字面 oklch 字符串（非 `var()`，RESEARCH A3 已绕开）。

---

### `src/styles/tokens.ts`（utility/常量模块，新建物）

**对偶约束来源:** `src/styles/tokens.css`（值必须逐字一致——CONTEXT Specific Ideas「色值单点维护进 TS 模块，防 CSS 与测试数据漂移」）

**现状令牌值**（tokens.css:10-12, 15-20, 23, 26-27，TS 常量的取值来源与 sync 断言对象）：
```css
--color-neon-cyan: oklch(0.85 0.16 195);
--color-neon-magenta: oklch(0.72 0.24 330);
--color-neon-yellow: oklch(0.92 0.19 105);

--color-bg: oklch(0.16 0.02 260);
--color-surface: oklch(0.2 0.025 260);
--color-surface-raised: oklch(0.24 0.03 260);
--color-text-primary: oklch(0.93 0.01 260);
--color-text-muted: oklch(0.65 0.02 260);
--color-border: oklch(0.3 0.03 260);

--font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;

--shadow-glow-cyan: 0 0 12px oklch(0.85 0.16 195 / 0.35);
--shadow-glow-magenta: 0 0 12px oklch(0.72 0.24 330 / 0.3);
```
**导出结构：** 按 RESEARCH §Pattern 4 消费形态 `tokens.dark.surface / tokens.light['text-primary'] / tokens.neon.cyan / tokens.light['neon-cyan-deep']` 组织为双主题嵌套常量 + oklch 字符串解析辅助函数。**无既有 TS 常量模块 analog**（纯新建物）；同库风格参照 `json-formatter.service.ts` 的「常量+类型导出+头注释」形态。

---

### `src/styles/tokens.test.ts` / `src/styles/base-rules.test.ts`（test/fs 内容断言）

**Analog:** `useCopy.test.ts`（describe/it 中文描述与 mock 注入风格）+ `scripts/check-chunks.mjs`（node:fs 读文件 + 正则/包含断言的既有先例）

**fs 读文件 + 断言先例**（check-chunks.mjs:105-114, 147-152）：
```javascript
if (!existsSync(abs)) continue
for (const dep of extractChunkImports(readFileSync(abs, 'utf8'))) { /* ... */ }

if (!existsSync(distDir)) {
  violations.push('VIOLATION: dist/ 不存在 —— 请先运行构建（corepack pnpm build）')
}
// ...
if (!/codemirror/i.test(readFileSync(abs, 'utf8'))) continue
violations.push(`VIOLATION: 首包（入口页可达集）泄漏 codemirror 字样: ${ref}（…）`)
```
**要复制的惯例：** ① `readFileSync(path, 'utf8')` 读源文件文本 + 正则/`toContain` 断言；② 失败消息自带修复指引（「请先运行构建」式文案——测试红时执行者照着做）。RESEARCH §Code Examples 已给两个测试骨架（tokens.css↔tokens.ts 同步断言用 `new URL('./tokens.css', import.meta.url)`，base.css 用 `toMatch(/input\s*,\s*select…/)`），直接套此风格。

---

### 修改面文件（12 个，baseline = 自身现状摘录）

#### `src/styles/tokens.css`（改）
现状全文 29 行（见上节令牌摘录）。改造点：① 暗色语义值（:15-20）+ glow 暗值（:26-27）从 `@theme` 搬进其后的 `.dark` 块（值一字不动，D-12）；② `@theme` 补亮色语义 + D-10 功能色亮暗两套；③ `@custom-variant dark`（:6）保持原样；④ 末尾加 `:root { color-scheme: light }` / `.dark { color-scheme: dark }`；⑤ **`.dark` 块必须置于 `@theme` 之后**（特异性同为 (0,1,0) 靠源顺序，RESEARCH Pitfall 2）。

#### `src/styles/base.css`（改）
改造锚点：`html { color-scheme: dark; }`（:9-12）改动态化；`:54-60` 已有 `button, input, select, textarea { font: inherit; color: inherit; }`——16px 兜底规则（D-21）就在此选择器组旁边落；新增 reduced-motion 中和块（D-22）与全局 `:focus-visible` 兜底（D-19）。

#### `index.html`（改）
现状 head 仅 6 行（charset/favicon/viewport/title）。FOUC 脚本注入点 = `<meta charset="UTF-8">`（:4）之后、其它资源之前；vite-ssg 以此文件为全路由共享模板原样透传（RESEARCH §Pattern 3）。备选接缝：`vite.config.ts` 的 `ssgOptions`（:21-26）已有 `includedRoutes` 钩子先例，`onBeforePageRender` 加默认 `class="dark"` 同型可插。

#### `src/layouts/home.layout.vue` / `tool.layout.vue`（改）
ThemeToggle 挂载点 = 各自 header 的 `justify-between`（home :5-14）/ `gap-4`（tool :5-14）行内容器。home 现状 header 右侧仅 `<nav>` 文本（:13），toggle 并列其后（RESEARCH Open Question 1 建议 `ml-4` 并列）；tool 现状右侧仅品牌文本（:13）。**glow 消费方式**（home.layout.vue:7-11，D-08 亮色降强度后消费代码不变）：`class="… text-[var(--color-neon-cyan)] shadow-[var(--shadow-glow-cyan)]"`。

#### `src/pages/home.vue`（改）
迁移面：空态卡（:12-20）→ `<Card>`；分类空态虚线卡（:28-33）→ `<Card variant>` 或保留虚线样式；ToolCard 消费不动。`import ToolCard from '../components/ToolCard.vue'`（:45）的显式 import 惯例 = 六件套引入方式。

#### `src/pages/not-found.vue`（改）
迁移面：返回首页 RouterLink（:6-11）→ `<Button as 链接>` 或沿用样式 + min-h-11；其余为纯文本令牌消费，改动极小。

#### `src/components/ToolCard.vue`（改）
迁移面：根 RouterLink 卡片样式（:3-6）→ 换 `<Card>` 容器或 Card 样式类 + hover accent 保留 `hover:border-[var(--color-neon-cyan)]`；icon 消费 `<component :is="tool.icon" class="size-6" aria-hidden="true" />`（:9）为组件内图标先例（ThemeToggle 的 lucide 图标照此 + aria-hidden）。

#### `src/tools/json-formatter/json-formatter.vue`（改）
迁移面（Button）：格式化/压缩按钮（:20-45）与两处复制按钮（:77-89, 98-110）→ `<Button variant>` + `<CopyableText>`；错误卡 role="alert"（:53-62）的 a11y 先例供 Input 错误态参考。**迁移后 self-check：** 该页是 D-23 手动验收（输入→格式化→复制）与 86 测试回归的载体。

#### `CodeMirrorJson.vue`（改）
改动点（其余不动）：删 `import { oneDark } from '@codemirror/theme-one-dark'`（:17）与 extensions 中 `oneDark`（:40）；引入 `cm-theme.ts` 的 Compartment + `watch(resolved, …)` dispatch reconfigure；`@codemirror/theme-one-dark` 从 package.json 移除（RESEARCH Supporting 表）。

## Shared Patterns

### 1. 语义令牌消费契约（最核心，D-09）
**Source:** 全部现有 Vue 文件一致使用 arbitrary value 消费 CSS 变量，**零 `dark:` variant、零硬编码色值**
```vue
<!-- 代表性证据：tool.layout.vue:3-4 / ToolCard.vue:5 / JsonTree.vue:28 -->
class="flex min-h-dvh flex-col bg-[var(--color-bg)]"
class="border-b border-[var(--color-border)] bg-[var(--color-surface)]"
class="shrink-0 font-mono text-[var(--color-neon-cyan)]"
```
**Apply to:** 六件套全部组件 + 全部迁移文件。组件内禁 `dark:`（RESEARCH Anti-Patterns 第 2 条）——`.dark` 块重声明变量后消费代码零改动翻转。

### 2. vite-ssg mounted 纪律（预渲染安全）
**Source:** `CodeMirrorJson.vue:4-5, 32-34`（注释明文 + 守卫实现）
```typescript
<!-- vite-ssg 纪律：onMounted 才创建 EditorView（Node 预渲染无 DOM 不创建），
     onBeforeUnmount 销毁置 null；watch 单向同步（值不同才 dispatch，避免回环）。 -->
onMounted(() => {
  const el = host.value
  if (!el) return
```
**Apply to:** `useThemeMode.ts`（`initOnMounted: true` + `typeof document === 'undefined'` 守卫，RESEARCH Pitfall 6）、ThemeToggle（无 pre-mount DOM 副作用）。

### 3. happy-dom 测试注入纪律
**Source:** `useCopy.test.ts:2-7`（环境缺口头注释）+ `:11-17, 39-44`（defineProperty/stubGlobal）
**Apply to:** `useThemeMode.test.ts`（matchMedia mock）、六件套组件测试（尺寸走源码级 class 断言，不测布局计算——RESEARCH Pitfall 5）。默认 happy-dom，仅依赖不兼容才文件头切 `@vitest-environment jsdom` 并写理由（safe-html.test.ts:1-5 先例）。

### 4. Tailwind-only 样式（无 `<style>` 块）
**Source:** safe-html.vue / JsonTree.vue / ToolCard.vue / 两 layout / json-formatter.vue 全部无 style 块
**Apply to:** 六件套全部用 Tailwind utility（含 `focus-visible:` variant）；确需动态值时用行内 `:style`（CodeMirrorJson.vue:9 的 border 类写法可参照）。例外：cm-theme.ts 生成的是 CM 内部 CSS，不在此列。

### 5. 显式 import、无 barrel（D-18）
**Source:** `home.vue:44-45`（`import ToolCard from '../components/ToolCard.vue'`）、`json-formatter.vue:124-126`（组件+composable 显式路径导入）
**Apply to:** 六件套不建 `src/ui/index.ts`（RESEARCH Pitfall 8：barrel 会破坏 tree-shaking）；调用方一律 `import Button from '@/ui/Button.vue'` 式显式导入。

### 6. 纯文本插值、v-html 唯一出口
**Source:** `json-formatter.vue:2-3` / `JsonTree.vue:2-3`（渲染纪律头注释）；ESLint `vue/no-v-html` 白名单 `^sanitized`
**Apply to:** 六件套一律 `{{ }}` 插值与 `:prop` 绑定；CopyableText 展示区禁 v-html（RESEARCH §Security V5）。

### 7. 文件头决策注释
**Source:** 全库惯例——每个文件头 1-5 行中文注释引用决策编号（如 CodeMirrorJson.vue:1-5 引 D-01/ARCH-02；useCopy.ts:1-3 引成功标准 #4）
**Apply to:** 所有新建文件（tokens.ts/cm-theme.ts/六件套/useThemeMode）头注释引用对应 D-XX 编号，注明数据来源（RESEARCH §Pattern N）。

### 8. transition-colors 既有使用 = D-11 冲突面
**Source:** `tool.layout.vue:8`、`ToolCard.vue:5`、`json-formatter.vue:22,35,79,100`、`JsonTree.vue:10` 均已使用 `transition-colors`（hover 用途）
**Apply to:** RESEARCH Pitfall 3——主题切换瞬间这些元素会渐变。推荐方案：useThemeMode 切换 watch 内给 `html` 加 `.theme-switching` 类 + base.css `*,*::before,*::after { transition: none !important }` 双 rAF 移除；六件套新写 hover 过渡照常使用 transition-colors。

### 9. useCopy 消费即封装边界（D-17）
**Source:** `useCopy.ts:6-9`（能力层）+ `json-formatter.vue:171-182`（展示层组合 copied+key）
**Apply to:** CopyableText 内部调用 `useCopy()`，复制逻辑零重写；成功反馈窗口沿用 copiedDuring 1500ms 语义（测试已锁定）。

## No Analog Found

| 文件 | 角色 | 数据流 | 原因与替代 |
|------|------|--------|-----------|
| `src/styles/tokens.ts` | utility/常量 | transform | 首个 TS 色值常量模块；结构按 RESEARCH §Pattern 4 消费形态定，值源 = tokens.css 现状 + D-07/D-10 新增 |
| `index.html` FOUC 内联脚本 | config | — | 库内无内联脚本先例；RESEARCH §Pattern 3 已给完整骨架（判定逻辑与 useThemeMode 镜像 + 注释互指） |
| `Tabs.vue` roving tabindex/方向键 | component | event-driven | 库内无键盘导航先例；RESEARCH §Pattern 5 已给 WAI-ARIA 完整规范（tablist/tab/tabpanel 三件套 + hidden 属性） |
| `tokens.test.ts` WCAG 对比度算法 | test | batch | 库内无色彩算法先例；RESEARCH §Pattern 6 已给实跑验证的公式矩阵（bottosson 系数 + 黑白 21.00:1 锚点） |

## Metadata

**Analog search scope:** `src/ui/`、`src/composables/`、`src/styles/`、`src/components/`、`src/layouts/`、`src/pages/`、`src/tools/json-formatter/`、`scripts/`、根目录（index.html/vite.config.ts）
**Files scanned:** 18（全数 Read；11 全文 + check-chunks.mjs 定区段）
**Tracked-source gate:** 通过 —— `git ls-files` 验证全部命名 analog 非镜像（2026-09-07）
**Pattern extraction date:** 2026-09-07
