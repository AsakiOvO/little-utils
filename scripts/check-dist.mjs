// scripts/check-dist.mjs — dist 产物四类断言门禁（ARCH-03/ARCH-05，Plan 03-02 Task 3，D-17/D-18）
//   a) [meta]    每页 meta 非空：全部 dist/*.html <title> 非空；工具页 title 以「 - little-utils」
//                结尾且含注册表 tool.name；meta description 非空且 === 注册表 ToolMeta.description
//                （D-09 单源断言）；canonical 与 og:url 均存在且 === SITE_URL + tool.path
//                （D-12 单源断言——canonical 缺失是最常见 SEO 静默回归）；dist/404.html
//                特例：含 noindex（D-08）。
//   b) [sitemap] sitemap ↔ 注册表集合双向相等（防漏收录 + 防多收录）；/404 不在 sitemap（D-08）；
//                robots.txt 的 Sitemap 行 === SITE_URL 派生值（SITE_URL 经 jiti 从 src/config/site.ts
//                载入——本脚本禁止硬编码域名，D-12）。
//   c) [ext-link] 零第三方外链：只提取资源加载向量——script src / link href / img src /
//                iframe src / source src+srcset / video·audio src / use href+xlink:href 与
//                CSS 文件内 url()；http(s) 绝对 URL 必须 URL origin === SITE_URL origin
//                （origin 精确比较，裸 startsWith 会被 little-utils.pages.dev.evil.com 子域仿冒
//                与明文 http 降级绕过），相对路径与 data:/blob:/#锚点 放行；显式排除 xmlns* 属性值（RESEARCH Pitfall 3：实测每页含
//                http://www.w3.org/2000/svg——SVG 命名空间标识符非网络请求，全文 https?://
//                正则必误报，禁止）。
//   d) [gzip]    首包 gzip 预算（D-17 硬卡）：gzipSync(dist/index.html) + 入口页 HTML 直接引用
//                资源的 chunk 可达闭包（BFS 照 check-chunks.mjs reachableChunks 复制，研究裁定
//                不抽 scripts/lib——两脚本职责独立、失败信息不混流）逐文件 gzipSync 求和；
//                总和 > 200 * 1024 字节即 VIOLATION。
// 入口防御：dist 不存在时 push violation 提示「请先运行构建」并 exit 1（fail-fast，
// 照 check-chunks.mjs:113 先例）。任一断言失败：violations 逐条 console.error +
// FAIL 计数 + exit 1；全部通过打印 'OK: dist checks pass (meta/sitemap/ext-link/gzip)'。
// 构建期脚本：除 node: 内置外仅使用 devDependency jiti（零新增依赖，T-02-SC）。
// 必须在 build-only 之后运行（onFinished 的 sitemap/robots 依赖产物，RESEARCH Pitfall 7）。
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { createJiti } from 'jiti'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(repoRoot, 'dist')
const GZIP_BUDGET_BYTES = 200 * 1024

// —— 唯一来源 = 注册表 + SITE_URL 单源（双源消除，禁止手写路由清单/硬编码域名）——
const jiti = createJiti(import.meta.url)
const registry = await jiti.import('../src/tools/index.ts')
const site = await jiti.import('../src/config/site.ts')
const SITE_URL = site.SITE_URL
const EXPECTED_LOCS = new Set(
  ['/', ...registry.tools.map((t) => t.path)].map((p) => `${SITE_URL}${p}`),
)

const violations = []

// —— 递归收集 dist 下全部指定扩展名文件（平铺/目录形态均覆盖，同 check-chunks）——
function collectFiles(dir, ext) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collectFiles(full, ext))
    else if (entry.isFile() && entry.name.endsWith(ext)) out.push(full)
  }
  return out
}

function pageTitle(html) {
  const m = /<title>([\s\S]*?)<\/title>/i.exec(html)
  return m ? m[1].trim() : ''
}

/** 提取 <meta name="description"> 的 content（属性顺序无关，unhead 输出双引号） */
function metaDescription(html) {
  const tagRe = /<meta\b[^>]*>/gi
  let m
  while ((m = tagRe.exec(html)) !== null) {
    if (/\bname="description"/i.test(m[0])) {
      const c = /\bcontent="([^"]*)"/i.exec(m[0])
      return c ? c[1].trim() : ''
    }
  }
  return ''
}

// a) 每页 meta 非空
if (!existsSync(distDir)) {
  violations.push('VIOLATION [dist]: dist/ 不存在 —— 请先运行构建（corepack pnpm build-only）')
} else {
  const htmlFiles = collectFiles(distDir, '.html')
  if (htmlFiles.length === 0) {
    violations.push('VIOLATION [meta]: dist/ 下未找到任何预渲染 html')
  } else {
    for (const file of htmlFiles) {
      const rel = file.slice(distDir.length + 1).replaceAll('\\', '/')
      const title = pageTitle(readFileSync(file, 'utf8'))
      if (!title) violations.push(`VIOLATION [meta]: ${rel} <title> 为空`)
    }

    // 工具页：title 格式（D-06）+ description 单源一致（D-09）
    for (const tool of registry.tools) {
      const slug = tool.path.replace(/^\//, '')
      const flat = join(distDir, `${slug}.html`)
      const nested = join(distDir, slug, 'index.html')
      const file = existsSync(flat) ? flat : existsSync(nested) ? nested : null
      if (!file) {
        violations.push(`VIOLATION [meta]: 工具页预渲染 html 缺失: ${slug}`)
        continue
      }
      const html = readFileSync(file, 'utf8')
      const title = pageTitle(html)
      if (!title.endsWith(' - little-utils')) {
        violations.push(
          `VIOLATION [meta]: ${slug} title 未以「 - little-utils」结尾（D-06）: "${title}"`,
        )
      }
      if (!title.includes(tool.name)) {
        violations.push(
          `VIOLATION [meta]: ${slug} title 不含注册表 tool.name "${tool.name}": "${title}"`,
        )
      }
      const desc = metaDescription(html)
      if (!desc) {
        violations.push(`VIOLATION [meta]: ${slug} meta description 为空`)
      } else if (desc !== tool.description) {
        violations.push(
          `VIOLATION [meta]: ${slug} description 与注册表 ToolMeta.description 不一致（D-09 单源）: "${desc}"`,
        )
      }
      // canonical 与 og:url 存在性 + D-12 单源断言（useToolSeo 交付物）——
      // canonical 缺失是 SEO 回归最常见的静默破坏点，门禁必须显式覆盖。
      // 两种属性顺序都匹配（rel/href 与 href/rel）；og:url 期望值 === SITE_URL + tool.path。
      const expected = `${SITE_URL}${tool.path}`
      const canonical =
        /<link\b[^>]*\brel="canonical"[^>]*\bhref="([^"]*)"/i.exec(html) ??
        /<link\b[^>]*\bhref="([^"]*)"[^>]*\brel="canonical"/i.exec(html)
      if (!canonical || canonical[1] !== expected) {
        violations.push(
          `VIOLATION [meta]: ${slug} canonical 缺失或不等于 SITE_URL+path（D-12）: "${canonical ? canonical[1] : ''}"`,
        )
      }
      const ogUrl = /<meta\b[^>]*\bproperty="og:url"[^>]*\bcontent="([^"]*)"/i.exec(html)
      if (!ogUrl || ogUrl[1] !== expected) {
        violations.push(
          `VIOLATION [meta]: ${slug} og:url 缺失或不等于 SITE_URL+path（D-12）: "${ogUrl ? ogUrl[1] : ''}"`,
        )
      }
    }

    // 404 特例：存在且 noindex（D-08）
    const notFound = join(distDir, '404.html')
    if (!existsSync(notFound)) {
      violations.push('VIOLATION [meta]: dist/404.html 缺失（D-08 预渲染 noindex 页）')
    } else if (!/noindex/i.test(readFileSync(notFound, 'utf8'))) {
      violations.push('VIOLATION [meta]: 404.html 缺 noindex（D-08）')
    }
  }
}

// b) sitemap ↔ 注册表一致 + robots Sitemap 行单源
const sitemapPath = join(distDir, 'sitemap.xml')
const robotsPath = join(distDir, 'robots.txt')
if (!existsSync(sitemapPath)) {
  violations.push(
    'VIOLATION [sitemap]: dist/sitemap.xml 缺失 —— onFinished 未生成（先 build-only）',
  )
} else {
  const xml = readFileSync(sitemapPath, 'utf8')
  const locs = new Set([...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((m) => m[1].trim()))
  for (const expected of EXPECTED_LOCS) {
    if (!locs.has(expected)) violations.push(`VIOLATION [sitemap]: sitemap 漏收录: ${expected}`)
  }
  for (const actual of locs) {
    if (!EXPECTED_LOCS.has(actual)) violations.push(`VIOLATION [sitemap]: sitemap 多收录: ${actual}`)
  }
  if ([...locs].some((l) => l.includes('/404'))) {
    violations.push('VIOLATION [sitemap]: /404 出现在 sitemap（D-08 noindex 特例被破坏）')
  }
}
if (!existsSync(robotsPath)) {
  violations.push('VIOLATION [sitemap]: dist/robots.txt 缺失 —— onFinished 未生成（先 build-only）')
} else {
  const robots = readFileSync(robotsPath, 'utf8')
  const sm = /^Sitemap: (.+)$/m.exec(robots)
  if (!sm) {
    violations.push('VIOLATION [sitemap]: robots.txt 缺 Sitemap 行')
  } else if (sm[1].trim() !== `${SITE_URL}/sitemap.xml`) {
    violations.push(
      `VIOLATION [sitemap]: robots.txt Sitemap 行非 SITE_URL 派生值（D-12 单源被破坏）: "${sm[1].trim()}"`,
    )
  }
}

// c) 零第三方外链（只扫资源加载向量，属性级提取——禁全文 https?:// 正则）
const RESOURCE_ATTR_PATTERNS = [
  /<script\b[^>]*\bsrc="([^"]+)"/gi,
  /<link\b[^>]*\bhref="([^"]+)"/gi,
  /<img\b[^>]*\bsrc="([^"]+)"/gi,
  /<iframe\b[^>]*\bsrc="([^"]+)"/gi,
  /<source\b[^>]*\bsrc="([^"]+)"/gi,
  /<source\b[^>]*\bsrcset="([^"]+)"/gi,
  /<(?:video|audio)\b[^>]*\bsrc="([^"]+)"/gi,
  /<use\b[^>]*\bhref="([^"]+)"/gi,
  /<use\b[^>]*\bxlink:href="([^"]+)"/gi,
]
const CSS_URL_PATTERN = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi

// SITE_URL origin 预解析一次；断言用 URL origin 精确比较而非裸字符串前缀——
// 子域仿冒（https://little-utils.pages.dev.evil.com/）与明文 http 降级均被正确拒绝。
const SITE_ORIGIN = new URL(SITE_URL).origin

/** 是否为站点自身资源 URL：解析成功且 origin（协议 + 主机）与 SITE_URL 完全一致 */
function isSiteUrl(v) {
  try {
    return new URL(v).origin === SITE_ORIGIN
  } catch {
    return false
  }
}

function checkExternalValue(value, source) {
  const v = value.trim()
  if (!v) return
  // 显式排除 xmlns* 属性值（Pitfall 3）——属性级提取天然不捕获 xmlns，此处再挡
  // 一层防御提取模式未来扩张（如误加全属性扫描）。
  if (/^xmlns/i.test(v)) return
  // 相对路径 / data: / blob: / 锚点 / mailto / javascript 伪协议放行
  if (/^(data:|blob:|#|mailto:|javascript:)/i.test(v)) return
  if (/^https?:\/\//i.test(v)) {
    if (!isSiteUrl(v)) {
      violations.push(
        `VIOLATION [ext-link]: ${source} 发现第三方资源 URL: ${v}（T-03-03 零外链断言）`,
      )
    }
    return
  }
  if (v.startsWith('//')) {
    violations.push(`VIOLATION [ext-link]: ${source} 发现协议相对外链: ${v}`)
  }
}

if (existsSync(distDir)) {
  for (const file of collectFiles(distDir, '.html')) {
    const rel = file.slice(distDir.length + 1).replaceAll('\\', '/')
    const html = readFileSync(file, 'utf8')
    for (const re of RESOURCE_ATTR_PATTERNS) {
      re.lastIndex = 0
      let m
      while ((m = re.exec(html)) !== null) {
        // srcset 可能含多个候选（"a.png 1x, b.png 2x"），逐段取 URL 首词
        for (const segment of m[1].split(',')) {
          checkExternalValue(segment.trim().split(/\s+/)[0] ?? '', rel)
        }
      }
    }
  }
  const assetsDir = join(distDir, 'assets')
  if (existsSync(assetsDir)) {
    for (const file of collectFiles(assetsDir, '.css')) {
      const rel = file.slice(distDir.length + 1).replaceAll('\\', '/')
      const css = readFileSync(file, 'utf8')
      CSS_URL_PATTERN.lastIndex = 0
      let m
      while ((m = CSS_URL_PATTERN.exec(css)) !== null) {
        checkExternalValue(m[1], rel)
      }
    }
  }
}

// d) 首包 gzip 预算（BFS 可达闭包照 check-chunks.mjs:62-111 复制 + CSS 纳入首包）
function extractEntryResources(html) {
  const refs = []
  const patterns = [
    /<script[^>]*\bsrc="([^"]+)"[^>]*>/gi,
    /<link[^>]*rel="modulepreload"[^>]*\bhref="([^"]+)"[^>]*>/gi,
    /<link[^>]*\bhref="([^"]+\.js)"[^>]*>/gi,
    /<link[^>]*\bhref="([^"]+\.css)"[^>]*>/gi, // 首包含 CSS（研究基线口径：app.css 计入）
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

function extractChunkImports(js) {
  const refs = []
  // 覆盖产物全部引用形态：import"./x.js"、import{a}from"./x.js"、export{a}from"./x.js"、import("./x.js")
  const re = /(?:\bfrom|\bimport)\s*(?:\(\s*)?["'](\/?\.\/[^"']+\.js)["']\s*\)?/g
  let m
  while ((m = re.exec(js)) !== null) {
    const dep = m[1].replace(/^\.\//, '')
    refs.push(`assets/${dep.replace(/^\//, '')}`)
  }
  return refs
}

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

if (existsSync(distDir)) {
  const entryHtml = join(distDir, 'index.html')
  if (!existsSync(entryHtml)) {
    violations.push('VIOLATION [gzip]: dist/index.html 缺失 —— vite-ssg 未渲染入口页')
  } else {
    let total = gzipSync(readFileSync(entryHtml)).length
    for (const ref of reachableChunks(extractEntryResources(readFileSync(entryHtml, 'utf8')))) {
      const abs = join(distDir, ref)
      if (!existsSync(abs)) {
        violations.push(`VIOLATION [gzip]: 入口可达产物不存在: ${ref}`)
        continue
      }
      total += gzipSync(readFileSync(abs)).length
    }
    if (!violations.some((v) => v.startsWith('VIOLATION [gzip]')) && total > GZIP_BUDGET_BYTES) {
      violations.push(
        `VIOLATION [gzip]: 首包 gzip 总和 ${total} 字节超过预算 ${GZIP_BUDGET_BYTES}（D-17 硬卡）`,
      )
    }
  }
}

// —— 统一出口（照 check-chunks.mjs:192-198）——
if (violations.length > 0) {
  for (const v of violations) console.error(v)
  console.error(`FAIL: ${violations.length} violation(s)`)
  process.exit(1)
}

console.log('OK: dist checks pass (meta/sitemap/ext-link/gzip)')
