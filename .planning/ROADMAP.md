# Roadmap: little-utils — 开发者 & 办公工具箱

## Overview

从零构建一个纯前端、数据不出浏览器的公网工具箱站。路径遵循研究结论的"契约先行 → 基建 → 批量"节奏:先用"注册表契约 + XSS 消毒管线 + 2 个真实工具"验证最小框架(Phase 1),确立设计系统与响应式/可访问性基线(Phase 2),打通 SSG 预渲染 SEO 与 EdgeOne 部署管线让站点公网可用(Phase 3);在"每工具 meta 体系"就绪后补齐首页/搜索/收藏的站点级体验(Phase 4),再以"新增目录 + 注册表一行"模式批量生产 7 个开发辅助工具(Phase 5)与 4 个办公效率工具(Phase 8);中间穿插赛博朋克《边缘行者》视觉强化(Phase 6,设计令牌就绪之后)与三项差异化能力——URL 状态编码、Cmd+K 命令面板、PWA(Phase 7)。终点:公网可访问、搜索引擎可收录、13 个高质量工具、强风格首页 + 克制工具区。

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: 应用骨架与工具注册表契约** - Vite+Vue3+TS+Tailwind 脚手架、defineTool 注册表派生路由、XSS 消毒渲染管线,以 JSON 格式化 + 时间戳转换 2 个工具验证契约 (completed 2026-09-07)
- [ ] **Phase 2: 设计系统与响应式/可访问性基线** - 三层设计令牌(对比度校验)、暗色模式、16px/44px 移动端规则、reduced-motion 降级、基础组件库
- [ ] **Phase 3: 预渲染 SEO 与部署管线** - vite-ssg 每路由静态 HTML + meta、sitemap/robots、EdgeOne Pages 公网部署、零外链与体积预算
- [ ] **Phase 4: 站点级体验(首页/搜索/收藏)** - 分类导航首页、fuse.js 搜索、收藏/最近使用、隐私声明
- [ ] **Phase 5: 开发辅助工具批量补齐** - Base64/URL/UUID/哈希加密/正则/状态码/二维码 7 个工具批量交付
- [ ] **Phase 6: 赛博朋克视觉强化** - 首页/导航 glow/glitch/HUD 强风格化,装饰层隔离,双主题氛围一致
- [ ] **Phase 7: 差异化增强(URL 状态/命令面板/PWA)** - 分享链接复现结果、Cmd+K 快速跳转、PWA 离线
- [ ] **Phase 8: 办公效率双线第一批** - 图片压缩/转格式、Markdown 编辑预览、颜色工具

## Phase Details

### Phase 1: 应用骨架与工具注册表契约

**Goal**: 用户可访问站点并立即使用首批 2 个工具(JSON 格式化、时间戳转换)完成真实操作;"注册表 → 路由/导航/分包"派生机制与 XSS 消毒渲染管线作为全站契约定型,后续工具零改动接入
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: ARCH-01, ARCH-02, ARCH-04, TOOL-01, TOOL-02
**Success Criteria** (what must be TRUE):

  1. 用户可打开 JSON 工具完成格式化/压缩/校验,长数字 ID 不丢失精度(电商场景)
  2. 用户可在时间戳工具中完成 Unix 时间戳与日期时间的双向转换,含时区显示
  3. 每个工具可通过独立 URL 直达、刷新不 404、可直接分享;重依赖不进首屏 bundle(路由级懒加载生效)
  4. 工具输出可一键复制;向工具粘贴含 `<script>`/`<img onerror>` 的内容仅渲染为纯文本,不执行任何脚本(唯一渲染出口 + ESLint 禁 v-html 生效)

**Plans:** 5/5 plans complete

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — 行走骨架：脚手架 + 设计令牌 + 注册表契约与派生路由 + 双布局框架壳（Wave 1）

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — @lucide/vue 供应链闸门（blocking-human）+ 时间戳转换工具端到端 + useCopy（Wave 2）
- [x] 01-03-PLAN.md — XSS 消毒渲染管线 + SafeHtml 唯一出口 + ESLint 卡口（Wave 2，与 01-02 并行）

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-04-PLAN.md — JSON 格式化工具（tokenizer 保真 + CodeMirror + 树视图）+ 分包预算卡口（Wave 3）

**Wave 4** *(gap closure — 验证缺口 CR-01/WR-01 + 评审警告 WR-02/03/04)*

- [x] 01-05-PLAN.md — 缺口闭合：时间戳非法时区白屏修复（CR-01）+ detectUnit trim（WR-01）+ 测试基建路径错位（WR-02/03）+ check-chunks 注册表派生（WR-04）（Wave 4）

### Phase 2: 设计系统与响应式/可访问性基线

**Goal**: 用户在任何设备、任何主题下都能舒适使用站点——霓虹设计令牌统一视觉、暗色模式可切换且被记住、移动端输入不缩放、动效可随系统降级;工具操作区由中性基础组件保证克制易读
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: STYL-01, STYL-03, SITE-04, SITE-05
**Success Criteria** (what must be TRUE):

  1. 用户可切换暗色/亮色模式:默认暗色、可跟随系统偏好、选择被持久记住(刷新后保持)
  2. 用户可在手机上完成一次完整工具操作:输入框 ≥16px 不触发 iOS 强制放大,触控目标 ≥44px 可准确点按
  3. 系统开启"减少动态效果"后,站点动画/过渡自动降级为静态或极简过渡
  4. 霓虹青/品红/电光黄以 oklch 设计令牌贯穿全站,主题文字对比度 ≥ 4.5:1(可测量验证)
  5. 输入框/卡片/按钮/Tabs/可复制文本域等基础组件就位,工具操作区无装饰干扰、克制易读

**Plans**: 6/7 plans executed

Plans:
**Wave 1**

- [x] 02-01-PLAN.md — 三层令牌重构(tokens.css 亮暗双套 + tokens.ts 单点 + 对比度/同步双保险)+ base.css 全局基线(16px/reduced-motion/focus-visible/瞬切)(Wave 1)
- [x] 02-02-PLAN.md — useThemeMode 三态状态机 + ThemeToggle 双 layout 挂载 + FOUC 内联脚本与预渲染默认暗色(Wave 1,与 02-01 并行)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-03-PLAN.md — 六件套 A:Button/Input/Card(44px/16px 默认层 + 错误态 aria)(Wave 2)
- [x] 02-04-PLAN.md — 六件套 B:CopyableText(useCopy 封装)/Tabs(WAI-ARIA 键盘导航)(Wave 2)
- [x] 02-05-PLAN.md — CodeMirror 双主题(cm-theme + Compartment)+ oneDark 移除(Wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-06-PLAN.md — 存量迁移 I:ToolCard/home/not-found/双 layout + Typography/Spacing 归一(Wave 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 02-07-PLAN.md — 存量迁移 II:json-formatter + 阶段终局门禁 + D-23 手动验收 human-check(Wave 4)

**UI hint**: yes

### Phase 3: 预渲染 SEO 与部署管线

**Goal**: 全球用户(含中国大陆)可通过搜索引擎或直达链接访问每个工具页——每条路由是含 SEO meta 的真实静态 HTML,站点部署于公网并可持续自动交付;部署按"EdgeOne 全球(不含大陆)可用区先上线"路径,ICP 备案为并行非阻塞事项,通过后可零代码改动切换大陆加速区域
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: ARCH-03, ARCH-05
**Success Criteria** (what must be TRUE):

  1. `curl` 任意工具页返回的 HTML 包含该工具的标题与描述(非 JS 空壳),百度/Google 爬虫可收录
  2. sitemap.xml 与 robots.txt 可公网访问且包含全部工具路由
  3. 站点通过自定义域名在 EdgeOne Pages 公网可访问;无代理的大陆网络实测可打开
  4. 构建产物零第三方外链(字体自托管、依赖全本地打包),首包 gzip ≤ 200KB 体积预算检查通过
  5. 推送代码后站点自动构建并部署,新增工具页自动获得 meta 与 sitemap 收录

**Plans**: TBD

### Phase 4: 站点级体验(首页/搜索/收藏/信任)

**Goal**: 用户几秒内找到所需工具——分类导航、中英文模糊搜索、收藏置顶与最近使用、"数据不离开浏览器"隐私声明,构成完整"发现 → 使用 → 信任"体验;首页同时是 SEO 承接页
**Mode:** mvp
**Depends on**: Phase 1, Phase 2
**Requirements**: SITE-01, SITE-02, SITE-03, SITE-06
**Success Criteria** (what must be TRUE):

  1. 用户可在首页按分类浏览全部工具,并进入分类聚合页查看该类工具清单
  2. 用户输入中/英文关键词即可模糊搜索并直达工具(如"json"与"格式化"都能命中 JSON 工具)
  3. 用户可收藏常用工具并在首页置顶展示,可查看最近使用;关闭浏览器重开后仍保留(localStorage,无需登录)
  4. 站点明示"数据不离开浏览器"隐私声明;所有输出类工具均提供一键复制

**Plans**: TBD
**UI hint**: yes

### Phase 5: 开发辅助工具批量补齐

**Goal**: 开发者日常高频操作——编解码、加密哈希、正则测试、二维码等——全部可在站内完成;7 个工具以"新增目录 + 注册表一行"模式批量复制,每工具自动获得独立 URL、SEO meta、搜索可见与一键复制
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: TOOL-03, TOOL-04, TOOL-05, TOOL-06, TOOL-07, TOOL-08, TOOL-09
**Success Criteria** (what must be TRUE):

  1. 用户可对字符串与文件进行 Base64 编解码,中文无乱码(UTF-8 安全);可进行 URL 编解码与解析
  2. 用户可生成 UUID v4 与随机字符串
  3. 用户可计算 MD5/SHA 哈希与 AES 加解密(界面标注"非安全用途")
  4. 用户可在正则测试器中编写正则并实时看到匹配高亮;可查询 HTTP 状态码含义(支持搜索过滤);可由文本生成可调尺寸/纠错级别的二维码
  5. 每个新工具满足"PR 验收三件套":注册表元数据齐全、独立 URL 且预渲染 HTML 含 meta、复用共享设施(useCopy/基础组件)

**Plans**: TBD
**UI hint**: yes

### Phase 6: 赛博朋克视觉强化(首页/导航)

**Goal**: 用户打开首页即获得《边缘行者》式霓虹 + 故障艺术 + HUD 的第一印象;装饰效果严格限定在装饰层,工具区保持克制易读,双主题氛围一致且无障碍不翻车
**Mode:** mvp
**Depends on**: Phase 2, Phase 4
**Requirements**: STYL-02, STYL-04
**Success Criteria** (what must be TRUE):

  1. 首页与导航呈现强赛博朋克风格(霓虹 glow、glitch 文字、HUD 元素),动效为纯 CSS 且只动 opacity/transform
  2. 打开任一工具页验证:装饰效果不侵入工具操作区,可读性不受影响
  3. 亮色与暗色主题下赛博朋克氛围一致,切换主题后装饰效果均正常呈现
  4. 系统开启"减少动态效果"后,glitch/glow 装饰动画全部降级;Lighthouse a11y ≥ 95

**Plans**: TBD
**UI hint**: yes

### Phase 7: 差异化增强(URL 状态 / 命令面板 / PWA)

**Goal**: 三项竞品均无的体验落地——分享链接即复现输入输出、Cmd/Ctrl+K 键盘直达任意工具、PWA 离线可用;分享链接中的用户输入经消毒管线处理,不引入反射型 XSS
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: DIFF-01, DIFF-02, DIFF-03
**Success Criteria** (what must be TRUE):

  1. 用户在工具中输入内容后复制地址栏链接,他人打开该链接即复现相同输入输出;超长输入有长度上限保护
  2. 用户按 Cmd/Ctrl+K 唤起命令面板,键入关键词即可跳转任意工具
  3. 用户可将站点安装为 PWA,断网后仍能打开并使用已缓存工具;SW 更新有明确策略
  4. 打开恶意构造的分享链接(含脚本载荷)不执行任何脚本(经消毒渲染管线)

**Plans**: TBD
**UI hint**: yes

### Phase 8: 办公效率双线第一批

**Goal**: 办公用户可在浏览器本地完成图片压缩/格式转换、Markdown 编辑与颜色处理——文件全程不上传,补齐第二条产品线;图片处理的 EXIF/Worker 专项坑在本阶段集中解决
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: OFF-01, OFF-02, OFF-03, OFF-04
**Success Criteria** (what must be TRUE):

  1. 用户可在浏览器本地压缩图片(质量可调),iPhone 照片方向正确(EXIF 处理),大文件有体验兜底
  2. 用户可将图片本地转换为 WebP/JPEG 格式,文件不出浏览器
  3. 用户可编辑 Markdown 并实时预览、导出;预览内容经 XSS 消毒管线渲染
  4. 用户可取色并在 HEX/RGB/HSL 间互转,支持调色板
  5. 全部办公工具满足站点纪律:独立 URL + SEO meta、移动端可用、一键复制、搜索可发现

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 应用骨架与工具注册表契约 | 5/5 | Complete    | 2026-09-07 |
| 2. 设计系统与响应式/可访问性基线 | 6/7 | In Progress|  |
| 3. 预渲染 SEO 与部署管线 | 0/TBD | Not started | - |
| 4. 站点级体验(首页/搜索/收藏) | 0/TBD | Not started | - |
| 5. 开发辅助工具批量补齐 | 0/TBD | Not started | - |
| 6. 赛博朋克视觉强化(首页/导航) | 0/TBD | Not started | - |
| 7. 差异化增强(URL 状态/命令面板/PWA) | 0/TBD | Not started | - |
| 8. 办公效率双线第一批 | 0/TBD | Not started | - |
