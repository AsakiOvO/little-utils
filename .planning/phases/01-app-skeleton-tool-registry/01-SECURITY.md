---
phase: "1"
slug: "app-skeleton-tool-registry"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-09-07"
---

# Phase 1 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| npm registry → 本机 node_modules | 全部依赖进入点（@lucide/vue、CodeMirror 4 包、DOMPurify 等） | 供应链代码（高风险面） |
| 用户输入 → 工具页渲染 | 时间戳/日期文本、JSON 粘贴内容（可能含脚本载荷） | 用户自由文本 |
| 构建期（Node） → 预渲染产物 | vite-ssg / check-chunks（jiti 加载注册表） | 本地可信源码模块 |
| 输出 → 剪贴板 | useCopy 用户主动复制 | 无网络传输、无持久化 |

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-01-SC | Tampering | npm 依赖安装（全部计划） | high | mitigate | Package Legitimacy Audit（01-RESEARCH 审计表全 Approved）；packageManager: pnpm@11.25.0 锁定；lockfile 提交；@lucide/vue 经 blocking-human 人工闸门（01-02 Task 1，用户已批准，SUMMARY 记录在案）；零 postinstall 已验证 | closed |
| T-01-01 | Tampering / Elevation of Privilege | v-html 旁路 / JSON 输出渲染 | critical | mitigate | vnode 优先路线（两个工具零 HTML 字符串路径）；HTML 路径收敛 SafeHtml 唯一出口；ESLint vue/no-v-html error + ignorePattern 白名单（fail-first 探针实证 exit 1）；注入样本集（script/onerror/javascript:/onclick）vitest 回归全绿 | closed |
| T-01G-01 | Tampering / Input Validation | timestamp service 非法时区输入 | critical | mitigate | isValidTimeZone（Intl）守卫 + ok:false 结构化返回 + 5 service 测试 + 3 组件渲染期回归（01-05 交付，verifier node 探针三路径实证不抛） | closed |
| T-01-02 | Information Disclosure | 站点运行时外链/遥测 | medium | mitigate | 零 analytics/CDN 字体/遥测脚本基线；Phase 3 ARCH-05 零外链审计拥有完整预算 | closed |
| T-01-03 | Denial of Service | 模块顶层浏览器 API（构建期） | medium | mitigate | 浏览器 API 仅限 onMounted/守卫分支；vite-ssg build 每计划 verify 必绿（违纪即构建红） | closed |
| T-01-05 | Tampering | 用户输入回显（timestamp 页） | medium | mitigate | 全部输出 Vue 文本插值（vnode 自动转义），零 HTML 字符串构造；ESLint 卡口全站兜底 | closed |
| T-01-07 | Denial of Service | dayjs 插件顺序 | medium | mitigate | utc 先于 timezone 硬约束入 action + 18 service 测试（UTC/固定时区断言）全绿 | closed |
| T-01-10 | Tampering | CodeMirror 四包供应链 | medium | mitigate | 官方仓库、legitimacy 审计 OK、lockfile 锁定、无 postinstall | closed |
| T-01-11 | Information Disclosure | CodeMirror 进首包 | medium | mitigate | check-chunks.mjs 可执行断言（首包无 CM + 独立 chunk），fail-first 探针实证；jiti 注册表派生（无硬编码路由） | closed |
| T-01-04 | Tampering | 路由注入（恶意 path 元数据） | low | accept | 注册表为仓库内代码非运行时输入；assertRegistryInvariants 模块加载即校验；剩余风险为作者自伤型 | closed |
| T-01-06 | Information Disclosure | 剪贴板写入 | low | accept | 仅写用户主动复制内容；无网络传输；Phase 1 零 localStorage | closed |
| T-01-08 | Denial of Service | 无 window 环境 sanitize 崩溃 | low | mitigate | typeof window 守卫 + escapeHtml 退化 + 显式测试；build 持续验证 | closed |
| T-01-09 | Tampering | DOMPurify 供应链 | low | mitigate | cure53 官方、周下载 6430 万、审计 Approved、lockfile 锁定 | closed |
| T-01G-02 | Tampering（供应链） | 01-05 零新增 npm 安装 | low | accept | jiti 为既有 devDependency（Phase 1 已入 lockfile）；合法性闸门不触发 | closed |
| T-01G-03 | Denial of Service（构建期） | check-chunks jiti 加载注册表 | low | accept | 仅加载本地可信 TS 模块（顶层零浏览器 API）；违纪 fail-fast 属期望行为 | closed |
| T-01G-04 | Information Disclosure | 时区错误文案回显 | low | mitigate | 文案仅内插 tz 参数（短自由文本），不回显时间戳原文；V7 限流口径复用 | closed |

*Status: open · closed — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| T-01-04 | 路由注入 | 注册表为仓库内代码非运行时输入，不变量校验兜底，剩余为作者自伤型 | 作者 | 2026-09-07 |
| T-01-06 | 剪贴板信息面 | 仅用户主动复制内容出站，无传输无持久化 | 作者 | 2026-09-07 |
| T-01G-02 | 01-05 零新增依赖 | jiti 已在 lockfile，无新攻击面 | 作者 | 2026-09-07 |
| T-01G-03 | check-chunks 构建加载面 | 仅本地可信模块，fail-fast 属期望行为 | 作者 | 2026-09-07 |

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-07 | 16 | 16 | 0 | orchestrator（L1 short-circuit：threats_open 0 + 计划期登记 + ASVS L1） |

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] threats_open: 0 confirmed
- [x] status: verified set in frontmatter

**Approval:** verified 2026-09-07
