# Phase 3: 预渲染 SEO 与部署管线 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-09
**Phase:** 3-预渲染 SEO 与部署管线
**Areas discussed:** 域名与 ICP 路径, SEO meta 深度, 站点 URL 注入, 部署触发方式, 零外链与验收自动化

---

## 域名与 ICP 路径

| Option | Description | Selected |
|--------|-------------|----------|
| 已有域名 | 告知域名供 sitemap/canonical 使用 | |
| 还没有，待注册 | 注册后告知；构建先用占位域名 | |
| 暂用 EdgeOne 默认域名 | 先用 edgeone.app 分配域名上线，域名后再绑定 | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| 未备案 | 大陆加速不可用 → 全球（不含大陆）先上线 | ✓ |
| 备案中 | 备案期间先全球上线，通过后切换 | |
| 已备案 | 可直接接入大陆可用区 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 全球先上线（推荐） | ROADMAP 既定路径，两路径代码零差异 | ✓ |
| 等备案再上线 | 公网可见时间延后 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 允许抓取（推荐） | 默认域名阶段即让爬虫收录，换域名后重提交 | ✓ |
| 默认域名禁止抓取 | 避免重复收录，正式域名后再放开 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 单点常量（推荐） | SITE_URL 单点定义，换域名只改一处 | ✓ |
| 环境变量注入 | 构建时注入，灵活但多一层间接 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 纳入（推荐） | 人工提交 GSC/百度站长平台作为 human-check | ✓ |
| 不纳入 | 域名定稿后一并做 | |

**Notes:** STATE.md 挂起项「ICP 备案与否需作者显式确认」在本区域确认完毕（未备案）。

## SEO meta 深度

| Option | Description | Selected |
|--------|-------------|----------|
| 基础：title+description | 收录底线，最简 | |
| 标准：+canonical+og 基础件（推荐） | canonical + og:title/description/url；unhead 已就绪 | ✓ |
| 完整：+twitter card+og:image | 需设计自托管分享图 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 工具名 - 站名（推荐） | 「JSON 格式化 - little-utils」 | ✓ |
| 站名前置 | 品牌优先但关键词靠后 | |
| 由 Claude 决定 | 研究阶段定夺 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 不做（推荐） | JSON-LD 不做，收录靠基础 meta | ✓ |
| 做最小集 | 首页 WebSite + 工具页 SoftwareApplication | |

| Option | Description | Selected |
|--------|-------------|----------|
| 404 加 noindex（推荐） | 404 预渲染 HTML 仍生成但 noindex | ✓ |
| 都不特殊处理 | 依赖 404 状态码行为 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 复用注册表字段（推荐） | ToolMeta.description 契约零变更 | ✓ |
| 注册表新增 seoDescription | 更长描述但契约变更 | |

| Option | Description | Selected |
|--------|-------------|----------|
| Claude 起草后你审 | 写入计划，验收时人工确认 | ✓ |
| 现在就定 | 用户当场给文案 | |

## 站点 URL 注入

| Option | Description | Selected |
|--------|-------------|----------|
| EdgeOne 域名占位（推荐） | 先填预期默认域名，部署后修正重跑构建 | ✓ |
| 空值+构建警告 | 首次部署后第二次构建才有完整 sitemap | |

| Option | Description | Selected |
|--------|-------------|----------|
| 四消费方单源（推荐） | canonical/og:url/sitemap/robots 统一派生 | ✓ |
| 由 Claude 决定 | 按实现便利定消费面 | |

## 部署触发方式

| Option | Description | Selected |
|--------|-------------|----------|
| 新建 GitHub 公开仓（推荐） | 个人免费项目，Git 集成最顺 | ✓ |
| 新建 GitHub 私有仓 | 需授权，功能相同 | |
| 已有其它托管 | — | |

| Option | Description | Selected |
|--------|-------------|----------|
| EdgeOne Git 集成（推荐） | 推 main 即构建部署，零自建 CI | ✓ |
| GitHub Actions 流水线 | Actions 构建 + CLI 上传 | |
| 由 Claude 决定 | 研究阶段对比后定 | |

| Option | Description | Selected |
|--------|-------------|----------|
| build 命令链全门禁（推荐） | test+type-check+lint+check:chunks+build-only | ✓ |
| 仅 build | 测试/lint 靠本地把门 | |

**Notes:** 讨论中发现本地仓库无 git remote，GitHub 仓为首次新建。

## 零外链与验收自动化

| Option | Description | Selected |
|--------|-------------|----------|
| 系统字体栈保持（推荐） | 天然零外链；webfont 留 Phase 6（须自托管） | ✓ |
| Phase 3 自托管 webfont | 中文 MB 级需子集化，增加复杂度 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 硬卡：超限 fail（推荐） | 经 EdgeOne 构建链天然阻断部署 | ✓ |
| 警告不阻断 | 预算形同虚设 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 自动断言脚本（推荐） | 扫 dist：meta 非空、sitemap 一致、零外链；进门禁链 | ✓ |
| 人工 curl 抽验 | 无防回归保障 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 作者人工实测（推荐） | 大陆无代理网络 human-check | ✓ |
| Claude 起草实测清单 | 另附逐项清单 | |

**Notes:** 用户在「大陆验收」选项上未勾选清单子项，采纳纯人工实测口径（D-19）；清单式验收未被选择。

---

## Claude's Discretion

- sitemap 生成机制（onFinished vs 插件）
- check:chunks 扩展 vs 新增断言脚本的落点
- SITE_URL 文件位置与导出形式
- og meta 注入实现（useHead/useSeoMeta）
- EdgeOne 构建命令链写法
- 首页 description 文案内容
- 404 noindex 与首页 meta 的组件层实现

## Deferred Ideas

- 自托管 webfont → Phase 6
- EdgeOne 大陆加速区切换 → 备案通过后
- 自定义域名注册绑定 → 默认域名上线后按需
