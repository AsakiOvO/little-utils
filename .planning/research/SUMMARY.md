# Project Research Summary

**Project:** little-utils(开发者/办公工具箱网站)
**Domain:** 纯前端开发者 & 办公工具箱静态站(本地计算、赛博朋克风格、国内可访问、每工具独立 SEO 路由)
**Researched:** 2026-09-04
**Confidence:** MEDIUM(Architecture 达 HIGH;Stack/Features/Pitfalls 为多源交叉验证的 MEDIUM,个别单源已标注)

## Executive Summary

这是一个"纯前端、无后端、数据不出浏览器"的在线工具箱站。该品类的专家共识做法高度一致:it-tools(40.4k★)、DevUtils、he3 等全部采用**元数据驱动的注册表架构**——每个工具是自包含模块,路由、导航、搜索、收藏、sitemap 全部从中央注册表派生;配合"每工具独立 URL + localStorage 个性化 + 本地计算隐私卖点"。规模上精选而非军备竞赛(it-tools ~90 个、DevUtils 40+),个人项目 12–20 个高质量工具起步即成立。中文工具站(tool.lu/菜鸟工具)流量全部来自搜索引擎直达工具页,因此"每工具独立 SEO 路由"不是可选项,而是增长引擎本身。

推荐方案:**Vue 3.5 + Vite 8 + vite-ssg(构建期逐路由预渲染静态 HTML + meta)+ Tailwind CSS 4 + CodeMirror 6**,部署到 EdgeOne Pages(备案走中国大陆节点 / 未备案走"全球可用区(不含中国大陆)";Vercel 与 GitHub Pages 因大陆 DNS 污染被排除)。差异化空间明确:URL 状态编码(分享链接即复现结果,四个竞品均无)、赛博朋克强风格首页 + 克制工具区、中文优先无广告、办公效率双线(图片/Markdown/颜色——it-tools 几乎没有办公向工具)。

关键风险集中在三类"选型期不锁死、后期返工极贵"的坑:①纯 SPA 导致 SEO 空壳(全部坑里唯一必须影响选型的,百度爬虫不执行 JS);②国内可达性(托管平台 + 零第三方外链,上线后换域名有迁移成本);③bundle 膨胀(修复成本随工具数线性增长)。此外赛博朋克 UI 的可访问性(对比度/reduced-motion)必须由设计系统先行兜底——"先炫酷后补 a11y"是此类项目的头号返工源;范围上需用"最小框架 + 3–5 个工具验证契约后再批量生产"同时防住工具堆砌与框架镀金两种对称失败。

## Key Findings

### Recommended Stack

一句话:Vue 3.5 + Vite 8 + vite-ssg + Tailwind CSS 4 + CodeMirror 6,pnpm 管理,EdgeOne Pages 部署。版本号全部来自 npm registry 第一方查询(2026-09-04),兼容性经 peerDependencies 核实。

**Core technologies:**
- **Vue 3.5.42(stable,勿用 3.6-rc)+ Vite 8.2.2** — 中文生态第一梯队,与作者技术惯性一致;SFC 天然适配"每工具一组件"结构
- **vite-ssg 28.3.0** — 满足"每工具独立 URL + SEO"的关键件:构建时把每条路由渲染成完整静态 HTML + meta;已核实支持 Vite 7/8 与 vue-router 4/5
- **@unhead/vue 3.4.0** — `useHead()` 把每工具 title/description/canonical/OG 写进预渲染 HTML,SSG SEO 靠它
- **vue-router 5.3.1** — 路由从注册表 `map` 派生(ARCHITECTURE 核心模式);unplugin-vue-router 的类型化路由仅为可选增强,与注册表派生路由二选一,Phase 1 定夺
- **TypeScript 5.9.3** — 锁 5.x 稳定线;TS 7(Go 原生编译器)未经 vue-tsc 验证,勿用
- **Tailwind CSS 4.3.3** — `@theme` 定义霓虹青/品红/电光黄(oklch)设计令牌 + `@custom-variant dark`,即成赛博朋克主题系统;官方 Vite 插件零运行时
- **CodeMirror 6(~45KB gz)** — 所有编辑器类工具;明确不用 Monaco(2.5MB、不做移动端、worker 配置噩梦)
- **@vueuse/core 14.4.0 + fuse.js 7.5.0** — useStorage(收藏)/useClipboard/useDark;fuse.js 本地模糊搜索(it-tools 同款)

**Supporting:** dayjs(时间戳)、qrcode、browser-image-compression、@jsquash/webp+jpeg(WASM 懒加载)、marked+highlight.js、papaparse、jszip、js-base64(UTF-8 安全)、crypto-js(仅 MD5,默认 Web Crypto API)。

**关键禁令(What NOT to Use):** npm 源 `xlsx`(停更 + CVE,必须从 cdn.sheetjs.com 装 tgz);Element Plus 等全量组件库(与强风格冲突,自研 5–6 个基础组件);任何后端/数据库/登录态;Vercel/GitHub Pages 作主部署。

**部署决策路径:** 愿备案 → EdgeOne + 大陆可用区(速度天花板);求快 → EdgeOne + "全球不含大陆"区域(免备案,代码零改动可后切);兜底 Cloudflare Pages。

### Expected Features

**Must have(table stakes,缺失即流失):**
- 站点级:每工具独立可分享 URL、分类导航首页、fuse.js 搜索(中英文关键词)、收藏/最近使用(localStorage)、暗色模式、移动端响应式、"数据不离开浏览器"隐私声明、一键复制、构建期预渲染 + 每路由 meta + sitemap
- 工具级 v1(10 个高频):JSON 格式化/校验、时间戳转换、Base64(字符串+文件)/URL 编解码、UUID/随机串、二维码生成、HTTP 状态码速查、哈希/加密(MD5/SHA/AES)、正则测试器(工期紧可与哈希对调)

**Should have(差异化):**
- URL 状态编码(输入写进 query,分享即复现)——竞品真空地带
- Cmd+K 命令面板(工具 >15 后收益显现)
- PWA 离线(vite-plugin-pwa,站点稳定后接入)
- 办公效率双线:图片压缩(canvas 版先行)、Markdown 编辑/预览、颜色工具
- 电商/SKU 工具族(作者独家场景,护城河)、赛博朋克风格化首页、中文优先 + 国内可访问

**Defer(v2+):** WASM 图片编码器、Office 文档转换(需专项调研,大概率"部分支持+明确告知")、i18n、收藏导出/导入。

**Anti-features(明确不做):** 用户账户、云端同步、服务端处理、广告、v1 i18n、社区插件生态、AI 功能、工具数量军备竞赛(12–20 个高质量 > 500 个平庸)。

### Architecture Approach

事实标准是**清单驱动的注册表架构**(it-tools 源码级验证):`tools/index.ts` 是全站单一事实来源,路由表、分类菜单、搜索索引、收藏校验、sitemap 五个消费方全部从它派生——"新增工具 = 加一个目录 + 注册表一行,其余零改动"。每个工具自包含目录(`.vue` 视图 + `.service.ts` 纯函数 + 测试),工具间零依赖(lint 强制);共享代码只下沉到 composables/ui/utils。双 layout 落实"首页强风格、工具区克制"的项目约束。

**Major components:**
1. **工具注册表** `tools/index.ts` + `defineTool()` — 全站契约,越早定型越好
2. **工具模块** `tools/<slug>/` — 懒加载 chunk 入口,service 纯函数可脱离框架单测
3. **路由生成器** — 注册表的纯派生,通配符 404 置尾;禁止手写静态路由表(两处真相必漂移)
4. **共享层** — useCopy(三层降级)/useDownload/useTheme/useFavorites + `ui/c-*` 中性基础组件 + 三层 CSS 变量 tokens(primitive→semantic→effect)
5. **构建期层** — vite-ssg 逐路由预渲染(useHead 注入 meta)+ 每工具独立异步 chunk

**关键纪律:** 浏览器 API 初始化进 `onMounted`/`initOnMounted`(预渲染跑在 Node,无 localStorage);localStorage 状态区延迟到挂载后渲染防 Web 合不匹配;发光动画只碰 opacity/transform 不动 box-shadow。

### Critical Pitfalls

1. **XSS 渲染管线缺失(P1)** — 格式化工具天然渲染用户粘贴内容,`v-html` 直插 = 脚本执行 + localStorage 窃取 + 反射型 XSS 链接。→ Phase 1 交付唯一渲染出口(转义→highlight→DOMPurify)+ ESLint 禁 v-html + 注入用例测试集。
2. **纯 SPA SEO 空壳(P2)** — 百度爬虫不执行 JS,"独立 URL 却零收录"是结构性失败。→ SSG 是选型硬门槛(唯一必须影响选型的坑);验收标准 `curl` 工具页 HTML 必须含标题描述;百度/Google 双平台分别验证。
3. **国内部署与第三方资源踩雷(P3)** — vercel.app DNS 污染、Google Fonts 不可达、jsdelivr 不稳;"国外秒开国内转圈"且开发机有代理感知不到。→ 托管选型期定死;零外链(字体自托管+中文子集化、依赖全本地打包);无代理大陆网络实测验收。
4. **Bundle 膨胀(P4)** — 全量引入 moment/crypto-js/highlight.js + 无按工具分包,首包随工具数线性膨胀。→ 路由级动态 import + 依赖纪律(dayjs/Web Crypto/按需语言包)+ CI 体积预算(首包 gzip ≤200KB)。
5. **赛博朋克 a11y 翻车(P5)** — 霓虹小字对比度 < 4.5:1、glitch 动画触发前庭障碍(W3C 明确要求 reduced-motion 降级)、发光边框吃掉焦点可见性。→ 设计 token 全部过对比度校验、`prefers-reduced-motion` 全局关闭装饰动画、Lighthouse a11y ≥ 95;先设计系统后风格化。
6. **剪贴板/文件 API 怪癖(P6)** — clipboard 仅 HTTPS + 需用户手势,Safari 尤其严格;iPhone 照片 EXIF 旋转。→ 唯一 `useClipboard()` composable 三层降级,所有工具强制复用。
7. **范围蔓延(P7)** — 工具堆砌(第 20 个工具时发现改 20 个文件)与框架镀金(两个月无可用页面)对称失败。→ Phase 1 交付"能装 3–5 个真实工具的最小框架"验证契约再批量;每工具 PR 验收三件套(元数据齐全/独立 URL/复用设施)。
8. **移动端翻车(P8)** — iOS 对 <16px 输入框强制放大页面(现代 iOS 忽略禁缩放但仍执行放大);触控目标 <44px 点不中。→ 16px/44px 全局规则进 tokens,框架期一次性解决。

## Implications for Roadmap

Based on research, suggested phase structure(8 个 Phase;PITFALLS 的 Pitfall-to-Phase 编号与本结构语义对应):

### Phase 1: 应用骨架与工具注册表框架
**Rationale:** Tool 接口是全站契约,越早定型越好;Pitfall 1/4/7 的修复成本随进度爆炸,消毒管线与分包架构必须先于任何工具存在。
**Delivers:** Vite+Vue3+TS+Tailwind 脚手架;注册表机制(types + defineTool + 路由派生);双 layout 空壳 + tokens 雏形;唯一渲染出口 + ESLint 规则(禁 v-html、禁工具间 import);useCopy;CodeMirror 6 接入;**JSON 格式化 + 时间戳转换 2 个契约验证工具**。
**Addresses:** FEATURES 站点骨架的前半 + 工具级 P1 前两项
**Avoids:** Pitfall 1(XSS)、4(bundle)、7(范围蔓延)、6(剪贴板基础设施)

### Phase 2: 设计系统与响应式/可访问性基线
**Rationale:** PITFALLS 明示"先炫酷后补 a11y 是头号返工源";16px/触控目标是全局 CSS 规则,框架期一次性解决,拖到后期每个工具都要修。
**Delivers:** 三层 tokens(全部过对比度校验)、暗色模式(useDark)、reduced-motion 全局基线、focus-visible 样式、`ui/c-*` 基础组件库(输入框/卡片/按钮/Tabs/可复制文本域)、16px/44px 规则。
**Uses:** Tailwind 4 `@theme`/`@custom-variant dark`、VueUse
**Avoids:** Pitfall 5(a11y)、8(移动端)

### Phase 3: 预渲染 SEO 与部署管线
**Rationale:** 必须放在工具批量生产**之前**——每工具 meta 体系后补等于批量返工;托管/域名决策不可逆,且是"国内可达"这一核心约束的落地点。
**Delivers:** vite-ssg 完整接入、useHead 每工具 meta、sitemap.xml/robots.txt 生成脚本、EdgeOne Pages 部署 + 域名策略(备案与否在此决策)、零外链审计、无代理大陆网络实测(TTFB + curl HTML 验收)。
**Avoids:** Pitfall 2(SEO 空壳)、3(国内不可达)

### Phase 4: 站点级体验(首页/搜索/收藏)
**Rationale:** 注册表就绪后,搜索/收藏/分类导航都是它的不同视图——"架构一次做对,功能是增量"。
**Delivers:** 分类导航首页(SEO 承接页)、fuse.js 搜索(中英文关键词权重匹配)、收藏/最近使用(localStorage 封装 + initOnMounted 纪律)、隐私声明、About/404。
**Implements:** 注册表五大消费方中的三个

### Phase 5: v1 工具集批量补齐
**Rationale:** 框架/SEO/导航全部就绪后,工具生产是模式复制,可用脚手架脚本(create-tool.mjs)并行推进。
**Delivers:** Base64(字符串+文件)/URL 编解码、UUID/随机串、二维码生成、HTTP 状态码速查、哈希/加密(Web Crypto 优先 + "非安全用途"标注)、正则测试器、图片 Base64。
**Uses:** 每工具 PR 验收三件套防守 Pitfall 7

### Phase 6: 赛博朋克视觉强化
**Rationale:** ARCHITECTURE Build Order 把风格化放在"可用骨架"之后;风格化限定首页/导航,工具区保持克制。
**Delivers:** 首页强风格(glow/glitch/HUD,纯 CSS 动画)、effects.css 装饰层、motion-v 可选、逐条对照 Pitfall 5、Lighthouse a11y ≥ 95 验收。
**Avoids:** Anti-pattern 4(box-shadow 动画)、Pitfall 5 复发

### Phase 7: 差异化增强(URL 状态编码 / Cmd+K / PWA)
**Rationale:** FEATURES 将三者定位 v1.x——触发条件分别是"路由结构定稿"、"工具 >15"、"构建管线成熟";PWA 做成里程碑末尾项以防 SW 缓存坑。
**Delivers:** URL 状态编码(含长度上限与"只传数据不传标记"安全规则)、Cmd+K 命令面板、PWA 可安装+离线。
**Avoids:** Pitfall 1 的反射型 XSS 变体(分享 URL 渲染管线)

### Phase 8: 办公效率双线第一批
**Rationale:** PROJECT.md 点名的第二条产品线;图片压缩的 Worker/EXIF/HEIC 是专项坑,值得独立 Phase。
**Delivers:** 图片压缩(canvas.toBlob + Web Worker)、Markdown 编辑/预览(CodeMirror + marked + DOMPurify)、颜色工具(colord)。
**Avoids:** Pitfall 6 文件侧怪癖(EXIF 方向、HEIC、大文件限流)

### Phase Ordering Rationale

- **契约先行:** 注册表 Tool 接口是全站契约——Phase 1 定型并用 2 个真实工具验证,同时防住"工具堆砌"与"框架镀金"两种对称失败(Pitfall 7)。
- **先基建后批量:** 预渲染+meta(Phase 3)在批量工具(Phase 5)之前,ARCHITECTURE 明示"先有每工具 meta 再批量加工具,避免返工";bundle 预算与 lint 卡口同理。
- **设计系统先于风格化:** Phase 2 tokens/对比度/reduced-motion 基线 → Phase 6 强风格化逐条对照,顺序颠倒即头号返工源。
- **工具批次独立成 Phase:** 隔离范围蔓延;每工具是"加目录+注册表一行",批次内可并行。
- **部署决策不可逆前置:** Phase 3 的托管/域名选择影响收录与迁移成本,必须先于任何依赖公网流量的验收。

### Research Flags

Phases likely needing deeper research during planning(`/gsd-plan-phase --research-phase`):
- **Phase 3(SEO 与部署):** EdgeOne Pages 生产级配置、域名/ICP 备案流程细节、vite-ssg 与 unhead/行为在真实构建中的坑——本站命脉,值得专项研究。
- **Phase 8(办公双线):** 图片压缩 EXIF/HEIC/Worker 专项;marked+DOMPurify 消毒管线集成。
- **Phase 2(可选):** 赛博朋克视觉方向(色板/等宽字体/中文 webfont 子集化)——设计决策多于技术,若走 UI 设计流程可免 research-phase。

Phases with standard patterns(skip research-phase):
- **Phase 1:** Vue/Vite/Tailwind 生态文档充分,it-tools 提供源码级参照
- **Phase 4:** fuse.js + VueUse 成熟模式
- **Phase 5:** 各工具均有成熟库与竞品参照(正则/哈希/二维码实现路径明确)
- **Phase 6:** CSS 效果模式明确(伪元素 + opacity/transform),约束已在 PITFALLS 列清
- **Phase 7:** vite-plugin-pwa 文档成熟,按"里程碑末尾接入"执行即可

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | 版本号来自 npm registry 第一方;部署平台行为经官方文档+多来源交叉;CodeMirror vs Monaco 体积对比为单源(toolkit.best,数字自洽且与生态共识一致) |
| Features | MEDIUM | it-tools 工具清单与依赖为一手源码验证(HIGH);竞品定位 MEDIUM;**v1 工具范围为启发式(LOW)**,已标注 |
| Architecture | HIGH | it-tools 源码级验证 + Vue Router/Vite/MDN/VueUse 官方文档,核心模式有多项目变体佐证 |
| Pitfalls | MEDIUM | W3C WCAG/MDN 官方背书(HIGH);其余多源交叉;单源条目已在 PITFALLS.md 内标注 |

**Overall confidence:** MEDIUM-HIGH——架构与坑清单置信度高,可直接支撑 roadmap;不确定性集中在部署备案决策与 v1 工具取舍,均为业务决策而非技术风险。

### Gaps to Address

- **ICP 备案与否未决:** 影响 Phase 3 部署路径(大陆可用区 vs 全球不含大陆)。两条路径代码零差异,建议按未备案路径先上线,备案通过后切加速区域——Phase 3 规划时需作者显式决策。
- **赛博朋克具体视觉未定:** 色板/字体/中文 webfont 子集化方案在 Phase 2 设计阶段确定;约束已明确(装饰字体仅首页少量字符、系统字体栈优先)。
- **v1 工具清单排序为启发式(LOW 证据):** 未找到个人工具箱站的直接经验帖;最终按"作者自用频率"定序,正则测试器与哈希/加密可对调。
- **EdgeOne Pages 实际构建/部署体验未实测:** Phase 3 第一件事是打通最小部署验证(hello-world → 完整站),再固化管线。
- **xlsx(SheetJS)非标准安装方式:** tgz URL 安装与 Vite 打包的兼容性在 Excel 类工具(Phase 8 之后)接入时验证,或直接换 exceljs。
- **unplugin-vue-router 与注册表派生路由的取舍:** ARCHITECTURE 采用注册表 `map` 派生(主方案),unplugin 的类型化路由为可选增强——Phase 1 做唯一决策,不并存两套路由真相。

## Sources

### Primary (HIGH confidence)
- it-tools GitHub 源码(raw 文件):`src/tools/tool.ts`、`tools.types.ts`、`src/tools/index.ts` — Tool 接口/defineTool/注册表架构/依赖清单;GitHub API star 数 40,460
- npm registry(2026-09-04 实时查询)— 全部版本号第一方来源
- Context7 官方文档:`/antfu-collective/vite-ssg`(peerDependencies/includedRoutes)、`/websites/vuejs`、`/websites/tailwindcss`、`/websites/nuxt_4_x`、`/withastro/docs`、`/vercel/next.js`
- W3C WCAG 2.1(Technique C39、SC 2.3.1/2.3.3)+ MDN(prefers-reduced-motion、Clipboard API、CSS 自定义属性/@property)
- EdgeOne Makers 官方文档(pages.edgeone.ai,2026-08)— 免费层配额、备案与加速区域规则
- SheetJS 官方 CDN(cdn.sheetjs.com)— npm xlsx 停更与 CVE 事实

### Secondary (MEDIUM confidence)
- Vue Router / Vite / VueUse 官方文档与 DeepWiki it-tools 架构索引(与源码交叉一致)
- toolkit.best《为什么我们用 CodeMirror 6 而不是 Monaco》(2026-05)— 体积/移动端实测(单源,生态共识佐证)
- Vercel/GitHub Pages 大陆访问:CSDN、知乎、掘金、hqyman.cn 多来源交叉(2024–2026)
- 竞品资料:he3 官网/GitHub、DevUtils 官网/App Store/CSDN 解析、tool.lu、菜鸟工具
- 中文技术社区性能与兼容共识:box-shadow 动画掉帧、iOS <16px 输入放大、moment→dayjs 迁移(多来源一致)
- 图片压缩生态:掘金 Squoosh WASM 系列(2026)、browser-image-compression 文档

### Tertiary (LOW confidence)
- v1 工具范围启发式 — 无个人工具箱站直接经验帖,由 it-tools 架构模式 + side-project 范围控制原则推断;落地时按作者自用频率校正
- tool.lu/菜鸟工具检索结果薄弱 — 仅作中文工具站标配的背景参考
- 中文工具站最佳实践部分 — 检索中内容农场页面已过滤,结论经 3+ 独立来源交叉后才采信

---
*Research completed: 2026-09-04*
*Ready for roadmap: yes*
