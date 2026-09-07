// scripts/check-chunks.mjs — 分包预算卡口（ARCH-02 Phase 1 轻量形态，Plan 01-04 Task 3）
// 把"重依赖不进首屏"变成可执行断言（RESEARCH Wave 0 Gaps / T-01-11）：
//   a+b) 逐预渲染页做 chunk 可达性分析：从该页 html 直接引用的本地 script/modulepreload
//        集合出发，沿 chunk 产物的静态/动态 import 语句 BFS 得到可达闭包；闭包内任何含
//        'codemirror'（大小写不敏感）的 chunk，其文件名必须以该页工具 slug 开头
//        —— 入口页（slug=null，代表跨路由共享首屏）可达集零 CM；工具页可达集的 CM
//        只允许出现在本工具自己的懒加载 chunk。
//        覆盖两层泄漏路径：CM 进共享 chunk（含 app chunk 与 useCopy 类共享异步 chunk）、
//        CM 混入其他工具 chunk。直接引用 + import 链追踪缺一不可（html 不直接引用
//        chunk 间依赖，如 useCopy 被 json-formatter chunk 静态 import）。
//        注：vite-ssg 平铺产物下，每个工具页会 modulepreload 自己的工具 chunk ——
//        那是该路由的懒加载资源（用户直达该工具时按需加载，符合 ARCH-02 意图）。
//   c) 断言 dist/assets 存在含 'codemirror' 的非首包（入口页不可达）异步 chunk
//      （证明懒加载 chunk 真实存在而非被 tree-shake 掉）；
//   d) 断言每个工具路由的预渲染页存在
//      （vite-ssg 平铺形态 dist/<route>.html 或目录形态 dist/<route>/index.html 均认可，
//       平铺为 vite-ssg 默认产物 —— 01-02 SUMMARY 已裁定）。
// 构建期脚本：除 node: 内置外仅使用 devDependency jiti 加载注册表模块；
// 任一断言失败打印 VIOLATION: 行并 exit 1；
// 全部通过打印 'OK: chunk budget pass' 并 exit 0。
// 工具路由清单改由注册表派生（WR-04：消除「与 src/tools 注册表一致」的人肉同步）。
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(repoRoot, 'dist')

// —— 工具路由清单唯一来源 = 注册表模块（ARCH-01 构建脚本侧不变量）——
// 经 jiti 加载 src/tools/index.ts（以脚本自身 URL 为解析基准，jiti 负责 TS
// 转译与无扩展名相对导入解析），取 tools[].path 去前导斜杠后喂给断言 d。
// 注册表模块顶层必须保持 Node 安全（Pitfall 3 纪律——与 vite-ssg build 同等
// 信任面，违纪会在本脚本 fail-fast）。
const jiti = createJiti(import.meta.url)
const registry = await jiti.import('../src/tools/index.ts')
const TOOL_ROUTES = registry.tools.map((t) => t.path.replace(/^\//, ''))

const violations = []

// —— 递归收集 dist 下全部 .html（vite-ssg 预渲染页，平铺/目录形态均覆盖） ——
function collectHtmlFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collectHtmlFiles(full))
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full)
  }
  return out
}

function collectJsFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collectJsFiles(full))
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full)
  }
  return out
}

// —— 提取 <script src> 与 <link rel="modulepreload" href> 的本地产物引用 ——
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

// —— 提取 chunk 产物内部的 import 依赖（相对引用 "./xxx.js"，静态与动态 import 均覆盖） ——
function extractChunkImports(js) {
  const refs = []
  // 覆盖产物中全部引用形态：import"./x.js"、import{a}from"./x.js"、export{a}from"./x.js"、import("./x.js")
  const re = /(?:\bfrom|\bimport)\s*(?:\(\s*)?["'](\/?\.\/[^"']+\.js)["']\s*\)?/g
  let m
  while ((m = re.exec(js)) !== null) {
    // 产物 chunk 位于 dist/assets/，相对引用 "./x.js" 解析为 dist/assets/x.js
    const dep = m[1].replace(/^\.\//, '')
    refs.push(`assets/${dep.replace(/^\//, '')}`)
  }
  return refs
}

// —— 从直接引用集出发的 chunk 可达闭包（BFS，含 import 链） ——
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

if (!existsSync(distDir)) {
  violations.push('VIOLATION: dist/ 不存在 —— 请先运行构建（corepack pnpm build）')
}

let htmlFiles = []
const entryHtml = join(distDir, 'index.html')
if (violations.length === 0) {
  htmlFiles = collectHtmlFiles(distDir)
  if (htmlFiles.length === 0) {
    violations.push('VIOLATION: dist/ 下未找到任何预渲染 html')
  } else if (!existsSync(entryHtml)) {
    violations.push('VIOLATION: dist/index.html 缺失 —— vite-ssg 未渲染入口页（/ 路由）')
  }
}

// a+b) 逐预渲染页：可达 chunk 闭包断言（首包零 CM；CM 只进对应工具 chunk）
if (violations.length === 0) {
  for (const file of htmlFiles) {
    const relFromDist = file.slice(distDir.length + 1).replaceAll('\\', '/')
    const isEntry = resolve(file) === resolve(entryHtml)
    // 入口页 slug=null（跨路由共享首屏，可达集零 CM）；
    // 工具页 slug 取平铺文件名或嵌套目录首段
    const slug = isEntry ? null : relFromDist.split('/')[0].replace(/\.html$/, '')
    const startRefs = extractLocalScripts(readFileSync(file, 'utf8'))
    if (startRefs.length === 0) {
      violations.push(`VIOLATION: 页面 ${relFromDist} 未引用任何本地 script`)
      continue
    }
    for (const ref of reachableChunks(startRefs)) {
      const abs = join(distDir, ref)
      if (!existsSync(abs)) {
        violations.push(`VIOLATION: 页面 ${relFromDist} 可达的产物不存在: ${ref}`)
        continue
      }
      if (!/codemirror/i.test(readFileSync(abs, 'utf8'))) continue
      const base = ref.split('/').pop() ?? ''
      if (slug === null) {
        violations.push(
          `VIOLATION: 首包（入口页可达集）泄漏 codemirror 字样: ${ref}（CodeMirror 只允许被工具目录静态 import 并留在工具懒加载 chunk，ARCH-02）`,
        )
      } else if (!base.startsWith(slug)) {
        violations.push(
          `VIOLATION: 页面 ${relFromDist} 可达集中发现非本工具的 codemirror chunk: ${ref}（CM 只允许进对应工具自己的懒加载 chunk，ARCH-02）`,
        )
      }
    }
  }
}

// c) 存在含 codemirror 的非首包（入口页不可达）异步 chunk（懒加载真实存在）
if (violations.length === 0) {
  const assetsDir = join(distDir, 'assets')
  if (!existsSync(assetsDir)) {
    violations.push('VIOLATION: dist/assets 不存在 —— 构建产物形态异常')
  } else {
    const entryReachable = reachableChunks(extractLocalScripts(readFileSync(entryHtml, 'utf8')))
    const lazyChunksWithCm = collectJsFiles(assetsDir).filter((file) => {
      const rel = `assets/${file.slice(assetsDir.length + 1)}`.replaceAll('\\', '/')
      return !entryReachable.has(rel) && /codemirror/i.test(readFileSync(file, 'utf8'))
    })
    if (lazyChunksWithCm.length === 0) {
      violations.push(
        'VIOLATION: dist/assets 下不存在含 codemirror 的非首包异步 chunk —— 工具懒加载 chunk 缺失（被 tree-shake 或 import 边界错误）',
      )
    }
  }
}

// d) 每工具路由预渲染页存在（平铺 dist/<route>.html 或目录 dist/<route>/index.html）
for (const route of TOOL_ROUTES) {
  const flat = join(distDir, `${route}.html`)
  const nested = join(distDir, route, 'index.html')
  if (!existsSync(flat) && !existsSync(nested)) {
    violations.push(
      `VIOLATION: 工具路由预渲染页缺失: ${route}（既无 dist/${route}.html 也无 dist/${route}/index.html）`,
    )
  }
}

if (violations.length > 0) {
  for (const v of violations) console.error(v)
  console.error(`FAIL: ${violations.length} violation(s)`)
  process.exit(1)
}

console.log('OK: chunk budget pass')
