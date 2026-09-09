---
phase: 03-seo
reviewed: 2026-10-28T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - package.json
  - scripts/check-dist.mjs
  - src/App.vue
  - src/composables/useToolSeo.ts
  - src/config/site.ts
  - src/main.ts
  - src/pages/home.vue
  - src/pages/not-found.vue
  - src/seo/index.test.ts
  - src/seo/index.ts
  - src/tools/json-formatter/json-formatter.vue
  - src/tools/timestamp-converter/timestamp-converter.vue
  - tsconfig.node.json
  - tsconfig.vitest.json
  - vite.config.ts
findings:
  critical: 0
  warning: 2
  info: 6
  total: 8
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-10-28
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

审查范围覆盖 Phase 03 的 SEO 垂直切片：`useToolSeo` 归拢层、`@unhead/vue` 与 vite-ssg 内置实例对齐（main.ts 正确地未自装 `createHead()`）、sitemap/robots 纯函数生成器及单测、`vite.config.ts` 的 `includedRoutes`/`onBeforePageRender`/`onFinished`、`check-dist.mjs` 四类断言门禁、两个工具页接入及聚合脚本链。

交叉验证了关键边界：`route.meta.tool` 由 `src/router/routes.ts` 从注册表派生（单一事实来源成立）；`src/seo/index.ts` 与 `src/config/site.ts` 确为 Node 安全（零 DOM/浏览器 API），可被构建脚本 jiti 直接加载；`EXPECTED_LOCS` 与 sitemap 均由注册表 + `SITE_URL` 单源派生；渲染纪律（零 `v-html`，`safe-html.vue` 为全站唯一出口）未被打破。`useToolSeo` 的双重守卫（无 route 上下文 / 非 tool 路由）正确，且 SSG 预渲染期安全。

未发现 Critical 级问题：无注入面（sitemap 内容为自持注册表数据、build 期落盘）、无硬编码密钥、`index.html` FOUC 脚本为白名单布尔挂类无注入风险、工具页输出全部走文本插值自动转义。

主要关注点集中在 `check-dist.mjs` 门禁自身强度：外链前缀判定存在子域绕过缺陷（WR-01），且门禁未覆盖本阶段核心交付物 canonical/og:url 的存在性（WR-02）。另有若干健壮性/一致性 Info 项。

## Warnings

### WR-01: ext-link 断言的 SITE_URL 前缀判定可被子域绕过

**File:** `scripts/check-dist.mjs:185-191`
**Issue:** `v.startsWith(SITE_URL)` 是纯字符串前缀比较，无边界校验。形如 `https://little-utils.pages.dev.evil.com/track.js` 或 `https://little-utils.pages.dev#evil.com/...` 的第三方资源 URL 能通过判定（`little-utils.pages.dev.evil.com` 以 `little-utils.pages.dev` 开头）。另外 `http://little-utils.pages.dev/...`（明文协议降级）也被放行。该断言是 T-03-03「零第三方外链」的核心防线，当前实现存在静默漏报面。
**Fix:**
```js
// 用 URL 解析做 origin + path 边界校验，替代裸 startsWith
function isSiteUrl(v) {
  try {
    const u = new URL(v)
    const site = new URL(SITE_URL)
    if (u.origin !== site.origin) return false // 协议 + 主机完全一致
    return true
  } catch {
    return false
  }
}
if (/^https?:\/\//i.test(v)) {
  if (!isSiteUrl(v)) { /* push violation */ }
  return
}
```

### WR-02: check-dist [meta] 门禁未覆盖 canonical / og:url / og:title / og:description 的存在性

**File:** `scripts/check-dist.mjs:87-117`
**Issue:** 本阶段核心交付物之一是 `useToolSeo` 注入的标准 meta 集（canonical、og 三件套，D-05/D-12），但工具页断言只覆盖 `<title>` 与 `meta description`。若未来重构（如 `useHead` 链接数组被误删、`@unhead/vue` 升级行为变更）导致 canonical/og:url 落盘丢失，`check:dist` 门禁将静默通过——canonical 缺失正是 SEO 回归最常见的静默破坏点，门禁对它们零断言。
**Fix:**
```js
// 工具页循环内追加（rel/canonical 与 og:url 均应 === SITE_URL + tool.path）
const canonical = /<link\b[^>]*\brel="canonical"[^>]*\bhref="([^"]*)"/i.exec(html)
  ?? /<link\b[^>]*\bhref="([^"]*)"[^>]*\brel="canonical"/i.exec(html)
if (!canonical || canonical[1] !== `${SITE_URL}${tool.path}`) {
  violations.push(`VIOLATION [meta]: ${slug} canonical 缺失或不等于 SITE_URL+path（D-12）`)
}
const ogUrl = /<meta\b[^>]*\bproperty="og:url"[^>]*\bcontent="([^"]*)"/i.exec(html)
if (!ogUrl || ogUrl[1] !== `${SITE_URL}${tool.path}`) {
  violations.push(`VIOLATION [meta]: ${slug} og:url 缺失或不等于 SITE_URL+path（D-12）`)
}
```

## Info

### IN-01: buildSitemapXml 仅转义 `&`，XML 实体转义不完整

**File:** `src/seo/index.ts:12`
**Issue:** `<loc>` 内容只做了 `& → &amp;`。若未来注册表 path 含 `<`、`>`、`"`、`'`（`assertRegistryInvariants` 只约束 `/` 开头与无 `//`，未约束字符集），将产出非法 XML。当前两个工具 path 为 ASCII slug，无实际故障。
**Fix:** 补全转义（或直接在 `assertRegistryInvariants` 收紧 path 字符集为 `[a-z0-9-/]`）：
```ts
const esc = (s: string) => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
```

### IN-02: check-dist 的期望值与实际产物之间的实体转义不对称

**File:** `scripts/check-dist.mjs:38-40,109-116`
**Issue:** `EXPECTED_LOCS` 未做 XML 转义，而生成器产物 `<loc>` 内 `&` 已转义为 `&amp;`——path 一旦含 `&`，双向断言将同时报「漏收录 + 多收录」（fail-closed 方向，安全但信息误导）。同理 `metaDescription`/`title` 从 HTML 提取的是未解码的实体文本，与原始 `tool.description`/`tool.name` 直接 `===` 比较——description 未来含 `&` 或 `"`（unhead 会落盘为 `&amp;`/`&quot;`）时将产生假阳性失败。
**Fix:** 比较前统一解码实体（或对期望值统一转义），并加一条注释说明两侧口径。

### IN-03: not-found.vue 残留 EdgeOne 平台注释（平台已偏离至 Cloudflare Pages）

**File:** `src/pages/not-found.vue:19`
**Issue:** 注释「EdgeOne 以 404 状态码服务」在 Rule 4 平台切换后已过时，会误导后续维护者对 404 状态码服务行为的判断依据。
**Fix:** 改为「Cloudflare Pages 自动以 404 状态码服务 dist/404.html」。

### IN-04: copyValue 未处理 useClipboard 的拒绝路径

**File:** `src/tools/timestamp-converter/timestamp-converter.vue:196-199`
**Issue:** `await copy(value)` 若被拒（legacy `execCommand` 降级仍失败的非安全上下文场景），异常从 click handler 冒泡为未处理的 promise rejection，且 `lastCopiedKey` 已在下一行被置位——复制失败仍显示「已复制」，反馈语义失真。
**Fix:**
```ts
async function copyValue(key: string, value: string): Promise<void> {
  try {
    await copy(value)
    lastCopiedKey.value = key
  } catch { /* 可选:接入错误提示;失败时不置 key */ }
}
```

### IN-05: onFinished 以 CWD 相对路径落盘 sitemap/robots

**File:** `vite.config.ts:51-52`
**Issue:** `writeFile('dist/sitemap.xml', ...)` / `writeFile('dist/robots.txt', ...)` 依赖进程 CWD 恰为项目根。标准 `pnpm build-only` 下成立，但经 `pnpm -C`/CI 自定义工作目录调用时文件会写到错误位置（且 check-dist 仍指向 repoRoot/dist，触发「缺失」误报）。同文件 `repoRoot` 派生模式（check-dist.mjs:29 的 `fileURLToPath(import.meta.url)`）在此更稳。
**Fix:** 以 `fileURLToPath(new URL('./dist', import.meta.url))` 拼绝对路径落盘。

### IN-06: 首页缺少 canonical 与 og 标签

**File:** `src/pages/home.vue:54-64`
**Issue:** 首页只注入 title + description，无 canonical / og:url / og:title / og:description。D-12 的「四消费方」在首页路由上未闭合——站点入口页是最高权重页面，缺 canonical 在带查询参数的入口（如 `?ref=...` 被搜索引擎收录）时会产生重复内容信号。若属 Phase 3 范围裁剪（仅工具页标准集），建议在决策记录中显式登记。
**Fix:** 在 home.vue 的 `useHead` 补 `link: [{ rel: 'canonical', href: SITE_URL + '/' }]` 与 og 三件套（复用 `SITE_URL` 单源）。

---

_Reviewed: 2026-10-28_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
