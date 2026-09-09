# Phase 3: 预渲染 SEO 与部署管线 - Pattern Map

**Mapped:** 2026-09-09
**Files analyzed:** 11（新建 4 + 修改 7）
**Analogs found:** 11 / 11

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/config/site.ts`（新） | config（共享常量模块） | static/transform | `src/composables/useThemeMode.ts` §THEME_STORAGE_KEY | role-match |
| `src/seo/index.ts`（新） | utility（纯函数生成器） | transform | `src/tools/tool.ts`（defineTool） | role-match |
| `src/seo/index.test.ts`（新） | test（纯函数单测） | — | `src/tools/registry.test.ts` | exact |
| `src/composables/useToolSeo.ts`（新） | composable | request-response（路由元数据 → meta 声明） | `src/composables/useThemeMode.ts` | role-match |
| `src/App.vue`（改） | component（app 壳） | request-response | 自身（script setup 追加 titleTemplate） | self-modify |
| `src/pages/home.vue`（改） | component（页面） | request-response | 自身（追加 useHead）+ `src/tools/json-formatter/json-formatter.vue` script 区 | self-modify |
| `src/pages/not-found.vue`（改） | component（页面） | request-response | 自身（追加 useSeoMeta） | self-modify |
| `src/tools/<slug>/<slug>.vue`（改 ×2 现有工具页） | component（工具页） | request-response | `src/tools/json-formatter/json-formatter.vue` | exact |
| `scripts/check-dist.mjs`（新） | build script（产物断言） | batch/file-I/O | `scripts/check-chunks.mjs` | exact |
| `vite.config.ts`（改） | config（构建配置） | build-time | 自身 §ssgOptions（onBeforePageRender 先例） | self-modify |
| `package.json`（改） | config（脚本接线） | — | 自身 `check:chunks` 行 | self-modify |

## Pattern Assignments

### `scripts/check-dist.mjs`（build script，batch/file-I/O）★ 最重要的新文件

**Analog:** `scripts/check-chunks.mjs`（exact——同为 dist 产物断言脚本，四类模式直接照抄）

**Imports + 路径解析模式**（check-chunks.mjs:22-28）：
```javascript
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(repoRoot, 'dist')
```

**jiti 载注册表（双源消除）**（check-chunks.mjs:30-37）——check-dist 的 sitemap↔注册表一致性断言必须复用同一模式：
```javascript
const jiti = createJiti(import.meta.url)
const registry = await jiti.import('../src/tools/index.ts')
const TOOL_ROUTES = registry.tools.map((t) => t.path.replace(/^\//, ''))
```

**HTML 资源引用提取**（check-chunks.mjs:62-80）——check-dist 的外链扫描在此正则基础上扩展资源向量（img/iframe/source/video/use href、CSS url()），并显式排除 `xmlns*` 属性（RESEARCH Pitfall 3 实测误报源）：
```javascript
function extractLocalScripts(html) {
  const refs = []
  const patterns = [
    /<script[^>]*\bsrc="([^"]+)"[^>]*>/gi,
    /<link[^>]*rel="modulepreload"[^>]*\bhref="([^"]+)"[^>]*>/gi,
    /<link[^>]*\bhref="([^"]+\.js)"[^>]*>/gi,
  ]
  for (const re of patterns) {
    let m
    while ((m = re.exec(html)) !== null) {
      const ref = m[1]
      if (ref && !/^(https?:)?\/\//i.test(ref)) {
        refs.push(ref.replace(/^\//, '').split('?')[0].split('#')[0])
      }
    }
  }
  return refs
}
```

**可达闭包 BFS（gzip 预算复用）**（check-chunks.mjs:96-111）——check-dist d) 首包 gzip 计算用同一 reachableChunks 逻辑求入口页可达集，逐文件 `gzipSync` 求和：
```javascript
function reachableChunks(startRefs) {
  const seen = new Set()
  const queue = [...startRefs]
  while (queue.length > 0) {
    const ref = queue.shift()
    if (seen.has(ref)) continue
    seen.add(ref)
    const abs = join(distDir, ref)
    if (!existsSync(abs)) continue
    for (const dep of extractChunkImports(readFileSync(abs, 'utf8'))) {
      if (!seen.has(dep)) queue.push(dep)
    }
  }
  return seen
}
```

**违例收集 + 非零退出模式**（check-chunks.mjs:39, 192-198）——check-dist 全部四类断言用同一 violations 数组 + 统一出口：
```javascript
const violations = []
// ... 各断言 push(`VIOLATION: ...`) ...

if (violations.length > 0) {
  for (const v of violations) console.error(v)
  console.error(`FAIL: ${violations.length} violation(s)`)
  process.exit(1)
}
console.log('OK: chunk budget pass')
```

**dist 形态防御**（check-chunks.mjs:113-126, 181-190）——dist 不存在/无 html 的 fail-fast 先例；平铺 `<route>.html` 与目录形态双认可、404.html 特例判断可直接套用：
```javascript
if (!existsSync(distDir)) {
  violations.push('VIOLATION: dist/ 不存在 —— 请先运行构建（corepack pnpm build）')
}
```

---

### `src/seo/index.ts`（utility，transform——纯函数生成器）

**Analog:** `src/tools/tool.ts`（role-match——同为「纯 TS 模块 + JSDoc 契约注释 + 具名导出」，零浏览器 API、Node 安全顶层）

**契约注释 + 纯函数导出模式**（tool.ts:7-14, 31-35）：
```typescript
export interface ToolMeta {
  /** 显示名（中文优先） */
  name: string
  /** URL 路径，'/xxx' 形式，全站唯一（含 home 之外的静态页） */
  path: string
  /** SEO description + 卡片副标题（一句话中文） */
  description: string
  // ...
}

export const NEW_WINDOW_DAYS = 30

/** 工具自注册入口：meta 传入即派生 isNew，绝不手填 */
export function defineTool(meta: ToolMeta): Tool {
  const created = new Date(meta.createdAt).getTime()
  return { ...meta, isNew: Date.now() - created < NEW_WINDOW_DAYS * 86_400_000 }
}
```
照此风格写 `buildSitemapXml(paths: string[], siteUrl: string): string` 与 `buildRobotsTxt(siteUrl: string): string`——文件头注释标明决策引用（D-03/D-12）与协议来源（sitemaps.org 最小集 urlset/url/loc + `&`→`&amp;` 实体转义），与研究 §Pattern 2 骨架一致。

---

### `src/seo/index.test.ts`（test）

**Analog:** `src/tools/registry.test.ts`（exact——纯函数无 DOM 依赖的单测结构）

**文件头注释 + 直接 import 被测模块 + describe 分组**（registry.test.ts:1-9, 27-33）：
```typescript
import { describe, expect, it } from 'vitest'
import {
  assertRegistryInvariants,
  defineTool,
  NEW_WINDOW_DAYS,
  toolCategories,
  tools,
} from './index'

describe('defineTool — isNew 派生（30 天窗口）', () => {
  it('createdAt 在 30 天内 → isNew = true', () => {
    // ...
    expect(tool.isNew).toBe(true)
  })
})
```
照此写 sitemap/robots 生成器单测：`describe('buildSitemapXml — ...')`、`describe('buildRobotsTxt — ...')`；测试名称用「输入 → 期望」中文格式。

---

### `src/config/site.ts`（config，纯常量单源）

**Analog:** `src/composables/useThemeMode.ts` §THEME_STORAGE_KEY（role-match——「全站唯一定义点」导出常量的注释纪律）

**唯一定义点声明模式**（useThemeMode.ts:18-22）：
```typescript
/**
 * 全站唯一 storage key 定义点(PITFALLS 键前缀惯例 `little-utils:v1:*` 首落地;
 * index.html 内联脚本字面引用此处值,勿单独改动)。
 */
export const THEME_STORAGE_KEY = 'little-utils:v1:theme'
```
`src/config/site.ts` 照此写：`export const SITE_URL = 'https://little-utils.edgeone.app'`，头注释标明「四消费方单源（D-12）：canonical/og:url/sitemap/robots Sitemap 行全部 import 此处，禁止散落硬编码；占位值待首次部署后按 D-11 修正」。**文件必须 Node 安全**（纯常量、零浏览器 API、零 import）——构建脚本（check-dist/vite onFinished）与组件层共用。

---

### `src/composables/useToolSeo.ts`（composable，request-response）

**Analog:** `src/composables/useThemeMode.ts`（role-match——项目 composable 的注释纪律与守卫风格）

**注释纪律**（useThemeMode.ts:1-10）——新 composable 文件头必须交代「为什么」与决策引用：
```typescript
// src/composables/useThemeMode.ts — 三态主题状态机(SITE-04;D-01/D-02/D-04/D-11)
// 为什么不用现成方案(语义不满足,非遗漏):
//   - useDark:布尔两态,无 auto 语义位,违背 D-02 三态契约;
// ...
```

**SSG 环境守卫模式**（useThemeMode.ts:51-53）——useToolSeo 内如有 DOM 判定逻辑须同样守卫（useSeoMeta 本身无 DOM 依赖，仅作风格参照）：
```typescript
watch(resolved, (mode) => {
  if (typeof document === 'undefined') return
```

**核心实现**（研究 §Pattern 1 已给骨架，消费点来自 routes.ts:19 的 `meta: { layout: 'tool', tool }`）：
```typescript
import { useRoute } from 'vue-router'
import { useHead, useSeoMeta } from '@unhead/vue'
import { SITE_URL } from '@/config/site'

export function useToolSeo() {
  const route = useRoute()
  const tool = route.meta.tool
  useSeoMeta({
    title: tool.name,             // titleTemplate 在 App 级补 ' - little-utils'
    description: tool.description, // D-09: 复用 ToolMeta.description
    ogTitle: tool.name,           // titleTemplate 不影响 ogTitle，必须显式（RESEARCH Pitfall 5）
    ogDescription: tool.description,
    ogUrl: `${SITE_URL}${tool.path}`, // D-12
  })
  useHead({
    link: [{ rel: 'canonical', href: `${SITE_URL}${tool.path}` }],
  })
}
```
`route.meta.tool` 的类型入口注释（routes.ts:15-19）：`// 元数据进 meta（SEO 消费点）`。

---

### `src/App.vue` / `src/pages/home.vue` / `src/pages/not-found.vue` / 工具页（component 层修改）

**Analog:** 各文件自身 script setup + `src/tools/json-formatter/json-formatter.vue`（exact——工具页标准结构）

**工具页 script setup 导入纪律**（json-formatter.vue:78-80 + home.vue:43-48）——按需显式 import、无 barrel、注释标决策号：
```typescript
<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from '../../ui/Button.vue'
```
```typescript
// D-18:按需显式 import,无 barrel(D-15 home 空态卡消费 Card)
import Card from '../ui/Card.vue'
```
工具页接入方式：在各工具页 script setup 首行区追加 `useToolSeo()` 一句调用（归拢层），模板与既有渲染纪律零改动。

**home.vue 追加 useHead**（落点 home.vue script setup 内，D-06/D-10）：
```typescript
useHead({
  title: 'little-utils — 开发者 & 办公工具箱', // D-06: 与 index.html:29 现值同值（全角破折号）
  meta: [{ name: 'description', content: '<首页中文描述>' }], // D-10: Claude 起草，验收人工确认
})
```
index.html:29 的静态 `<title>` 保留作无 JS 兜底，勿动。

**not-found.vue 追加 noindex**（D-08）：
```typescript
useSeoMeta({ robots: 'noindex, nofollow', title: '页面不存在' })
```
not-found.vue 当前无 `<script setup>` 块（纯模板，1-16 行），需新增 script setup 块——结构参照 home.vue:43。

**App.vue 追加 titleTemplate**（落点 App.vue:8-16 script setup）：
```typescript
useHead({ titleTemplate: (t) => (t ? `${t} - little-utils` : 'little-utils') })
```
App.vue 现有 `useRoute`/layout computed 模式即修改落点，titleTemplate 与其并列于 script setup。

---

### `vite.config.ts`（config，build-time 修改）

**Analog:** 自身 §ssgOptions（先例齐备——includedRoutes 过滤 + onBeforePageRender 已在位）

**现有接缝**（vite.config.ts:21-33）：
```typescript
ssgOptions: {
  // Phase 3 起：includedRoutes 过滤、onFinished 生成 sitemap、每路由 meta 验证
  includedRoutes(paths) {
    return paths.filter((p) => !p.includes(':')) // 暂不预渲染 catch-all 404
  },
  onBeforePageRender(_route, indexHTML) {
    if (/<html[^>]*\bclass="[^"]*\bdark\b/.test(indexHTML)) return indexHTML
    return indexHTML.replace(/<html([^>]*)>/i, '<html$1 class="dark">')
  },
},
```
修改点（三处，全部在 ssgOptions 内）：
1. **includedRoutes**（:23-25）——过滤结果追加 `'/404'`（RESEARCH Pitfall 4）：
   ```typescript
   return [...paths.filter((p) => !p.includes(':')), '/404']
   ```
2. **onBeforePageRender**（:29-32）——暗色注入勿动（D-05 FOUC 基线依赖）。
3. **新增 onFinished**——研究 §Pattern 2 骨架：jiti 载注册表（与 check-chunks.mjs:35-37 同模式）→ `writeFile` 写 `dist/sitemap.xml` 与 `dist/robots.txt`，生成逻辑 import 自 `./src/seo`（纯函数）与 `./src/config/site`（SITE_URL 单源）。imports 区追加 `import { writeFile } from 'node:fs/promises'` 与 `import { createJiti } from 'jiti'`（alias 现成 `@` → `./src`，vite.config.ts:16-20）。

---

### `package.json`（config，脚本接线修改）

**Analog:** 自身 scripts 区（exact——`check:chunks` 行即新 `check:dist` 行的直接先例）

**现有接线**（package.json:7-19）：
```json
"build": "run-p type-check \"build-only {@}\" --",
"build-only": "vite-ssg build",
"check:chunks": "node scripts/check-chunks.mjs",
```
修改点：
1. 新增 `"check:dist": "node scripts/check-dist.mjs"`（紧邻 check:chunks）。
2. 门禁链线性编排（RESEARCH Pitfall 7：check:dist 必须在 build-only 之后，因 onFinished 产物依赖）——新增聚合脚本（如 `"check:all": "run-s test:unit type-check lint check:chunks build-only check:dist"`），EdgeOne 构建命令（D-15）填此单条链。`run-s`/`run-p` 由既有 npm-run-all2 提供，无新依赖。

## Shared Patterns

### 路由清单唯一来源 = 注册表（双源消除）
**Source:** `scripts/check-chunks.mjs:30-37`
**Apply to:** `scripts/check-dist.mjs`（sitemap 一致性断言）+ `vite.config.ts` onFinished
```typescript
const jiti = createJiti(import.meta.url)
const registry = await jiti.import('../src/tools/index.ts')
const TOOL_ROUTES = registry.tools.map((t) => t.path.replace(/^\//, ''))
```
Phase 5 新工具零成本收录全靠这一点——任何脚本/配置里**禁止手写工具路由清单**。

### SITE_URL 单源派生（D-12）
**Source:** `src/composables/useThemeMode.ts:18-22`（唯一定义点注释纪律）
**Apply to:** `src/config/site.ts`（定义）→ useToolSeo（ogUrl/canonical）、vite onFinished（sitemap/robots）、check-dist（外链白名单前缀 + robots Sitemap 行断言）

### 构建脚本断言模式（violations 数组 + exit 1）
**Source:** `scripts/check-chunks.mjs:39, 113-115, 192-198`
**Apply to:** `scripts/check-dist.mjs` 全部四类断言（meta 非空 / sitemap 一致 / 零外链 / gzip 预算）

### chunk 可达闭包 BFS
**Source:** `scripts/check-chunks.mjs:96-111`（reachableChunks）+ `:62-80`（extractLocalScripts）
**Apply to:** `scripts/check-dist.mjs` d) gzip 首包计算（入口页可达集逐文件 gzipSync 求和，> 200*1024 exit 1）；若规划允许可抽 `scripts/lib` 共享，否则复制（研究裁定：两脚本职责独立，失败信息不混流）

### 组件层 script setup 纪律（按需显式 import + 决策注释）
**Source:** `src/pages/home.vue:43-48`、`src/tools/json-formatter/json-formatter.vue:78-80`
**Apply to:** useToolSeo 消费方（App.vue / home.vue / not-found.vue / 各工具页）——每个 meta 注入点注释标 D-xx 决策号

### 测试就近放置 + 文件头注释交代前提
**Source:** `src/composables/useThemeMode.test.ts:1-6`（happy-dom 限制与隔离策略写进头注释）、`src/tools/registry.test.ts:1-2`
**Apply to:** `src/seo/index.test.ts` + useToolSeo 就近测试

### SSG 安全纪律（预渲染期无 document）
**Source:** `src/composables/useThemeMode.ts:40-41`（`initOnMounted: true`）、`:51-53`（`typeof document === 'undefined'` 守卫）
**Apply to:** `src/seo/index.ts` 与 `src/composables/useToolSeo.ts`——seo 纯函数模块保持零浏览器 API（Node 安全，构建脚本直接 import）；useToolSeo 不做 DOM 操作

## No Analog Found

| File | Role | Data Flow | Reason | 兜底 |
|------|------|-----------|--------|------|
| EdgeOne Pages 控制台配置（D-13/D-14/D-15 仓库绑定/构建命令/Node 24.18.0） | 人工步骤（代码外） | — | 平台配置不存在于代码库，git 无记录 | RESEARCH §Runtime State Inventory + Pitfall 6（版本错配防线：控制台显式选 Node 24.18.0、仓库不放 .nvmrc）写成计划内 human 步骤 |

## Metadata

**Analog search scope:** `src/`（composables/pages/tools/router/ui）、`scripts/`、根配置（vite.config.ts / index.html / package.json）
**Files scanned:** 约 20（通读 14 个 analog 源文件，全部验证 git 跟踪——tracked-source gate 通过，无 mirror 路径）
**Pattern extraction date:** 2026-09-09
