---
phase: 02-design-system-a11y-baseline
verified: 2026-09-09T09:20:00+08:00
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
coincidental_reliance_items: []
prohibition_verdicts:
  - statement: "页面与组件不得直接引用原语层色值,必须经语义层 var(--color-*) 消费(D-09)"
    verification: judgment
    verdict: resolved_with_documented_deviation
    evidence: >
      文本/选中/反馈类消费已全部改经 var(--color-accent*) 且由 WR-03 源码级守卫测试
      (Tabs/CopyableText/ToolCard)与 tokens.test.ts accent 12 组色对锁定;
      非文本用途(hover 独立描边、--color-focus 焦点环)保留原语引用 —— 为 02-REVIEW CR-01
      修复记录中的明确裁定(「边框按用途逐项裁定,留给后续」),非遗漏。
      建议作者在 Phase 6 强风格化前对 hover 描边用途做一次最终裁定。
  - statement: "主题切换不得引入全局过渡动画(D-11)"
    verdict: verified
    evidence: .theme-switching 中和规则(base.css)+ useThemeMode watch 挂类/双 rAF 移除 + 测试⑥断言
  - statement: "基础组件不得携带 glow 装饰(02-03)"
    verdict: verified
    evidence: src/ui/*.vue 零 glow 类(命中均为禁令注释)
  - statement: "唯一 package.json 变更 = 移除 oneDark;cm-theme 只准放工具目录内(02-05)"
    verdict: verified
    evidence: package.json/src 零 oneDark 残留;cm-theme.ts 位于 src/tools/json-formatter/components/;check:chunks OK
  - statement: "渲染纪律:CopyableText 展示区禁 v-html(02-07)"
    verdict: verified
    evidence: 展示区全 {{ }} 插值;唯一 v-html 出口为 Phase 1 既有的 safe-html.vue(sanitized 白名单)
---

# Phase 02: 设计系统 + a11y 基线 验证报告

**Phase Goal:** 用户在任何设备、任何主题下都能舒适使用站点——霓虹设计令牌统一视觉、暗色模式可切换且被记住、移动端输入不缩放、动效可随系统降级;工具操作区由中性基础组件保证克制易读
**Verified:** 2026-09-09T09:20:00+08:00
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths(Roadmap 成功准则)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 用户可切换暗色/亮色:默认暗色、可跟随系统、选择被持久记住 | ✓ VERIFIED | `useThemeMode.ts` 三态状态机(effectScope(true) detached 单例、initOnMounted、normalize 白名单、no-preference 回落暗)+ `useThemeMode.test.ts` 7 组行为测试(含⑦跨组件生命周期回归:mount→unmount→cycle→断言 html.dark/colorScheme,RED 复现→GREEN)全绿;`index.html` FOUC 镜像脚本 + `vite.config.ts` onBeforePageRender 预渲染 `class="dark"`;dist/index.html 实测同时含 `little-utils:v1:theme` 脚本与 `class="dark"`;D-23 验收项 4 作者直开通过 + 项 3 缺陷修复经 CDP 实证(html.dark/colorScheme/body 背景 oklch 0.97↔0.16 联动) |
| 2 | 手机完整工具操作:输入 ≥16px 不触发 iOS 缩放、触控 ≥44px | ✓ VERIFIED | `base.css` input/select/textarea 三选择器一体 `font-size: 16px`(置于 font: inherit 之后,注释引 Pitfall 4)+ base-rules.test.ts 内容断言;`Input.vue` 控件 text-base + min-h-11(双变体)、Button/ThemeToggle/not-found 返回键 min-h-11,组件测试锁定;D-23 项 1 作者 375px 设备模拟走查 JSON 工具全流程 PASS |
| 3 | 系统开启「减少动态效果」后动画自动降级 | ✓ VERIFIED | `base.css` D-22 全局中和块(animation/transition-duration 0.01ms !important + scroll-behavior: auto)+ base-rules.test.ts 断言;happy-dom 不算媒体查询,行为证据为 D-23 项 2 记录的 CDP 仿真实测:仿真 prefers-reduced-motion=reduce 下按钮 computed transition-duration = 1e-05s,清除后 0.15s 有效对照 |
| 4 | oklch 令牌贯穿全站、主题文字对比度 ≥4.5:1(可测量) | ✓ VERIFIED | `tokens.css` 三层体系(@theme 原语+亮色语义/:root accent+deep/.dark 暗色+accent 覆盖/--color-focus 组件层)与 `tokens.ts` 字面单点;`tokens.test.ts` 45 测试全绿:黑白 21:1 锚点、暗/亮 ≥20 色对、accent 12 组色对(亮=deep/暗=原语)、tokens.css↔tokens.ts readFileSync 同步断言、.dark 源顺序守卫;02-REVIEW CR-01(亮色原语作文本色 1.15–2.71:1)根因修复实证:tokens.css :56-61 deep 三色 + accent 角色,:66-97 .dark 覆盖,组件文本消费点(Tabs:35/CopyableText:23,73/ToolCard:11,16/Button:42/not-found:4/home.layout:11)全部经 accent |
| 5 | 基础组件就位、工具操作区无装饰干扰、克制易读 | ✓ VERIFIED | 六件套 Button/Input/Card/Tabs/CopyableText/ThemeToggle 全部存在且配就近测试(190 测试全绿);存量迁移收口:ToolCard(Card as=RouterLink)、home/not-found/Typography 归一、json-formatter(Button outline ×2 + :disabled、CopyableText ×2、Card :padding=false ×2、danger 错误卡、删页面级复制组合);六件套零 glow 类、零 v-html、零 style 块;oneDark 死依赖移除;check:chunks OK |

**Score:** 5/5 truths verified(0 present-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/styles/tokens.css` | 三层令牌 + accent 角色 + color-scheme 双声明 | ✓ VERIFIED | 105 行实质实现;deep 三色与 accent 分流(CR-01 修复)在位;.dark 置于 :root 之后(源顺序纪律) |
| `src/styles/tokens.ts` | tokens + parseOklch 色值单点 | ✓ VERIFIED | neon/dark/light 三组全语义变量含 *-deep,parseOklch 纯函数,零第三方色彩库 |
| `src/styles/tokens.test.ts` | 对比度/同步/源顺序双保险 | ✓ VERIFIED | 45 测试全绿,含 WR-03 增补 accent 色对与消费层守卫 |
| `src/styles/base.css` | 16px/reduced-motion/focus-visible/theme-switching 四规则 | ✓ VERIFIED | 四规则齐备,html 规则无硬编码 color-scheme(单源化) |
| `src/styles/base-rules.test.ts` | 五条内容断言 | ✓ VERIFIED | 5 测试全绿 |
| `src/composables/useThemeMode.ts`(+test) | 三态状态机 | ✓ VERIFIED | 含 D-23 detached effectScope 修复 + 回归⑦ |
| `src/ui/{Button,Input,Card,Tabs,CopyableText,ThemeToggle}.vue`(+test) | 六件套 | ✓ VERIFIED | 全部实质实现并消费语义令牌;测试 40+ 用例绿 |
| `src/tools/json-formatter/components/cm-theme.ts` + CodeMirrorJson.vue | CM 双主题 Compartment | ✓ VERIFIED | createCmTheme 消费 tokens.ts 字面值;Compartment reconfigure 不重建视图;watch(resolved) 接线 |
| `index.html` + `vite.config.ts` | FOUC 脚本 + 预渲染暗色 | ✓ VERIFIED | 镜像脚本在位;onBeforePageRender 幂等追加 dark 类;dist 产物实证 |
| `src/layouts/{home,tool}.layout.vue`、`home/not-found.vue`、`ToolCard.vue`、`json-formatter.vue` | 迁移 + ThemeToggle 挂载 | ✓ VERIFIED | 双 layout 显式 import ThemeToggle(D-18);WR-02 nav→span 修复在位 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| tokens.test.ts | tokens.css | readFileSync 同步断言 | ✓ WIRED | 45 测试中同步断言组全绿 |
| tokens.ts | tokens.css | oklch 字面逐字一致 | ✓ WIRED | 同步断言守护,改色即红 |
| base.css .theme-switching | useThemeMode watch | 类挂载/双 rAF 配对 | ✓ WIRED | 测试⑥断言;两处注释互指 |
| index.html 内联脚本 | useThemeMode | storage key + 判定镜像 | ✓ WIRED | 镜像文本断言守护;key 字面一致 |
| ThemeToggle.vue | useThemeMode | preference/cycle 消费 | ✓ WIRED | 显式 import,双 layout 挂载 |
| CodeMirrorJson.vue | useThemeMode/cm-theme | resolved watch → reconfigure | ✓ WIRED | Compartment 接线在位 |
| ToolCard/home/not-found/json-formatter | 六件套 | 显式 import 消费 | ✓ WIRED | 迁移收口,无新旧并存 |
| CopyableText.vue | useCopy.ts | 能力层封装 | ✓ WIRED | 三态反馈 + 双层降级测试覆盖 |

### Data-Flow Trace(Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| useThemeMode preference | localStorage `little-utils:v1:theme` | useStorage + normalize 白名单 | ✓ | FLOWING |
| ThemeToggle 图标/aria-label | preference | 单例 computed 链 | ✓ | FLOWING |
| CopyableText 反馈 | 复制结果 | useCopy 真实剪贴板 API | ✓ | FLOWING |
| CodeMirror 主题 | resolved | useThemeMode 单例 | ✓ | FLOWING |
| 预渲染 html.dark | — | onBeforePageRender 构建期 | ✓ | FLOWING(dist 实证) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 全量测试 | `corepack pnpm vitest run` | 18 files / 190 tests passed | ✓ PASS |
| 类型检查 | `corepack pnpm type-check` | exit 0 | ✓ PASS |
| chunk 门禁 | `corepack pnpm check:chunks` | OK: chunk budget pass | ✓ PASS |
| 预渲染产物 | grep dist/index.html | FOUC 脚本 1 命中 + class="dark" | ✓ PASS |
| oneDark 移除 | grep src/ + package.json | 零残留 | ✓ PASS |
| preview server | curl :4174 | 连接失败(HTTP 000) | ? SKIP(验收环境已关闭;D-23 已有 CDP 记录) |

### Probe Execution

本阶段无 `scripts/*/tests/probe-*.sh` 声明;probe 等价物为五项门禁链(全量 vitest/type-check/lint/build/check:chunks),本次独立复跑其中三项(上表)+ 复用 02-REVIEW-FIX 的 lint 0 警告记录。PASS。

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| STYL-01 | 02-01, 02-05 | oklch 设计令牌 + 霓虹文字对比度 ≥4.5:1 | ✓ SATISFIED | Truth #4;tokens.test.ts 45 测试 |
| STYL-03 | 02-01, 02-03, 02-06 | reduced-motion 降级 + 工具区克制 | ✓ SATISFIED | Truth #3 + #5 |
| SITE-04 | 02-02, 02-05 | 主题切换(默认暗/跟随系统/持久化) | ✓ SATISFIED | Truth #1 |
| SITE-05 | 02-01, 02-03, 02-04, 02-07 | 移动端可用(16px/44px) | ✓ SATISFIED | Truth #2 + #5 |

REQUIREMENTS.md Traceability 表中四项均标记 Phase 2 Complete,与计划声明一致,**无孤儿需求**。

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| json-formatter.service.ts | 105 | `uXXXX` 命中 XXX 正则 | ℹ️ Info | 误报——ECMA-404 转义文档注释,非债务标记 |

零 TBD/FIXME/TODO 债务标记;零 stub;零 glow/v-html 违规(命中均为禁令注释;safe-html.vue 为 Phase 1 既有唯一 v-html 出口)。

### Human Verification Required

无未决项。D-23 人工验收四项已于 2026-09-08 闭环并记录于 02-07-SUMMARY「D-23 Manual Acceptance」节(项 1/4 作者通过,项 2 引导澄清 + CDP 仿真实证,项 3 缺陷修复 + 回归测试⑦ + CDP 双防线)。

**移交备注(judgment-tier,非阻塞):**
1. D-09 禁令的非文本用途豁免(hover 描边/焦点环直连原语)是审查修复时的明确裁定,建议 Phase 6 强风格化前由作者最终确认。
2. reduced-motion 真机(OS 级设置)复核可选——已有 CDP 仿真实测记录(1e-05s ↔ 0.15s 对照),但真机走查成本极低,verify-work 人工检查点可顺手复核。
3. 站内可见 motion toggle 属产品决策(Rule 4),已记录 deferred-items.md,不计入本阶段 SC。

### Gaps Summary

无阻塞缺口。Code review 1 Critical / 3 Warning 全部修复且经本次独立核查确认落地(CR-01 accent 根因修复在 tokens.css 与全部消费点实证;WR-01 id 顺序、WR-02 nav→span、WR-03 守卫测试均在位)。Phase 目标达成,可进入下一阶段。

---

_Verified: 2026-09-09T09:20:00+08:00_
_Verifier: Claude (gsd-verifier)_
