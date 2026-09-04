# Pitfalls Research

**Domain:** 开发者/办公工具箱网站（纯前端静态站，赛博朋克 UI，公网部署需兼顾国内访问）
**Researched:** 2026-09-04
**Confidence:** MEDIUM（综合：跨源交叉验证的结论为 MEDIUM；仅单源支撑或依赖训练数据的结论单独标注 LOW）

> 检索说明：本次经 websearch 通道抓取（单源=LOW，多源交叉=MEDIUM）。W3C/MDN 等官方文档背书的条目按官方来源采信。检索中出现的 SEO 内容农场页面已按不可信数据忽略，未采信。

## Critical Pitfalls

### Pitfall 1: 格式化工具渲染用户输入时 XSS（v-html / innerHTML 直插）

**What goes wrong:**
JSON 格式化、Markdown 编辑、正则测试、URL/编码转换等工具天然要"渲染用户粘贴的内容"。最短路径是用 `v-html`（Vue）/ `dangerouslySetInnerHTML`（React）/ `innerHTML` 把高亮后的 HTML 直接塞进 DOM。攻击载荷藏在"看起来只是数据"的输入里：`</textarea>`/`</script>` 闭合逃逸、`<img onerror=...>`、`javascript:` 链接。后果：本站虽无后端会话可偷，但 XSS 仍可执行任意脚本——读取/篡改 localStorage（含用户收藏）、把用户粘贴的 token/cookie 通过外发请求窃走（配合用户自己粘进工具的密钥，等于二次收割）、劫持页面跳转钓鱼站；若工具支持"分享 URL 带内容"（query/base64 传参），则形成可投递的反射型 XSS 链接。

**Why it happens:**
框架的自动转义（`{{ }}`）制造了"Vue 天然防 XSS"的错觉；语法高亮库（highlight.js/prism）的输出看着"像安全 HTML"，于是直接进 `v-html`；每个工具各写各的渲染，安全策略无法集中审计。

**How to avoid:**
- 建立唯一渲染出口：所有"用户输入 → HTML"必须经过集中工具函数——先做 HTML 转义，再交给 highlight.js/prism 的 `highlight()`（其输出本身安全），禁止先拼 HTML 再转义。
- Markdown 渲染一律经 DOMPurify 消毒（markdown-it 默认放行 raw HTML，需 `html:false` 或消毒后再插）。
- lint 层禁用 `v-html`（ESLint `vue/no-v-html`），白名单放行需 code review。
- 分享 URL 只传数据不传标记；从 URL 还原内容后走与手输相同的渲染管线；`target="_blank"` 一律 `rel="noopener noreferrer"`。
- Code review 规则：出现 `innerHTML`/`v-html`/`insertAdjacentHTML` 即告警。

**Warning signs:**
grep 代码出现 `v-html` 或 `innerHTML`；新工具 PR 里自己拼 `<span class=...>` 包内容；测试时只用了"正常 JSON"没试 `{"a":"<img onerror=alert(1)>"}`。

**Phase to address:**
Phase 1（站点框架）：把"渲染出口/消毒管线"作为框架基础设施与 lint 规则交付，之后每个工具批次只需遵守，不需重造。

---

### Pitfall 2: 纯客户端 SPA 导致 SEO 空壳（每工具独立 URL 却不被收录）

**What goes wrong:**
需求明确"每个工具独立 URL + 基础 SEO"。若按普通 Vite+Vue/React SPA 部署，所有路由的初始 HTML 都是同一个空 `<div id="app">`：工具标题、描述、h1 全部要等 JS 执行才出现。Google 会执行 JS 但抓取延迟且不保证渲染成功；百度对 JS 渲染支持极弱，Bing 也不可靠。结果是：URL 是独立的，收录是零的——"独立可分享 URL"变成只有分享价值、没有搜索价值。对以"搜索关键词 → 进入工具页"为增长路径的工具站，这是结构性失败。

**Why it happens:**
SPA 起步最快，SEO 问题在本地开发完全不可见（自己有 JS）；等上线发现没收录，改造成 SSG 等于重做路由层与 meta 层。

**How to avoid:**
- 选型时就把 SSG 预渲染定为硬约束：Vue 生态用 vite-ssg / Nuxt 3 static / Astro；React 生态用 Astro 或 Vite SSG 类方案。构建期给每个工具路由产出真实 HTML。
- 每个工具在"工具注册表"里声明 `title/description/keywords`，构建与运行时统一注入 `<title>`/`<meta>`/OG 标签，禁止手写散落 meta。
- 每个工具页有真实服务端可见内容：h1、一句中文描述、用法说明（也顺便可访问性受益）。
- 上线即提交 sitemap.xml，百度单独走百度资源平台做抓取诊断（百度与 Google 收录管线完全不同，需分别验证）。
- 上线验证：`curl <工具页 URL>` 返回的 HTML 里必须能看到工具名与描述，而不是等 JS。

**Warning signs:**
构建产物里某个工具路由的 `.html` 文件内容与首页雷同/只有 `<div id="app">`；Lighthouse SEO 分数低于 90；搜索 `site:<域名>` 收录只有首页。

**Phase to address:**
Phase 1（选型+脚手架）：SSG 作为选型硬门槛；Phase 3（SEO 与部署管线）：meta 体系、sitemap、双搜索引擎验证。**注意：若 Phase 1 选型不锁死 SSG，此坑无法在后期低成本修复——这是全部坑里唯一"必须影响选型"的坑。**

---

### Pitfall 3: 国内部署与第三方资源踩雷（vercel.app 污染、Google Fonts/GA 不可达、jsdelivr 不稳）

**What goes wrong:**
作者与主要访客在国内。Vercel 默认分配的 `*.vercel.app` 域名在大陆常因 DNS 污染直接无法访问，且其边缘节点不在大陆；GitHub Pages 速度不稳定。站点模板里"顺手"引入的东西更是重灾区：Google Fonts（`fonts.googleapis.com` 自 2014 年起大陆不可达）会让页面等字体请求超时；Google Analytics 加载不到拖慢/阻塞；从 jsdelivr/unpkg 拉 CDN 资源曾反复出现间歇性不可用。症状是"国外秒开、国内转圈"，而作者自测时若挂了代理则完全感知不到。

**Why it happens:**
默认模板与教程都面向海外生态；开发机有代理；这些问题只在大陆网络环境暴露，且"有时能打开"让人误判为偶发。

**How to avoid:**
- 托管选型时把"大陆可达性"列为第一优先（EdgeOne Pages 有国内节点；或自定义域名 + Cloudflare 前置，域名备案与否决定方案边界——备案前不要选择需要国内 ICP 的路径）。
- 站点零第三方外链依赖：字体一律自托管（中文字体必须子集化，见 Performance Traps）；统计用自托管方案（如自建 Umami）或接受"国内无统计"的现实，绝不引用 GA；所有依赖本地打包，不运行时从公网 CDN 拉 JS。
- 部署验收清单里加一条：用无代理的大陆网络实测首屏（可用手机流量），并测 `curl -w` TTFB。
- 依赖 jsdelivr/unpkg 的任何"加载器"（如字体图标、编辑器按需拉取语言包）必须改为 npm 依赖本地打包。

**Warning signs:**
`<link href="fonts.googleapis.com">` 或 `googletagmanager` 出现在 index.html；构建后仍有对 `cdn.jsdelivr.net`/`unpkg.com` 的请求；测速站（如 17ce/boce.com）多省份节点超时。

**Phase to address:**
Phase 1（部署管线）：托管选型+域名策略定死；Phase 3（SEO 与部署）：零外链审计脚本 + 大陆实测验收。**这个坑必须在选型阶段解决，上线后换域名/换托管有迁移成本。**

---

### Pitfall 4: 工具越加越多、首包越来越肥（重量级库全量引入 + 无按工具懒加载）

**What goes wrong:**
两类典型膨胀：①依赖库全量引入——`moment.js`（约 70KB+，维护模式、不可 tree-shake）只为格式化一个时间戳；`crypto-js` 整包引入（几百 KB）只用 AES；highlight.js 引"common 全语言包"只用 json/xml。②架构性膨胀——路由不按工具分包，100 个工具的代码和依赖全部进首包。工具箱是"用一次就走/天天用"的工具，用户 90% 只用 1-2 个工具，首包 2MB 意味着移动端 3G/弱网下白屏数秒——直接毁掉"几秒内完成操作"的核心价值主张。

**Why it happens:**
每个工具都是独立小需求，"引个库"是最省事的解法；单看一个工具的膨胀无感，50 个工具叠加后才爆发；默认 import 与按需 import 在本地毫无体感差异。

**How to avoid:**
- 架构层强制：每个工具 = 一个动态 `import()` 的路由级 chunk，工具注册表只存元数据（标题/图标/分类），代码按需拉。
- 依赖清单纪律：日期时间用 dayjs（约 2KB）或 date-fns（函数级 tree-shaking）或原生 `Intl`/`Date`；哈希/编码优先浏览器原生 Web Crypto API（`crypto.subtle` 做 SHA/AES），确需 crypto-js 时按算法子路径引入（`crypto-js/aes`）；语法高亮按需注册语言；二维码/图片引擎等 WASM 大件按工具懒加载。
- CI 卡口：bundle 体积预算（如首包 gzip ≤ 200KB），超预算构建警告/失败；定期跑 rollup-plugin-visualizer 看体积构成。

**Warning signs:**
`import moment from 'moment'` / `import CryptoJS from 'crypto-js'` 全量出现在源码里；任一工具 chunk > 300KB；首屏请求数与工具总数同步增长；`vite build` 输出出现几十个共享 vendor chunk 被每个页面引用。

**Phase to address:**
Phase 1（框架）：路由级分包+注册表架构+budget 卡口；每个工具批次（后续 Phase）延续依赖纪律。**此坑的修复成本随工具数线性增长，越晚治理越贵。**

---

### Pitfall 5: 赛博朋克 UI 可访问性翻车（对比度不达标、动效触发前庭不适、无 reduced-motion）

**What goes wrong:**
霓虹 + 故障艺术 + HUD 是本项目的显式需求，也是最大的可访问性风险源：
- **对比度**：暗底上的暗青/暗品红文字、半透明 HUD 面板上的正文、发光(text-shadow)小字号，普遍低于 WCAG 1.4.3 要求的 4.5:1（大字 3:1），弱视用户与强光环境（手机户外）下直接不可读。
- **动效**：glitch 抖动、扫描线滚动、闪烁霓虹、视差背景，对前庭障碍（vestibular disorder）用户是真实的生理诱因——W3C 在 WCAG 2.1 SC 2.3.3 与 Technique C39 中明确要求用 `prefers-reduced-motion` 提供降级；闪烁还涉及光敏性癫痫风险（SC 2.3.1）。
- **焦点可见性**：深色底 + 发光边框让默认 focus outline 几乎不可见，键盘用户找不到位置。

**Why it happens:**
风格化设计在高端显示器/开发机深色环境下调校，测试者都是视力正常的年轻开发者；`prefers-reduced-motion` 不设置不会有任何报错，属"沉默失败"。

**How to avoid:**
- 设计系统先行（design tokens）：颜色 token 全部过对比度校验（工具：axe/浏览器 DevTools 对比度检查器），正文色强制达标；风格层（发光、故障）只作用于"非关键信息"装饰元素。
- 硬性规则：`@media (prefers-reduced-motion: reduce)` 全局关闭 glitch/扫描线/视差/大位移动画，仅保留 opacity 淡入；不自动播放闪烁，任何闪烁频率避开 3 次/秒的危险区间。
- focus-visible 提供高对比样式；工具操作区（PROJECT.md 已定调"克制易读"）用普通明暗设计，风格化隔离在首页/导航/边框装饰。
- CI/验收：axe 或 Lighthouse a11y 审计 ≥ 95；真机开"减弱动态效果"（iOS）走查一遍首页。

**Warning signs:**
设计稿全是霓虹色小字；CSS 里 `text-shadow` 大量出现但 `prefers-reduced-motion` 一次都没有；Lighthouse Accessibility 分数 < 90；灰蓝色 (#4a90d9 以下亮度) 正文出现。

**Phase to address:**
Phase 2（设计系统/主题）：tokens+对比度+reduced-motion 基线必须先于大面积风格化落地；Phase 7（赛博朋克风格化）：强风格化时逐条对照本节。**顺序错误（先炫酷后补 a11y）是此类项目的头号返工源。**

---

### Pitfall 6: 剪贴板与文件 API 的浏览器怪癖（安全上下文、手势、Safari 差异）

**What goes wrong:**
"复制结果"和"粘贴输入"是工具箱的第一操作，但它比想象中脆：
- `navigator.clipboard.writeText/readText` **只在安全上下文（HTTPS/localhost）可用**——一旦部署配置失误（HTTP、或自定义域名证书问题），所有复制按钮静默抛错；本地开发是 localhost 能用，上线才炸。
- 剪贴板 API 要求**用户手势**内调用：包在 debounce/异步格式化回调里再写剪贴板可能丢失手势上下文而失败（Safari 尤其严格）。
- `readText` 会触发权限弹窗，用户拒绝后 UI 若无反馈就是"点了没反应"；Safari 对 `ClipboardItem`/`read()` 的支持与类型限制和 Chrome 不一致（如自定义 MIME 受限）。
- 文件侧：iOS 文件选择对 `accept` 属性处理不一致；HEIC 照片直接丢给 canvas 解不出来；canvas 绘制 iPhone 拍的照片会因 EXIF 方向被旋转 90°（需 `createImageBitmap(..., {imageOrientation:'from-image'})` 或现代浏览器的自动方向处理）；大文件 FileReader 同步读入导致移动端直接 OOM。

**How to avoid:**
- 封装唯一 `useClipboard()` composable：特性检测 → try 新 API → catch 降级 `document.execCommand('copy')`（已废弃但仍是 HTTP 环境唯一解）→ 都失败则自动选中输入框提示"请手动复制"。所有工具强制复用，禁止自造 copy。
- 写剪贴板操作保持同步于点击事件（先拿值再立即写入，或先写入旧值成功后再异步更新）。
- 文件工具：`createImageBitmap` 优先 + 显式处理 EXIF 方向；限制单文件大小并给出明确提示；大文件用 Worker + 分片。
- 部署验收清单：HTTPS 证书链正确、HTTP 访问 301 到 HTTPS。

**Warning signs:**
代码里出现多个手写 `navigator.clipboard.writeText` 而无 catch；控制台出现 `NotAllowedError`/`TypeError: Cannot read properties of undefined (reading 'writeText')`；图片工具在 iPhone 上产物旋转 90°；有用户反馈"复制按钮没用"（HTTP 环境）。

**Phase to address:**
Phase 1（框架）：useClipboard/useFile 基础设施随框架交付；图片工具批次（办公效率 Phase）处理 EXIF/HEIC 专项。

---

### Pitfall 7: 范围蔓延——工具堆砌先于框架，或框架镀金无止境

**What goes wrong:**
两个对称的失败模式：
- **工具优先**：一上来就逐个写工具，每个工具各带一套布局/主题/复制逻辑/错误处理，写到第 20 个工具时发现加一个"全局搜索"要改 20 个文件，回头重构成"工具注册表"架构，前 20 个工具几乎全部返工。
- **框架镀金**：反过来，为了"架构完美"在第一个工具都没写时就开始造插件系统/动态加载器/i18n/主题引擎，两个月后框架很漂亮但站点不可用，热情耗尽弃坑。
社区对标：同类站点的共同模式是"注册表化扩展 + 本地优先 + 无登录"，成熟站 60–104 个工具，但个人起步站（如 DevToolsBox）从 12 个工具起步就成立——付费的 DevUtils 也就 40+ 工具。

**Why it happens:**
工具箱项目的固有诱惑：每个工具都"很小很诱人"；而框架的价值只有在你写过 10 个工具后才显现，作者无法提前校准"多少框架刚好"。

**How to avoid:**
- 硬性顺序：Phase 1 交付"能装 3 个真实工具的最小框架"（注册表元数据：id/标题/分类/描述/图标 + 统一布局 + 统一 clipboard/消毒设施），用 3–5 个工具验证契约，再批量生产。
- v1 工具清单冻结在作者自用高频项（PROJECT.md 已列），新工具进 backlog 不进当前里程碑；每里程碑结束按"自用频率"淘汰/排序。
- 每个新工具 PR 的验收标准里必须有：注册表元数据齐全、独立 URL、复用基础设施（不得自造 copy/布局）。
- 明确反清单（见 Anti-features 精神）：不做账号、不做云端同步、不做多端客户端——he3 的桌面+Web 双端是团队产品行为，个人项目勿仿。

**Warning signs:**
第二个工具开始复制粘贴第一个工具的代码；"先加 10 个工具再统一整理"出现在计划里；框架阶段超过 2 周还没有一个可用的工具页面；backlog 工具数 > 当前里程碑工具数的 3 倍。

**Phase to address:**
Phase 1（框架）：注册表契约+最小工具集验证；每个工具批次 Phase 持续用验收标准防守。roadmap 排期时把"工具批次"明确设为独立 Phase 以隔离范围蔓延。

---

### Pitfall 8: 桌面开发者工具在手机上不可用（iOS 输入放大、触控、键盘遮挡）

**What goes wrong:**
开发工具天然以桌面为第一形态，但 PROJECT.md 明确要求移动端响应式。最经典的翻车：iOS Safari 对最终渲染字号 < 16px 的 `input/textarea` 聚焦时**强制自动放大整个页面**（硬编码的可访问性行为），用户一点输入框页面就糊，缩不回来。同类问题还有：触控目标 < 44px 点不中；虚拟键盘弹出遮挡输出框；`position:fixed` 的 HUD 装饰在键盘弹出后错位。

**Why it happens:**
开发机全程桌面浏览器验证；`maximum-scale=1.0` 禁缩放的"老偏方"只在 iOS ≤ 10 有效，现代 iOS 忽略它但仍执行 16px 放大逻辑；桌面 14px 字号是前端审美惯性。

**How to avoid:**
- 全局输入控件规则：input/textarea/select 最终渲染字号 ≥ 16px（用 rem 时注意根字号换算），这是唯一可靠解。
- 触控目标 ≥ 44×44px（WCAG 2.5.8 建议与 iOS HIG 一致）；输出区给"点击复制"大热区。
- `interactive-widget=resizes-content`（viewport meta）配合布局测试键盘弹出场景；关键"输入→输出"双栏布局在移动端改为上下堆叠并保证输出区不被键盘盖住。
- 移动端验收成为每个工具 PR 的固定项（DevTools 设备模拟 + 至少一台真机走查）。

**Warning signs:**
任何 < 16px 的输入框；按钮高度 < 40px；只在桌面 Chrome 验证过的工具 PR；真机 iOS 上点击输入框页面跳动。

**Phase to address:**
Phase 2（响应式基线）：16px 规则+触控目标进 design tokens/全局样式；每个工具批次延续。**这条是全局 CSS 规则，框架期一次性解决，拖到后期每个工具都要修。**

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| 工具直接引用库的全量 import（moment/crypto-js 整包） | 5 分钟写完一个工具 | 每工具 70–500KB 冗余；叠加后首包失控 | never——按需 import 的成本同样低 |
| 每个工具自带复制/布局/错误处理逻辑 | 不用设计共享设施 | 行为不一致；改一处要改 N 处；安全策略无法集中 | 仅允许第 1 个"契约验证工具"临时使用，进框架前重构 |
| meta/SEO 信息手写在路由文件里 | 起步快 | 标题重复/遗漏失控，批量改关键词痛苦 | never——注册表元数据驱动 |
| 霓虹色值硬编码在组件 CSS | 快 | 无法统一调对比度；暗/亮主题各写一遍 | never——token 化成本极低 |
| localStorage 键名无前缀无版本（如 `fav`） | 立即可用 | 未来结构变更无迁移路径；与其他站点逻辑冲突难排查 | 起步可接受，但 Phase 1 就定 `little-utils:v1:favs` 形态 |
| 大 JSON 全量 `JSON.stringify` + `innerHTML` 渲染高亮 | 实现直观 | >1MB 输入卡死主线程、移动端崩溃 | 仅 v1 验收用小样例时；工具批次必须带大输入限流 |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| 托管平台（Vercel/EdgeOne/GH Pages） | 用默认分配域名直接推广，忽略大陆 DNS 污染 | 选型即按"大陆可达"决策；自定义域名+正确解析；部署后用大陆无代理网络验收 |
| Google Fonts / GA | 复制模板里的外链字体与 GA 代码 | 字体自托管+中文字体子集化；统计换自托管或国内可达方案，或放弃统计 |
| jsdelivr/unpkg CDN | 运行时从公网 CDN 拉语言包/WASM | 全部 npm 依赖本地打包；CDN 仅作为构建产物的兜底镜像 |
| Clipboard API | 无手势/无降级/无特性检测直接调用 | 统一 composable：特性检测→新 API→execCommand 降级→手动复制兜底 |
| Service Worker / PWA | 上线 SW 后更新不生效，用户永远看到旧版 | 版本化 precache + 立即 activate；调试期默认不启用 SW，PWA 做成里程碑末尾项 |
| 百度/Google 搜索资源平台 | 只提交 Google sitemap，百度无收录动作 | 双平台分别验证；百度走抓取诊断确认 HTML 可见内容 |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| 所有工具代码同步进首包 | 首页加载随工具数线性变慢 | 注册表只存元数据，工具体动态 import 分包 | 工具 > 10 个即可感知，> 50 个严重 |
| 大文本格式化在主线程 | 粘贴 5MB JSON 页面卡死数秒 | Web Worker 中 parse/format；超阈值提示分段或拒绝 | 输入 > 1MB / 移动端 > 200KB |
| 图片压缩在主线程 + 无 EXIF 处理 | 大图处理 UI 冻结；iPhone 图旋转 | browser-image-compression（Worker 版）或自研 Worker+createImageBitmap(imageOrientation:'from-image') | 图 > 5MB 或任意 iPhone 拍摄照片 |
| 语法高亮整页渲染 | 长输出渲染掉帧 | 虚拟滚动或行级懒渲染；超高亮按需语言包 | 输出 > 数千行 |
| 中文 webfont 整包引入 | 字体文件数 MB，国内加载雪崩 | 子集化（fontmin/中文 webfont 切片）或系统字体栈优先，装饰字体仅首页少量字符 | 立即（首次访问） |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| v-html/innerHTML 渲染未消毒用户输入 | XSS：脚本执行、localStorage 窃取、跳转钓鱼 | 唯一渲染出口：转义→highlight()→DOMPurify；ESLint 禁 v-html（见 Critical 1） |
| 分享 URL 直接反序列化并渲染内容 | 反射型 XSS（攻击者构造恶意链接投递） | URL 参数只传数据；还原后走统一渲染管线；对超长参数限长 |
| `target="_blank"` 无 `rel="noopener noreferrer"` | tabnabbing：新标签页反向操控原页面 | 全局 lint/审计；输出链接统一处理 |
| 假设"无后端就无安全风险" | 用户会粘贴 token/密钥进工具，XSS 可窃取或页面自身脚本行为不当即泄露 | 工具区提示"请勿粘贴生产密钥"；绝不把输入写入 localStorage（收藏除外）；无任何第三方分析/上报脚本 |
| 第三方脚本无 SRI 无审计 | 供应链投毒（CDN 被污染即波及全站） | 零第三方脚本原则；必要的外链资源加 SRI + 定期审计 |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| 工具区也做强风格化（HUD 框/发光/噪点覆盖层） | 正文可读性下降，长文本操作疲劳 | PROJECT.md 已定调：风格化限定首页/导航，工具区克制；装饰用伪元素不侵入内容容器 |
| 霓虹色小字号正文 + 发光 | 户外/弱视不可读；眼疲劳 | 正文用达标中性色，霓虹仅用于强调/边框/标题装饰 |
| 复制成功无反馈（或用 alert） | 用户不确定是否复制成功；alert 打断 | 统一 toast/按钮态变化（图标切换 ✓） |
| 错误输入只显示 "Invalid JSON" | 用户不知道错在第几行 | 解析器定位行列，高亮错误行（JSON 工具标配） |
| 移动端双栏布局硬挤压 | 输入/输出各半屏，键盘一弹全部不可见 | 移动端上下堆叠 + 键盘感知布局（见 Critical 8） |
| 搜索仅匹配工具名 | 用户搜"时间戳转换"搜不到名为 "Unix Timestamp" 的工具 | 每工具注册中文+英文关键词别名数组，fuse.js 权重匹配 |

## "Looks Done But Isn't" Checklist

- [ ] **JSON 格式化：** 大数精度丢失 — `JSON.parse` 对超过 2^53 的整数（电商订单号/长 ID 常见）静默丢精度 — 用大数据场景验证或提供 Preserve Number 选项
- [ ] **Base64 编解码：** 中文乱码 — `btoa/atob` 不支持非 Latin1 — 必须走 TextEncoder/TextDecoder 的 UTF-8 路径
- [ ] **时间戳转换：** 毫秒/秒自动识别与本地时区 — 10 位/13 位判错一位结果差 1000 倍 — 展示原始输入回显供核对
- [ ] **复制按钮：** HTTP/权限拒绝场景 — 上线前在非 localhost 环境实测
- [ ] **每个工具页 SEO：** `curl` 该页 HTML 能看到工具标题描述（非 JS 注入）
- [ ] **暗色主题：** 工具输出区（代码、错误信息）主题切换后对比度仍达标
- [ ] **reduced-motion：** 系统开启"减弱动态效果"后首页无 glitch/滚动动画
- [ ] **移动端：** iOS 真机点击每个工具的输入框页面不缩放、键盘弹出后输出可见
- [ ] **收藏功能：** localStorage 键有前缀与版本；收藏上限/去重行为明确
- [ ] **文件类工具：** 空文件、0 字节、超大文件、HEIC/EXIF 各测一遍

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| XSS（Critical 1） | LOW（若设施在）/ MEDIUM（散落各工具） | 收敛渲染出口→全局转义管线→回归全部工具注入用例 |
| SPA 无 SEO（Critical 2） | HIGH | 引入 SSG 重构构建层+meta 层；相当于半个 Phase 的返工——所以必须在 Phase 1 选型时规避 |
| 国内不可达（Critical 3） | MEDIUM | 换托管/自定义域名+迁移 DNS；站点本身是静态产物，迁移本身不难，难在已分发的旧域名/收录 |
| Bundle 膨胀（Critical 4） | MEDIUM（随工具数增长） | 逐工具改按需引入+分包；加 budget 卡口防复发 |
| a11y 翻车（Critical 5） | MEDIUM | token 层统一调色过对比度；全局加 reduced-motion 块；逐页 axe 审计 |
| 剪贴板不可用（Critical 6） | LOW | 统一 composable 替换调用点；部署 HTTPS 修复 |
| 范围蔓延（Critical 7） | HIGH（工具优先型） | 停止加工具→提炼注册表契约→批量迁移已有工具；镀金型则直接冻结框架开发转入工具批次 |
| 移动端翻车（Critical 8） | LOW | 全局样式改 16px/触控规则，逐工具真机走查 |

## Pitfall-to-Phase Mapping

> Phase 编号为建议语义（对应 PROJECT.md Active 需求的自然分组），roadmap 制定时可对号入座调整编号。

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| XSS 渲染管线缺失 | Phase 1 框架（消毒设施+lint） | 注入用例测试集（`<img onerror>` 等样本）全工具通过；grep 无裸 v-html |
| SPA 无 SEO | Phase 1 选型硬门槛 + Phase 3 SEO 管线 | `curl` 工具页含标题/描述；sitemap 提交；双搜索引擎 site: 收录抽查 |
| 国内部署/外链依赖 | Phase 1 部署选型 + Phase 3 零外链审计 | 构建产物无第三方域名请求；大陆无代理网络实测 TTFB 达标 |
| Bundle 膨胀 | Phase 1 分包架构 + CI budget | 首包 gzip ≤ 预算；无全量 moment/crypto-js；visualizer 报告归档 |
| a11y（对比度/动效） | Phase 2 设计系统 + Phase 7 风格化逐条对照 | Lighthouse a11y ≥ 95；reduced-motion 走查；对比度全 token 校验 |
| Clipboard/File 怪癖 | Phase 1 框架（统一 composable） | 非 localhost 环境复制成功；Safari 真机走查；EXIF 图片方向正确 |
| 范围蔓延 | Phase 1 契约验证 + 各工具批次验收标准 | 新工具 PR 检查表：元数据/独立 URL/复用设施三项齐全；backlog 不混入当前里程碑 |
| 移动端可用性 | Phase 2 响应式基线（16px/触控/键盘） | iOS 真机走查清单通过；无 <16px 输入框（CI 样式审计） |

## Sources

- W3C WCAG 2.1 Technique C39（prefers-reduced-motion 防动效触发前庭障碍）: https://www.w3.org/WAI/WCAG21/Techniques/css/C39 — 官方，HIGH
- W3C Understanding SC 2.3.3 Animation from Interactions: https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html — 官方，HIGH
- MDN prefers-reduced-motion / media queries for accessibility: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion — 官方，HIGH
- Vue v-html XSS 多源（sourcery.ai 漏洞库、safeguard.sh Vue Security Best Practices 2026、reintech.io XSS Prevention）— 多源一致，MEDIUM
- Clipboard API 安全上下文/手势/降级多源（comate.baidu 2025-2026、CSDN、php.cn）— 多源一致，MEDIUM
- Vercel vercel.app 大陆 DNS 污染与加速方案（blog.pid0.cn 2026-04、juejin 2024-06、CSDN/知乎）— 多源一致，MEDIUM
- moment→dayjs/date-fns 迁移与体积（You-Dont-Need-Momentjs repo、CSDN/知乎/博客园）— 多源一致，MEDIUM
- iOS input <16px 聚焦自动放大（CSDN/php.cn 多篇）— 多源一致，MEDIUM
- 浏览器端图片处理 Canvas/WASM/Worker（juejin 2026-03、CSDN 2026-05、browser-image-compression）— MEDIUM
- 静态工具站 SSG/SEO 选型（php.cn Vue SSG 综述、腾讯云开发者 Astro 文）— MEDIUM（噪音已过滤）
- 同类工具箱规模与功能基线（IT-Tools repo、he3、DevUtils、devtool.tech、tools-dev.com、devkit、OnlineToolbox、DevToolsBox）— MEDIUM
- 中文在线工具站（tool.lu、菜鸟工具）— 检索结果薄，LOW，仅作背景

---
*Pitfalls research for: 开发者/办公工具箱网站（纯前端静态站 + 赛博朋克 UI）*
*Researched: 2026-09-04*
