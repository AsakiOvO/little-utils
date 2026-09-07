# little-utils — 开发者 & 办公工具箱

## What This Is

一个面向公网开放的纯前端静态工具箱网站，收集常用开发辅助与办公效率工具，帮助开发者（尤其是从事苏宁易购/电商开发的作者本人）和办公用户快速完成日常高频操作。所有工具在浏览器端本地完成计算，无需后端与数据库。界面采用赛博朋克《边缘行者》风格（霓虹 + 故障艺术 + HUD），首页与导航强风格化，工具操作区保持克制易读。

## Core Value

打开网站 → 几秒内通过分类或搜索找到所需工具 → 在浏览器端立即完成操作（格式化、转换、编码等），全程无需登录、无需上传数据到服务器。

## Business Context

- **Customer**: 作者本人及公网上的开发者/办公用户（免费开放）
- **Revenue model**: 无（个人项目，纯免费）
- **Success metric**: 作者日常开发/办公中频繁自用；公网访客可顺畅访问并完成工具操作
- **Strategy notes**: 无外部文档

## Requirements

### Validated

- ✓ 工具注册表契约：defineTool 元数据驱动，路由/导航/sitemap 从注册表派生 — Phase 1
- ✓ 每工具独立 URL + 路由级懒加载（重依赖不进首屏） — Phase 1
- ✓ XSS 消毒渲染管线：SafeHtml 唯一出口 + ESLint 卡口 — Phase 1
- ✓ JSON 格式化/压缩/校验（长 ID 精度保护） — Phase 1
- ✓ 时间戳双向转换（含时区） — Phase 1
- ✓ SSG 预渲染基线（vite-ssg，Phase 1 提前切换） — Phase 1
- ✓ 霓虹 oklch 设计令牌 + 暗色底（Phase 2 补亮色与降级） — Phase 1

### Active

- [ ] 站点框架：分类浏览 + 关键词搜索定位工具
- [ ] 收藏置顶：常用工具收藏/置顶，基于 localStorage，无需登录
- [ ] 暗色模式 + 移动端响应式适配（亮色主题与 reduced-motion 降级为 Phase 2 主体）
- [ ] SEO + 每个工具独立可分享 URL
- [ ] 接口开发辅助工具：接口 Mock、HTTP 状态码查询（JSON 工具已于 Phase 1 交付）
- [ ] 通用转换工具：URL/编码转换、加密解密、正则测试、二维码（时间戳已于 Phase 1 交付）
- [ ] 办公效率工具：文件转换、图片压缩/格式转换、Markdown 编辑、颜色工具等（按需逐步添加）
- [ ] 赛博朋克《边缘行者》风格 UI：首页/导航强风格化，工具区克制易读

### Out of Scope

- 后端服务与数据库 — 纯前端静态站，所有计算在浏览器端完成
- 用户账户体系 / 登录 — 公网开放免费使用，个性化状态用 localStorage 即可
- 云端代码片段同步 — 无后端，属于账户体系范畴
- 苏宁开放平台 API 签名/联调工具 — 用户明确未选择此方向，后续有需要再添加
- 广告 / 商业化 — 个人免费项目

## Context

- 工作区 `/Users/estrella/Code/demo/little-utils` 为空项目（仅工具配置目录），全新 greenfield 开发
- 作者从事苏宁易购相关开发，工具箱首先服务于自身开发与办公高频场景
- 技术栈与部署平台由调研 agent 研究后推荐（候选：Vue 3 / React；EdgeOne Pages / Vercel / GitHub Pages）
- 部署目标为公网，需考虑国内访问速度与 SEO（静态站 + 每工具独立路由）
- 界面风格参照赛博朋克动画《赛博朋克：边缘行者》：霓虹色（青/品红/电光黄）、故障艺术（glitch）文字效果、HUD/终端感

## Constraints

- **架构**: 纯前端静态站，无后端、无数据库 — 部署简单、维护成本低、隐私友好
- **隐私**: 所有工具计算必须在浏览器端本地完成，不向服务器上传用户数据
- **风格**: 首页与导航强赛博朋克风格化，工具操作区必须克制易用（可用性优先于炫酷）
- **SEO**: 公网站点，每个工具需有独立 URL 与基础 SEO（meta/SSG）
- **协作流程**: 用户要求 3 类 agent 分工 — 调研（researcher）、开发（executor）、测试审查（code-reviewer + verifier）

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 纯前端静态架构，无后端 | 用户选定；零运维、部署简单、数据不出浏览器 | ✓ Good（Phase 1 全程贯彻） |
| 工具方向双线：开发辅助 + 办公效率 | 用户两者都要，框架先行、工具按需扩展 | ✓ Good（注册表契约使双线接入零边际成本） |
| 赛博朋克《边缘行者》风格，氛围+克制度 | 用户选定推荐项：首页/导航强风格，工具区易读 | — Pending（Phase 6 全面验收） |
| 技术栈由调研 agent 推荐 | 用户无偏好，交由研究决定（候选 Vue 3 / React） | ✓ Good（Vue 3.5 + Vite 8 + vite-ssg + Tailwind 4 落地，86 测试绿） |
| 部署平台由调研 agent 推荐 | 用户无偏好，候选 EdgeOne Pages / Vercel / GitHub Pages | — Pending（Phase 3 落地） |
| Agent 分工与模型偏好：开发用 GLM-5.3-Flash，调研与测试审查期望用 DeepSeek-V4-Pro | 用户指定；GSD 运行时会话模型为 GLM-5.3-Flash，子 agent 无法直接指定外部模型名，以会话模型执行并把偏好记录在案 | — Pending（全流程以 GLM-5.3-Flash 运行，质量门全过） |
| 图标方案 lucide → @lucide/vue（包名修正） | lucide-vue-next 已弃用，research 一手证据修正；icon 字段存组件引用不变 | ✓ Good（人工供应链闸门执行后落地） |
| 路由手写派生（放弃 unplugin-vue-router） | unplugin-vue-router 并入 vue-router 5；文件路由与注册表双真相冲突 | ✓ Good（注册表单一路由真相确立） |
| CodeMirror 6 先行（Phase 1 引入） | D-01 costly；正则等后续编辑器工具复用 | ✓ Good（懒加载 + check-chunks 卡口防泄漏） |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-07 after Phase 1*
