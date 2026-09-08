# Requirements: little-utils — 开发者 & 办公工具箱

**Defined:** 2026-09-04
**Core Value:** 打开网站 → 几秒内通过分类或搜索找到所需工具 → 浏览器端立即完成操作，全程无需登录、数据不出浏览器

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### 站点体验（Site Experience）

- [ ] **SITE-01**: 用户可在首页按分类浏览工具（分类网格 + 分类聚合页）
- [ ] **SITE-02**: 用户可通过关键词搜索定位工具（fuse.js 本地模糊搜索，支持中英文关键词）
- [ ] **SITE-03**: 用户可收藏常用工具并在首页置顶展示，可查看最近使用（localStorage 持久化，无需登录）
- [x] **SITE-04**: 用户可切换暗色/亮色模式（默认暗色、跟随系统偏好、选择持久化）
- [x] **SITE-05**: 用户可在移动端正常使用全部核心功能（响应式，输入框 ≥16px 防 iOS 缩放，触控目标达标）
- [ ] **SITE-06**: 每个输出类工具支持一键复制，站点明示"数据不离开浏览器"隐私声明

### 架构基建（Architecture）

- [x] **ARCH-01**: 工具注册表契约（defineTool 元数据：name/path/category/keywords/懒加载组件），路由、导航、搜索、收藏校验、sitemap 全部从注册表派生
- [x] **ARCH-02**: 每个工具独立路由并懒加载（路由级代码分割，重依赖不进首屏 bundle）
- [ ] **ARCH-03**: 构建期 SSG 预渲染每条工具路由为含 SEO meta 的静态 HTML，生成 sitemap.xml 与 robots.txt
- [x] **ARCH-04**: 统一 XSS 消毒渲染管线（唯一渲染出口，ESLint 禁止 v-html/innerHTML 直插用户输入）
- [ ] **ARCH-05**: 部署管线（EdgeOne Pages + 自定义域名 + 构建产物零第三方外链 + bundle 体积预算检查）

### 开发辅助工具（Developer Tools）

- [x] **TOOL-01**: 用户可格式化/压缩/校验 JSON，长数字 ID 不丢失精度（电商场景）
- [x] **TOOL-02**: 用户可在 Unix 时间戳与日期时间之间双向转换（含时区显示与日期计算）
- [ ] **TOOL-03**: 用户可对字符串与文件进行 Base64 编解码（UTF-8 安全，无中文乱码）
- [ ] **TOOL-04**: 用户可进行 URL 编解码与解析（encodeURIComponent + URL API）
- [ ] **TOOL-05**: 用户可生成 UUID v4 与随机字符串
- [ ] **TOOL-06**: 用户可计算 MD5/SHA/AES 哈希与加密（MD5 用 crypto-js，其余优先 Web Crypto API）
- [ ] **TOOL-07**: 用户可在正则测试器中编写正则并实时查看匹配结果（CodeMirror 编辑器 + 高亮）
- [ ] **TOOL-08**: 用户可查询 HTTP 状态码含义（静态数据表 + 搜索过滤）
- [ ] **TOOL-09**: 用户可由文本生成二维码（可调尺寸/纠错级别，浏览器本地生成）

### 办公效率工具（Office Tools）

- [ ] **OFF-01**: 用户可在浏览器本地压缩图片（canvas.toBlob 实现，质量可调，处理 EXIF 旋转）
- [ ] **OFF-02**: 用户可将图片转换为 WebP/JPEG 格式（本地转换，不上传）
- [ ] **OFF-03**: 用户可编辑 Markdown 并实时预览、导出
- [ ] **OFF-04**: 用户可选取颜色并在 HEX/RGB/HSL 间互转，支持调色板

### 赛博朋克风格（Cyberpunk Style）

- [x] **STYL-01**: 设计系统先行：Tailwind 4 `@theme` 定义霓虹青/品红/电光黄（oklch）设计令牌，霓虹文字对比度 ≥ 4.5:1
- [ ] **STYL-02**: 首页与导航强风格化（glow/glitch/HUD，纯 CSS 动画，只动 opacity/transform）
- [x] **STYL-03**: 动效提供 `prefers-reduced-motion` 降级，工具操作区保持克制易读
- [ ] **STYL-04**: 亮暗双主题下赛博朋克氛围一致，装饰效果限定在装饰层（不污染工具区可读性）

### 差异化功能（Differentiators）

- [ ] **DIFF-01**: 工具输入状态可编码进 URL query，分享链接即复现输入输出（有长度上限保护）
- [ ] **DIFF-02**: 用户可按 Cmd/Ctrl+K 唤起全局命令面板快速跳转工具
- [ ] **DIFF-03**: 站点支持 PWA 离线访问（vite-plugin-pwa，含 SW 更新策略）

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### 电商/SKU 工具族

- **SKU-01**: 商品编码工具（作者独家场景，v1 未选择，v2 首选）
- **SKU-02**: 接口 Mock 工具（Office/电商联调场景）

### 办公扩展

- **OFFC-01**: Office 文件转换（docx/xlsx → PDF，需专项调研纯前端可行性）
- **OFFC-02**: WASM 图片编码器（AVIF/MozJPEG 高质量压缩）
- **OFFC-03**: 收藏/配置导出导入

### 国际化

- **I18N-01**: 多语言支持（v1 中文优先，i18n 架构预留）

## Out of Scope

| Feature | Reason |
|---------|--------|
| 用户账户体系 / 登录 | 纯前端无后端；个性化用 localStorage 即可（PROJECT.md 决策） |
| 后端服务 / 数据库 / 云端同步 | 架构约束：数据不出浏览器，零运维 |
| 苏宁开放平台 API 签名/联调工具 | 用户访谈明确未选择此方向 |
| 广告 / 商业化 | 个人免费项目 |
| AI 功能 | Anti-feature：与产品定位无关，增加复杂度 |
| 工具数量军备竞赛（500+ 工具） | Anti-feature：12–20 个高质量工具 > 500 个平庸工具 |
| Monaco 编辑器 | 2.5MB 体积、不做移动端支持，选 CodeMirror 6（STACK.md 结论） |
| 全量 UI 组件库（Element Plus 等） | 与赛博朋克强风格冲突，自研 5–6 个基础组件 |
| npm 源 xlsx 包 | 停更 + 未修 CVE，如需 Excel 处理必须从 cdn.sheetjs.com 安装 |
| Vercel / GitHub Pages 主部署 | 大陆 DNS 污染，国内可达性不达标（STACK.md 结论） |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ARCH-01 | Phase 1 | Complete |
| ARCH-02 | Phase 1 | Complete |
| ARCH-04 | Phase 1 | Complete |
| TOOL-01 | Phase 1 | Complete |
| TOOL-02 | Phase 1 | Complete |
| STYL-01 | Phase 2 | Complete |
| STYL-03 | Phase 2 | Complete |
| SITE-04 | Phase 2 | Complete |
| SITE-05 | Phase 2 | Complete |
| ARCH-03 | Phase 3 | Pending |
| ARCH-05 | Phase 3 | Pending |
| SITE-01 | Phase 4 | Pending |
| SITE-02 | Phase 4 | Pending |
| SITE-03 | Phase 4 | Pending |
| SITE-06 | Phase 4 | Pending |
| TOOL-03 | Phase 5 | Pending |
| TOOL-04 | Phase 5 | Pending |
| TOOL-05 | Phase 5 | Pending |
| TOOL-06 | Phase 5 | Pending |
| TOOL-07 | Phase 5 | Pending |
| TOOL-08 | Phase 5 | Pending |
| TOOL-09 | Phase 5 | Pending |
| STYL-02 | Phase 6 | Pending |
| STYL-04 | Phase 6 | Pending |
| DIFF-01 | Phase 7 | Pending |
| DIFF-02 | Phase 7 | Pending |
| DIFF-03 | Phase 7 | Pending |
| OFF-01 | Phase 8 | Pending |
| OFF-02 | Phase 8 | Pending |
| OFF-03 | Phase 8 | Pending |
| OFF-04 | Phase 8 | Pending |

**Coverage:**

- v1 requirements: 31 total(原统计"27"为笔误,按实际条目数修正)
- Mapped to phases: 31 ✓
- Unmapped: 0

---
*Requirements defined: 2026-09-04*
*Last updated: 2026-09-04 after roadmap creation*
