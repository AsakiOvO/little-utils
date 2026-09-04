# Feature Research

**Domain:** 开发者 & 办公工具箱网站（纯前端静态站，本地计算，公网免费开放）
**Researched:** 2026-09-04
**Confidence:** MEDIUM（工具清单与依赖来自竞品官方仓库一手源码 HIGH；竞品定位与最佳实践来自多源网络检索 MEDIUM；v1 范围启发式为 LOW，已在文中标注）

## Feature Landscape

### Table Stakes (Users Expect These)

用户默认存在、缺失即流失的功能。依据：IT-Tools（40.4k stars，2026-06）工具清单与其站点功能（官方仓库一手验证）、中文社区高频工具调研（知乎 2026-01）、tool.lu/菜鸟工具类站点的标配集合。

**站点级功能（平台的骨架）：**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 每工具独立可分享 URL | 工具站流量全部来自搜索引擎直达工具页；无独立路由 = 无 SEO、无分享 | LOW | 每个工具一个 route（如 /json-formatter），工具名即关键词 |
| 分类导航首页 | 所有竞品（tool.lu、it-tools、菜鸟工具）首页均为分类网格；用户靠浏览找工具 | LOW | 分类 landing page 同时是 SEO 承接页 |
| 关键词搜索 | 用户记住的是"我想格式化 JSON"而非菜单层级 | LOW | fuse.js（零依赖 ~6KB，it-tools 同款）本地模糊搜索即可，无需服务端 |
| 收藏/最近使用 | it-tools 首页有 Favorites 区；回访用户直达高频工具 | LOW | pinia store + localStorage，无需登录（与 PROJECT.md 决策一致） |
| 暗色模式 | 开发者工具站事实标准（it-tools、he3、DevUtils 全部支持） | LOW | CSS 变量 + localStorage 持久化 + prefers-color-scheme 默认值 |
| 移动端响应式 | 办公用户（非开发者）大量从手机访问二维码/颜色类工具 | MEDIUM | 工具区布局需为输入/输出双栏在窄屏堆叠做设计 |
| 纯本地计算（隐私声明） | DevUtils 的核心卖点就是"数据不出本机"；浏览器端计算是本品类免费版对抗在线工具的基本盘 | LOW | 架构约束已定（无后端）；在页脚/工具页明示"数据不离开浏览器" |
| 复制到剪贴板 | 每个输出工具的最后一厘米；缺失则用户手工选择复制，体验崩坏 | LOW | navigator.clipboard + 复制成功 toast |
| 基础 SEO（每工具 meta + sitemap） | 中文工具站（tool.lu 等）的全部流量逻辑：工具名做关键词，独立 URL 承接搜索 | MEDIUM | 纯 SPA 百度收录差（百度爬虫不执行 JS）；需构建期预渲染 + 每路由 title/description/OG |

**工具级功能（第一批工具的选择）：**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| JSON 格式化/校验/压缩 | 中外社区公认第一刚需（it-tools 有 5 个 JSON 工具；知乎 2026-01 程序员高频工具第一名） | LOW-MEDIUM | JSON.parse 校验 + 格式化/压缩/排序；编辑器用 monaco-editor 或 codemirror 提升档次 |
| Base64 编解码（字符串） | 最高频编码类工具 | LOW | js-base64 或原生 atob/btoa（注意 UTF-8） |
| URL 编解码 + URL 解析 | 常与 Base64 并列的高频项 | LOW | encodeURIComponent + URL API |
| 时间戳转换（含时区） | 三大高频工具之一；带时区显示是加分项 | LOW | 原生 Intl.DateTimeFormat；双向（时间戳↔日期时间） |
| 哈希/加密（MD5/SHA/AES） | 密码学类是 it-tools 最大分类之一 | LOW-MEDIUM | crypto-js（MD5/SHA/AES/DES）；明确标注"用于开发调试，非安全用途" |
| 正则测试器 | 开发调试高频；it-tools、he3、DevUtils 均内置 | MEDIUM | 匹配高亮、分组捕获、常用正则速查（邮箱/手机号/IP）；randexp 可生成随机样例 |
| UUID/随机字符串生成 | 后端开发高频 | LOW | crypto.randomUUID + uuid 库（v4/v7/ULID 可选） |
| 二维码生成（文本→QR） | 办公/移动场景桥梁工具，非开发者也用 | LOW | qrcode npm 库（it-tools 同款 ^1.5.1）；支持尺寸/纠错级别 |
| HTTP 状态码速查 | PROJECT.md 已点名；简单但高频 | LOW | 静态数据表 + 搜索过滤 |
| 图片 Base64 / 文件↔Base64 | 前端联调高频 | LOW | FileReader + btoa；与 Base64 工具合并亦可 |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| URL 状态编码（输入+选项写进 query） | 分享链接即复现结果（如 /json-formatter?input=...&mode=compact）；调研中 it-tools、he3、DevUtils、tool.lu 均未做，属真空地带 | MEDIUM | 需处理长度上限（超长则仅保留选项不保留内容）与 encodeURIComponent |
| Cmd+K 命令面板 | Linear/Vercel/Raycast 式键盘优先导航，2026 年已被视为现代 web 应用标志；he3 的口碑点即"快捷键唤起" | MEDIUM | fuse.js 驱动；Vue 生态有现成 CommandPalette 组件（Nuxt UI 思路可移植） |
| PWA + 离线可用 | 工具箱是经典离线场景；it-tools 用 vite-plugin-pwa 实现可安装+离线；弱网/内网环境可用性是杀手锏 | MEDIUM | vite-plugin-pwa（workbox 预缓存）；与静态托管天然兼容 |
| 办公效率双线（图片压缩/格式转换、Markdown 编辑/预览、颜色工具） | it-tools 几乎无办公向工具（无图片压缩！）、中文工具站有但体验陈旧——差异化空间明确，且是 PROJECT.md 点名的第二条产品线 | MEDIUM-HIGH | 图片压缩：v1 用 canvas.toBlob（LOW），WASM 编码器（MozJPEG/libwebp 路线）留后手；Markdown 用 md-editor-v3/vditor；颜色用 colord（it-tools 同款） |
| 电商/SKU·商品编码工具族 | 作者的苏宁电商开发场景独家积累；市面无竞品覆盖，是"自用刚需长尾外溢"的护城河 | MEDIUM | 从自身工作流提炼 2-3 个即可（如 SKU 编码生成/解析）；优先级服从作者日常频率 |
| 接口 Mock 数据生成器 | PROJECT.md 点名；配合作者接口开发场景 | MEDIUM | 按 JSON Schema/模板生成假数据（faker.js 类）；纯前端可行 |
| 赛博朋克《边缘行者》风格化首页 | 视觉即记忆点：工具站同质化严重，强风格首页/导航 + 克制的工具区是天然传播差异 | MEDIUM | 风险在执行（glitch 效果易伤可用性）；PROJECT.md 已定"工具区克制"原则 |
| 中文优先 + 国内可访问 | 面向国内用户的工具站普遍陈旧且广告泛滥；干净无广告+快+中文是体验差异 | LOW-MEDIUM | 托管选 EdgeOne Pages 类国内节点（STACK.md 范畴）；文案中文优先 |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| 用户账户/登录体系 | "收藏跨设备同步"听起来很美 | 违背 PROJECT.md 核心决策（无后端）；注册墙直接杀掉工具站的即开即用价值 | localStorage 收藏 + URL 状态编码覆盖 90% 需求；导出/导入收藏 JSON（v1.x 可选） |
| 云端代码片段/数据同步 | 常与账户绑定提出 | 需要后端+数据库，打破纯前端架构与隐私定位 | 每工具支持"复制为链接"（URL 状态编码）实现事实上的分享同步 |
| 服务端处理（大文件转换等） | Office 文档转换等浏览器端做不完美 | 数据出浏览器 = 品类基本盘塌掉；且引入运维成本 | 只提供浏览器端可行的文件转换；做不到的品类明确不做 |
| 广告/商业化 | 中文工具站普遍模式 | 个人项目收益趋零、体验与口碑双输（PROJECT.md 已排除） | 无；保持干净本身就是对国内竞品的差异化 |
| 多语言 i18n（v1 就上） | it-tools 有 vue-i18n | 翻译维护负担 × 工具数量，个人项目维护不起；推迟到有真实海外流量再做 | 中文优先，文案集中管理留好抽取余地 |
| 社区工具提交/插件生态 | he3 的路线，看似增长引擎 | 需要审核管线、模板系统、治理；对个人站是纯负担 | 每工具一文件夹的注册表架构，让"未来接受 PR"成本为零即可 |
| AI 功能（AI 翻译/AI 格式化等） | 2026 年的普遍诱惑 | 需要 API key 或后端代理，违背无后端+免费+纯前端三重约束 | 不做；若未来做，仅限自带 key 的 BYOK 模式（v2+ 再议） |
| 工具数量军备竞赛（对标 he3 的 500+） | "工具多=平台强"的错觉 | 维护成本爆炸，半成品工具拉低整站口碑 | 12-20 个高质量高频工具 > 500 个平庸工具；按需增量添加 |

## Feature Dependencies

```
[工具注册表/站点骨架 (route per tool)]
    └──requires──> [每工具独立 URL]
                        └──requires──> [SEO 预渲染 (vite-ssg 类) + 每路由 meta]
                                            └──enhances──> [分类 landing pages]

[工具注册表] ──feeds──> [分类导航首页]
    └──feeds──> [fuse.js 搜索]
                    └──enhances──> [Cmd+K 命令面板]

[localStorage] ──requires──> [收藏/最近使用] 与 [暗色模式持久化]（互不依赖，共同依赖）

[每工具独立 URL] ──requires──> [URL 状态编码（分享即复现）]

[vite 构建管线] ──requires──> [PWA 离线（vite-plugin-pwa）]

[Web Worker] ──requires──> [图片压缩（大文件不卡 UI）] ──enhances──> [办公效率双线]

[剪贴板 API] ──enhances──> [所有输出型工具]
```

### Dependency Notes

- **SEO 依赖每工具独立 URL：** 预渲染必须逐路由进行，工具注册表（每工具一个 route + meta 字段）是 SEO 的前置，必须最先定架构。
- **搜索/收藏/Cmd+K 共享注册表数据源：** 注册表含 name/keywords/category/icon，三类导航功能都是它的不同视图——架构一次做对，功能是增量。
- **收藏与暗色模式都依赖 localStorage 封装：** 建一个统一的 storage 模块，避免各自为政。
- **图片压缩与 Web Worker：** canvas.toBlob 同步处理 >5MB 图会卡 UI；Worker 是该工具达到"可用"门槛的隐性依赖（复杂度标 MEDIUM 的原因）。
- **无强冲突对：** 本品类功能间罕见真冲突；唯一注意 Cmd+K 面板与赛博朋克强风格化的设计一致性（视觉债务，非技术冲突）。

## MVP Definition

### Launch With (v1)

最小可上线集 = 站点骨架 + 10 个最高频工具 + 4 项站点级体验（与 PROJECT.md Active 需求逐条对应）：

- [ ] 站点骨架：每工具独立路由 + 分类导航首页 + fuse.js 搜索 — 一切功能的数据源与流量入口
- [ ] 收藏/最近使用（localStorage）— 回访效率，PROJECT.md 点名
- [ ] 暗色模式 + 移动端响应式 — PROJECT.md 点名
- [ ] SEO：构建期预渲染 + 每路由 meta + sitemap — PROJECT.md 点名，公网流量前提
- [ ] JSON 格式化/校验 — 开发者第一刚需
- [ ] 时间戳转换 — 三大高频之一
- [ ] Base64（字符串+文件）/ URL 编解码 — 高频编码对
- [ ] UUID/随机字符串生成 — 后端高频
- [ ] 二维码生成 — 办公侧唯一进 v1 的工具（受众最广）
- [ ] HTTP 状态码速查 — PROJECT.md 点名，实现成本最低
- [ ] 哈希/加密工具（MD5/SHA/AES）— 密码学类代表
- [ ] 正则测试器 — 调试高频（若 v1 工期紧，可与哈希对调顺序）

### Add After Validation (v1.x)

- [ ] Cmd+K 命令面板 — 触发条件：工具数 >15 后导航收益显现
- [ ] PWA 离线 — 触发条件：站点稳定后一次性接入（构建管线成熟）
- [ ] URL 状态编码（分享即复现）— 触发条件：核心工具稳定、路由结构定稿
- [ ] 图片压缩/格式转换（canvas.toBlob 版）+ 图片 Base64 — 办公双线第一弹
- [ ] Markdown 编辑/预览 — 办公双线第二弹
- [ ] 颜色工具（colord）+ 二维码 WiFi 版 — 办公双线补全
- [ ] 接口 Mock 数据生成、SKU/商品编码工具族 — 按作者自身工作流频率排期

### Future Consideration (v2+)

- [ ] WASM 图片编码器（MozJPEG/libwebp，Squoosh 路线）— 仅当 canvas 版压缩比不满足
- [ ] Office 文档转换（docx/xlsx → PDF 等）— 纯前端可行性需 Phase 级专项调研（mammoth/SheetJS 类库覆盖不全），大概率做成"部分支持+明确告知"
- [ ] i18n 多语言 — 仅当出现真实海外流量
- [ ] 收藏导出/导入 — 仅当多设备需求被真实提出

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| 站点骨架（路由/注册表/分类导航/搜索） | HIGH | MEDIUM | P1 |
| JSON 格式化/校验 | HIGH | LOW | P1 |
| 时间戳转换 | HIGH | LOW | P1 |
| Base64/URL 编解码 | HIGH | LOW | P1 |
| 收藏/最近使用 | HIGH | LOW | P1 |
| 暗色模式 + 响应式 | HIGH | LOW-MEDIUM | P1 |
| 每 URL SEO（预渲染+meta+sitemap） | HIGH | MEDIUM | P1 |
| UUID/随机串 | MEDIUM | LOW | P1 |
| 二维码生成 | MEDIUM | LOW | P1 |
| HTTP 状态码速查 | MEDIUM | LOW | P1 |
| 哈希/加密 | MEDIUM | LOW-MEDIUM | P1-P2 |
| 正则测试器 | MEDIUM | MEDIUM | P2 |
| Cmd+K 命令面板 | MEDIUM | MEDIUM | P2 |
| PWA 离线 | MEDIUM | MEDIUM | P2 |
| URL 状态编码（分享即复现） | MEDIUM | MEDIUM | P2 |
| 图片压缩/格式转换 | MEDIUM | MEDIUM（canvas 版） | P2 |
| Markdown 编辑/预览 | MEDIUM | MEDIUM | P2 |
| 颜色工具 | LOW-MEDIUM | LOW | P2-P3 |
| 接口 Mock / SKU 工具族 | HIGH（作者本人）/LOW（大众） | MEDIUM | P2-P3 |
| WASM 图片编码 / Office 转换 / i18n | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | IT-Tools (40.4k★) | He3 | DevUtils | tool.lu/菜鸟工具 | Our Approach (little-utils) |
|---------|-------------------|-----|----------|------------------|------------------------------|
| 工具规模 | ~90 个，精选 | 500+（宽而杂） | ~40 个（付费解锁） | 数百个 | 12-20 个高质量起步，按需增长 |
| 技术路线 | Vue3+naive-ui+monaco，纯前端 | 桌面优先(Tauri 系)+Web | macOS 原生离线 | 传统多页站+后端渲染 | Vue/Vite 纯前端静态（同 it-tools 路线） |
| 搜索 | 顶栏 fuse.js 模糊搜索 | 智能搜索+全局快捷键唤起 | 原生菜单栏快搜 | 页面内搜索（弱） | fuse.js + Cmd+K 面板（v1.x） |
| 收藏/最近 | Favorites 区（localStorage） | 有 | 有（桌面级） | 无 | localStorage 收藏+最近使用 |
| 暗色模式 | ✅ | ✅ | ✅ | 部分（陈旧） | ✅ 默认跟随系统 |
| 可分享 URL | ✅ 每工具路由 | Web 版有 | ❌（桌面应用无 URL） | ✅ | ✅ 且加 URL 状态编码（输入进 query）——竞品均无 |
| 离线/PWA | ✅ vite-plugin-pwa | 桌面端天然离线 | ✅ 天然离线 | ❌ | ✅ v1.x 接入 vite-plugin-pwa |
| SEO 强度 | 一般（英文，SPA） | 一般 | 不适用 | 强（内容农场式，每工具页+文章流） | 每工具预渲染页+关键词化标题，国内节点 |
| 隐私声明 | 弱 | 弱 | 强（核心卖点） | 无 | 页面明示"数据不离开浏览器" |
| 办公向工具 | 几乎无（无图片压缩） | 有 | 无 | 有（多广告、体验差） | 双线定位：图片/Markdown/颜色/QR |
| 独特定位 | 开源+自托管社区 | 数量+桌面唤醒 | 付费离线隐私 | 流量生意 | 赛博朋克风格+电商开发场景工具+干净无广告中文站 |

## Sources

- **IT-Tools（一手，HIGH）**：GitHub 仓库源码验证 — 工具清单（`src/tools` 目录 90+ 项）、`package.json` 依赖（fuse.js、monaco-editor、crypto-js、qrcode、naive-ui、vite-plugin-pwa、@vueuse/head 等）、README（Docker 自托管）；GitHub API star 数 40,460（2026-06 检索）。https://github.com/CorentinTh/it-tools
- **He3（MEDIUM）**：官网（2023 快照，500+ 工具表述）、GitHub 组织 he3-app（tools-example 社区工具模板仓库）、阿里云开发者/知乎/掘金介绍文（2022-2024，智能搜索、快捷键唤起）。https://github.com/he3-app/tools-example
- **DevUtils（MEDIUM）**：App Store 页面（免费版含 3 工具、内购解锁）、devutils.com 官网、CSDN 深度解析（2026-03，JSON/JWT/Base64/UnixTime 模块化架构、离线隐私卖点、Setapp 集成）。https://devutils.com/
- **中文工具站（MEDIUM）**：tool.lu 首页与开发类分类页（代码格式化/压缩/加密、JSON、正则、favicon 等）、菜鸟工具 jyshare.com 与 cainiaojc.com（在线调试器、简繁转换、进制转换）、知乎《2026 程序员在线工具网站推荐》（2026-01，高频工具=JSON/Base64/时间戳）。
- **站点级最佳实践（MEDIUM）**：fuse.js 官网（2026-08 更新）、Cmd+K 命令面板模式文章（2026-05，Linear/Vercel/Raycast 范式）、Nuxt UI CommandPalette 组件文档（fuse.js 驱动）。
- **图片压缩（MEDIUM）**：掘金《基于 Squoosh WASM 的浏览器端图片转换库》（2026-01，use-squoosh 零依赖库）、博客园《构建强化版 Squoosh》（2025-10，Google 2023 关闭 Squoosh、libimagequant-wasm 社区接力）、掘金《用 6 个 WASM 编码器干掉 canvas.toBlob》（2026-02）。
- **静态站 SEO（MEDIUM）**：CSDN Vue3 SEO 方案对比（2025-05，预渲染/SSG/动态 meta）、掘金 vite-ssg 实战（2026-01）、vite-plugin-ssr 官方预渲染文档、腾讯云 Astro vs VitePress（2026-06）。注：8 条检索结果中 2 条为内容农场克隆站，相关技术结论已由 3+ 独立来源交叉验证。
- **v1 范围经验（LOW，证据有限）**：未找到针对个人工具箱站的直接经验帖，结论由 it-tools 单仓库每工具一文件夹的架构模式 + 通用 side-project 范围控制原则推断；"8-12 个高频工具先行"为实践启发式而非量化结论。

---
*Feature research for: 开发者 & 办公工具箱网站（little-utils）*
*Researched: 2026-09-04*
